/**
 * Test setup and configuration
 * Enhanced with property-based testing support and comprehensive mocking
 */

import { jest } from "@jest/globals";

// Extend Jest timeout for property-based tests
jest.setTimeout(30000);

// Mock AWS SDK clients for testing
jest.mock("@aws-sdk/client-bedrock-runtime");
jest.mock("@aws-sdk/client-transcribe");
jest.mock("@aws-sdk/client-rekognition");
jest.mock("@aws-sdk/client-s3");
jest.mock("@aws-sdk/client-dynamodb");
jest.mock("@aws-sdk/lib-dynamodb");

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Test environment variables
process.env.NODE_ENV = "test";
process.env.AWS_REGION = "us-east-1";
process.env.SESSION_TABLE_NAME = "test-sessions";
process.env.TEMP_STORAGE_BUCKET = "test-temp-storage";
process.env.KMS_KEY_ID = "test-key-id";
process.env.BEDROCK_MODEL_ID = "test-model-id";
process.env.LOG_LEVEL = "ERROR";

// Setup test utilities
export const testConfig = {
  aws: {
    region: "us-east-1",
    sessionTableName: "test-sessions",
    tempStorageBucket: "test-temp-storage",
    kmsKeyId: "test-key-id",
    bedrockModelId: "test-model-id",
  },
  testing: {
    propertyTestIterations: 100,
    timeoutMs: 30000,
    maxRetries: 3,
  },
  propertyTesting: {
    // Configuration for property-based testing
    maxExamples: process.env.CI ? 1000 : 100,
    maxShrinks: 100,
    seed: process.env.PROPERTY_TEST_SEED
      ? parseInt(process.env.PROPERTY_TEST_SEED)
      : undefined,
  },
};

// Test data generators for property-based testing
export const testGenerators = {
  // Generate valid session IDs
  sessionId: () => {
    const chars = "abcdef0123456789";
    const segments = [8, 4, 4, 4, 12];
    return segments
      .map((len) =>
        Array.from(
          { length: len },
          () => chars[Math.floor(Math.random() * chars.length)],
        ).join(""),
      )
      .join("-");
  },

  // Generate valid Hindi/English text
  multilangText: (language: "hi" | "en" = "en") => {
    const englishWords = [
      "hello",
      "help",
      "scheme",
      "eligibility",
      "complaint",
      "hospital",
      "doctor",
      "medicine",
    ];
    const hindiWords = [
      "नमस्ते",
      "सहायता",
      "योजना",
      "योग्यता",
      "शिकायत",
      "अस्पताल",
      "डॉक्टर",
      "दवा",
    ];

    const words = language === "hi" ? hindiWords : englishWords;
    const length = Math.floor(Math.random() * 10) + 3;

    return Array.from(
      { length },
      () => words[Math.floor(Math.random() * words.length)],
    ).join(" ");
  },

  // Generate valid Indian addresses
  indianAddress: () => ({
    district: ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata"][
      Math.floor(Math.random() * 5)
    ],
    state: ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "West Bengal"][
      Math.floor(Math.random() * 5)
    ],
    pincode: String(Math.floor(Math.random() * 900000) + 100000),
    village:
      Math.random() > 0.5
        ? `Village${Math.floor(Math.random() * 100)}`
        : undefined,
  }),

  // Generate valid household information
  householdInfo: () => {
    const relations = ["head", "spouse", "child", "parent"];
    const genders = ["male", "female"];
    const incomeCategories = [
      "below_poverty_line",
      "above_poverty_line",
      "secc_eligible",
    ];
    const housingTypes = ["kutcha", "semi_pucca", "pucca"];

    const memberCount = Math.floor(Math.random() * 6) + 1;
    const members = Array.from({ length: memberCount }, (_, i) => ({
      name: `Person${i + 1}`,
      age: Math.floor(Math.random() * 80) + 1,
      gender: genders[Math.floor(Math.random() * genders.length)],
      relation:
        i === 0
          ? "head"
          : relations[Math.floor(Math.random() * relations.length)],
    }));

    return {
      headOfHousehold: members[0],
      members: members.slice(1),
      address: testGenerators.indianAddress(),
      economicStatus: {
        incomeCategory:
          incomeCategories[Math.floor(Math.random() * incomeCategories.length)],
        housingType:
          housingTypes[Math.floor(Math.random() * housingTypes.length)],
        assets: [],
      },
      existingSchemes: [],
    };
  },

  // Generate audio buffer (mock)
  audioBuffer: (sizeKB: number = 100) => {
    const size = sizeKB * 1024;
    const buffer = Buffer.alloc(size);
    // Add WAV header for format validation
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(size - 8, 4);
    buffer.write("WAVE", 8);
    return buffer;
  },

  // Generate image buffer (mock)
  imageBuffer: (sizeKB: number = 500) => {
    const size = sizeKB * 1024;
    const buffer = Buffer.alloc(size);
    // Add JPEG header for format validation
    buffer[0] = 0xff;
    buffer[1] = 0xd8;
    buffer[2] = 0xff;
    return buffer;
  },
};

