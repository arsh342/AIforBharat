/**
 * AWS Configuration and Service Initialization
 * Centralized configuration management for all AWS services
 */

import {
  BedrockRuntimeClient,
  BedrockRuntimeClientConfig,
} from "@aws-sdk/client-bedrock-runtime";
import {
  TranscribeClient,
  TranscribeClientConfig,
} from "@aws-sdk/client-transcribe";
import {
  RekognitionClient,
  RekognitionClientConfig,
} from "@aws-sdk/client-rekognition";
import { S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { SystemConfig, Language } from "../types";

// Environment-based configuration
const getSystemConfig = (): SystemConfig => {
  const region = process.env.AWS_REGION || "us-east-1";

  return {
    aws: {
      region,
      s3Bucket: process.env.TEMP_STORAGE_BUCKET || "voice-civic-assistant-temp",
      dynamoTableName:
        process.env.SESSION_TABLE_NAME || "voice-civic-assistant-sessions",
      bedrockModelId:
        process.env.BEDROCK_MODEL_ID ||
        "anthropic.claude-3-sonnet-20240229-v1:0",
    },
    ai: {
      transcribeLanguages: [Language.HINDI, Language.ENGLISH],
      bedrockModels: {
        claude: "anthropic.claude-3-sonnet-20240229-v1:0",
        titan: "amazon.titan-text-express-v1",
      },
      confidenceThresholds: {
        speech: 0.8,
        intent: 0.7,
        eligibility: 0.9,
        imageAnalysis: 0.75,
      },
    },
    security: {
      encryptionKeyId: process.env.KMS_KEY_ID || "",
      dataRetentionHours: 24,
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || ["*"],
    },
    performance: {
      timeoutSeconds: 30,
      maxConcurrentRequests: 100,
      cacheTTLSeconds: 300,
    },
  };
};

// Singleton configuration instance
export const config = getSystemConfig();

// Legacy AWS_CONFIG for backward compatibility
export const AWS_CONFIG = {
  region: config.aws.region,
  sessionTableName: config.aws.dynamoTableName,
  tempStorageBucket: config.aws.s3Bucket,
  kmsKeyId: config.security.encryptionKeyId,
  bedrockModelId: config.aws.bedrockModelId,
  logLevel: process.env.LOG_LEVEL || "INFO",
};

// Common client configuration
const commonConfig = {
  region: config.aws.region,
  maxAttempts: 3,
  requestTimeout: config.performance.timeoutSeconds * 1000,
};

// Bedrock Runtime Client
const bedrockConfig: BedrockRuntimeClientConfig = {
  ...commonConfig,
  maxAttempts: 2, // Bedrock has lower retry tolerance
};

export const bedrockClient = new BedrockRuntimeClient(bedrockConfig);

// Transcribe Client
const transcribeConfig: TranscribeClientConfig = {
  ...commonConfig,
};

export const transcribeClient = new TranscribeClient(transcribeConfig);

// Rekognition Client
const rekognitionConfig: RekognitionClientConfig = {
  ...commonConfig,
};

export const rekognitionClient = new RekognitionClient(rekognitionConfig);

// S3 Client
const s3Config: S3ClientConfig = {
  ...commonConfig,
  forcePathStyle: false,
};

export const s3Client = new S3Client(s3Config);

// DynamoDB Client
const dynamoConfig: DynamoDBClientConfig = {
  ...commonConfig,
};

export const dynamoClient = new DynamoDBClient(dynamoConfig);
export const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

// Service configuration validation
export function validateAWSConfig(): void {
  const requiredEnvVars = [
    "SESSION_TABLE_NAME",
    "TEMP_STORAGE_BUCKET",
    "KMS_KEY_ID",
    "BEDROCK_MODEL_ID",
  ];

  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}

// Configuration validation with detailed checks
export const validateConfig = (): void => {
  validateAWSConfig();

  // Additional validation for AI thresholds
  const thresholds = config.ai.confidenceThresholds;
  Object.entries(thresholds).forEach(([key, value]) => {
    if (value < 0 || value > 1) {
      throw new Error(
        `Invalid confidence threshold for ${key}: ${value}. Must be between 0 and 1.`,
      );
    }
  });

  // Validate performance settings
  if (config.performance.timeoutSeconds <= 0) {
    throw new Error("Timeout seconds must be positive");
  }

  if (config.performance.maxConcurrentRequests <= 0) {
    throw new Error("Max concurrent requests must be positive");
  }
};

// Initialize configuration on module load
if (process.env.NODE_ENV !== "test") {
  validateConfig();
}
