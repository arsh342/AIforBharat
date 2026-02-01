/**
 * Intent Classifier Interface
 * Determines user intent from natural language input
 */

import {
  IntentResult,
  ClarificationQuestion,
  ConversationContext,
} from "../types";

export interface IntentClassifier {
  /**
   * Classify user intent from text input
   * @param text User input text
   * @param context Current conversation context
   * @returns Intent classification result
   */
  classifyIntent(
    text: string,
    context: ConversationContext,
  ): Promise<IntentResult>;

  /**
   * Generate clarification question for ambiguous input
   * @param ambiguousInput User input that needs clarification
   * @param context Current conversation context
   * @returns Clarification question to ask user
   */
  askClarification(
    ambiguousInput: string,
    context: ConversationContext,
  ): Promise<ClarificationQuestion>;

  /**
   * Update conversation context based on new input
   * @param context Current conversation context
   * @param userInput New user input
   * @param intentResult Classification result
   * @returns Updated conversation context
   */
  updateContext(
    context: ConversationContext,
    userInput: string,
    intentResult: IntentResult,
  ): Promise<ConversationContext>;

  /**
   * Check if intent classification confidence is sufficient
   * @param intentResult Classification result
   * @returns True if confidence is above threshold
   */
  isConfidenceAcceptable(intentResult: IntentResult): boolean;
}