// Mock AWS service responses
export const mockAWSResponses = {
  transcribe: {
    success: {
      TranscriptionJob: {
        TranscriptionJobStatus: "COMPLETED",
        Transcript: {
          TranscriptFileUri: "https://example.com/transcript.json",
        },
      },
    },
    transcript: {
      results: {
        transcripts: [
          {
            transcript: "मुझे योजना की जांच करनी है",
          },
        ],
        items: [],
      },
    },
  },

  bedrock: {
    success: {
      body: new TextEncoder().encode(
        JSON.stringify({
          content: [
            {
              text: "This is a mock Bedrock response for testing purposes.",
            },
          ],
          usage: {
            input_tokens: 10,
            output_tokens: 15,
          },
        }),
      ),
    },
  },

  rekognition: {
    detectText: {
      TextDetections: [
        {
          DetectedText: "Hospital Bill",
          Type: "LINE",
          Id: 0,
          Confidence: 95.5,
          Geometry: {
            BoundingBox: {
              Width: 0.5,
              Height: 0.1,
              Left: 0.25,
              Top: 0.1,
            },
          },
        },
      ],
    },
  },

  dynamodb: {
    putItem: { $metadata: { httpStatusCode: 200 } },
    getItem: {
      Item: {
        sessionId: "test-session-id",
        language: "en",
        conversationHistory: [],
        currentIntent: "inquiry",
        createdAt: new Date().toISOString(),
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
      },
    },
    updateItem: { $metadata: { httpStatusCode: 200 } },
    deleteItem: { $metadata: { httpStatusCode: 200 } },
  },

  s3: {
    putObject: { $metadata: { httpStatusCode: 200 } },
    getObject: {
      Body: Buffer.from("test file content"),
      ContentType: "application/octet-stream",
    },
    deleteObject: { $metadata: { httpStatusCode: 200 } },
  },
};

// Test utilities for property-based testing
export const propertyTestUtils = {
  // Run a property test with custom configuration
  runPropertyTest: async (
    testFn: (input: any) => Promise<boolean> | boolean,
    generator: () => any,
    options: {
      examples?: number;
      timeout?: number;
      description?: string;
    } = {},
  ) => {
    const examples = options.examples || testConfig.propertyTesting.maxExamples;
    const timeout = options.timeout || testConfig.testing.timeoutMs;

    const startTime = Date.now();
    let passedExamples = 0;
    let failedExamples: any[] = [];

    for (let i = 0; i < examples; i++) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Property test timed out after ${timeout}ms`);
      }

      try {
        const input = generator();
        const result = await testFn(input);

        if (result) {
          passedExamples++;
        } else {
          failedExamples.push(input);
          if (failedExamples.length > 10) break; // Stop after 10 failures
        }
      } catch (error) {
        failedExamples.push({ input: generator(), error: String(error) });
        if (failedExamples.length > 10) break;
      }
    }

    return {
      passed: failedExamples.length === 0,
      passedExamples,
      failedExamples,
      totalExamples: Math.min(examples, passedExamples + failedExamples.length),
    };
  },

  // Shrink a failing example to find minimal case
  shrinkExample: (example: any, testFn: (input: any) => boolean): any => {
    // Simple shrinking strategy - this would be more sophisticated in a real implementation
    if (typeof example === "string" && example.length > 1) {
      const shorter = example.slice(0, Math.floor(example.length / 2));
      if (!testFn(shorter)) {
        return propertyTestUtils.shrinkExample(shorter, testFn);
      }
    }

    if (typeof example === "number" && Math.abs(example) > 1) {
      const smaller = Math.floor(example / 2);
      if (!testFn(smaller)) {
        return propertyTestUtils.shrinkExample(smaller, testFn);
      }
    }

    return example;
  },
};
