/**
 * Session Management Utilities
 * Handles user session lifecycle and conversation state
 */

import { v4 as uuidv4 } from "uuid";
import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { dynamoDocClient, config } from "../config/aws-config";
import {
  UserSession,
  ConversationTurn,
  ConversationContext,
  Language,
  Intent,
  ExtractedEntity,
} from "../types";
import { VoiceCivicAssistantError, ErrorCode } from "./error-handler";

export class SessionManager {
  private readonly tableName: string;
  private readonly ttlHours: number;

  constructor() {
    this.tableName = config.aws.dynamoTableName;
    this.ttlHours = config.security.dataRetentionHours;
  }

  /**
   * Create a new user session
   */
  async createSession(
    language: Language = Language.ENGLISH,
    userId?: string,
  ): Promise<UserSession> {
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.ttlHours * 60 * 60 * 1000);

    const session: UserSession = {
      sessionId,
      userId,
      language,
      conversationHistory: [],
      currentIntent: Intent.GENERAL_INQUIRY,
      createdAt: now,
      expiresAt,
    };

    try {
      await dynamoDocClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: {
            ...session,
            expiresAt: Math.floor(expiresAt.getTime() / 1000), // DynamoDB TTL expects Unix timestamp
          },
        }),
      );

      return session;
    } catch (error) {
      throw new VoiceCivicAssistantError(
        ErrorCode.AWS_SERVICE_ERROR,
        `Failed to create session: ${error}`,
        undefined,
        { sessionId, error: String(error) },
      );
    }
  }

  /**
   * Retrieve an existing session
   */
  async getSession(sessionId: string): Promise<UserSession | null> {
    try {
      const result = await dynamoDocClient.send(
        new GetCommand({
          TableName: this.tableName,
          Key: { sessionId },
        }),
      );

      if (!result.Item) {
        return null;
      }

      // Convert TTL timestamp back to Date
      const session = {
        ...result.Item,
        expiresAt: new Date(result.Item.expiresAt * 1000),
        createdAt: new Date(result.Item.createdAt),
        conversationHistory: result.Item.conversationHistory.map(
          (turn: any) => ({
            ...turn,
            timestamp: new Date(turn.timestamp),
          }),
        ),
      } as UserSession;

      // Check if session has expired
      if (session.expiresAt < new Date()) {
        await this.deleteSession(sessionId);
        return null;
      }

      return session;
    } catch (error) {
      throw new VoiceCivicAssistantError(
        ErrorCode.AWS_SERVICE_ERROR,
        `Failed to retrieve session: ${error}`,
        undefined,
        { sessionId, error: String(error) },
      );
    }
  }

  /**
   * Update session with new conversation turn
   */
  async addConversationTurn(
    sessionId: string,
    userInput: string,
    systemResponse: string,
    intent: Intent,
    entities: ExtractedEntity[] = [],
  ): Promise<void> {
    const turn: ConversationTurn = {
      timestamp: new Date(),
      userInput,
      systemResponse,
      intent,
      entities,
    };

    try {
      await dynamoDocClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { sessionId },
          UpdateExpression:
            "SET conversationHistory = list_append(if_not_exists(conversationHistory, :empty_list), :turn), currentIntent = :intent",
          ExpressionAttributeValues: {
            ":turn": [turn],
            ":intent": intent,
            ":empty_list": [],
          },
        }),
      );
    } catch (error) {
      throw new VoiceCivicAssistantError(
        ErrorCode.AWS_SERVICE_ERROR,
        `Failed to update session: ${error}`,
        undefined,
        { sessionId, error: String(error) },
      );
    }
  }

  /**
   * Update session language preference
   */
  async updateLanguage(sessionId: string, language: Language): Promise<void> {
    try {
      await dynamoDocClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { sessionId },
          UpdateExpression: "SET #lang = :language",
          ExpressionAttributeNames: {
            "#lang": "language",
          },
          ExpressionAttributeValues: {
            ":language": language,
          },
        }),
      );
    } catch (error) {
      throw new VoiceCivicAssistantError(
        ErrorCode.AWS_SERVICE_ERROR,
        `Failed to update session language: ${error}`,
        undefined,
        { sessionId, language, error: String(error) },
      );
    }
  }

  /**
   * Delete a session (for privacy compliance)
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      await dynamoDocClient.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: { sessionId },
        }),
      );
    } catch (error) {
      throw new VoiceCivicAssistantError(
        ErrorCode.AWS_SERVICE_ERROR,
        `Failed to delete session: ${error}`,
        undefined,
        { sessionId, error: String(error) },
      );
    }
  }

  /**
   * Get conversation context for AI processing
   */
  async getConversationContext(
    sessionId: string,
  ): Promise<ConversationContext | null> {
    const session = await this.getSession(sessionId);

    if (!session) {
      return null;
    }

    // Extract accumulated information from conversation history
    const accumulatedInfo: Record<string, any> = {};

    session.conversationHistory.forEach((turn) => {
      turn.entities.forEach((entity) => {
        if (!accumulatedInfo[entity.type]) {
          accumulatedInfo[entity.type] = [];
        }
        accumulatedInfo[entity.type].push({
          value: entity.value,
          confidence: entity.confidence,
          timestamp: turn.timestamp,
        });
      });
    });

    return {
      sessionId: session.sessionId,
      currentIntent: session.currentIntent,
      language: session.language,
      accumulatedInfo,
      conversationHistory: session.conversationHistory,
    };
  }

  /**
   * Clean up expired sessions (for maintenance)
   */
  async cleanupExpiredSessions(): Promise<number> {
    // Note: DynamoDB TTL will automatically handle this, but this method
    // can be used for manual cleanup if needed

    // In a production system, you might implement a scan operation
    // to find and delete expired sessions, but TTL is more efficient

    return 0; // Placeholder - TTL handles automatic cleanup
  }

  /**
   * Get session statistics (for monitoring)
   */
  async getSessionStats(sessionId: string): Promise<{
    conversationTurns: number;
    sessionDuration: number;
    lastActivity: Date;
    intents: Record<Intent, number>;
  } | null> {
    const session = await this.getSession(sessionId);

    if (!session) {
      return null;
    }

    const now = new Date();
    const sessionDuration = now.getTime() - session.createdAt.getTime();
    const lastActivity =
      session.conversationHistory.length > 0
        ? session.conversationHistory[session.conversationHistory.length - 1]
            .timestamp
        : session.createdAt;

    // Count intents
    const intents: Record<Intent, number> = {
      [Intent.ELIGIBILITY_CHECK]: 0,
      [Intent.GRIEVANCE_FILING]: 0,
      [Intent.GENERAL_INQUIRY]: 0,
    };

    session.conversationHistory.forEach((turn) => {
      intents[turn.intent] = (intents[turn.intent] || 0) + 1;
    });

    return {
      conversationTurns: session.conversationHistory.length,
      sessionDuration,
      lastActivity,
      intents,
    };
  }
}

// Singleton instance
export const sessionManager = new SessionManager();
