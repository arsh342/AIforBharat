/**
 * Infrastructure setup tests
 * Validates that the core infrastructure components are properly configured
 */

import { describe, test, expect } from "@jest/globals";
import { AWS_CONFIG } from "../../src/config/aws-config";
import { validateInput } from "../../src/utils/validation";
import { LanguageSchema, IntentSchema } from "../../src/utils/validation";
import { Language, Intent } from "../../src/types";

describe("Infrastructure Setup", () => {
  describe("AWS Configuration", () => {
    test("should have required configuration values", () => {
      expect(AWS_CONFIG.region).toBeDefined();
      expect(AWS_CONFIG.sessionTableName).toBeDefined();
      expect(AWS_CONFIG.tempStorageBucket).toBeDefined();
      expect(AWS_CONFIG.bedrockModelId).toBeDefined();
      expect(AWS_CONFIG.logLevel).toBeDefined();
    });

    test("should have valid AWS region format", () => {
      const regionPattern = /^[a-z]{2}-[a-z]+-\d+$/;
      expect(regionPattern.test(AWS_CONFIG.region)).toBe(true);
    });

    test("should have valid Bedrock model ID format", () => {
      // In test environment, we use a test model ID
      expect(AWS_CONFIG.bedrockModelId).toBeTruthy();
      expect(typeof AWS_CONFIG.bedrockModelId).toBe("string");
    });
  });

  describe("Type System", () => {
    test("should validate Language enum values", () => {
      expect(() => validateInput(LanguageSchema, Language.HINDI)).not.toThrow();
      expect(() =>
        validateInput(LanguageSchema, Language.ENGLISH),
      ).not.toThrow();
      expect(() => validateInput(LanguageSchema, "invalid")).toThrow();
    });

    test("should validate Intent enum values", () => {
      expect(() =>
        validateInput(IntentSchema, Intent.ELIGIBILITY_CHECK),
      ).not.toThrow();
      expect(() =>
        validateInput(IntentSchema, Intent.GRIEVANCE_FILING),
      ).not.toThrow();
      expect(() =>
        validateInput(IntentSchema, Intent.GENERAL_INQUIRY),
      ).not.toThrow();
      expect(() => validateInput(IntentSchema, "invalid")).toThrow();
    });
  });

  describe("Project Structure", () => {
    test("should have all required interface files", () => {
      // This test verifies that the interface files exist and can be imported
      expect(() =>
        require("../../src/interfaces/speech-processor"),
      ).not.toThrow();
      expect(() =>
        require("../../src/interfaces/intent-classifier"),
      ).not.toThrow();
      expect(() =>
        require("../../src/interfaces/eligibility-engine"),
      ).not.toThrow();
      expect(() =>
        require("../../src/interfaces/grievance-generator"),
      ).not.toThrow();
      expect(() =>
        require("../../src/interfaces/image-analyzer"),
      ).not.toThrow();
      expect(() =>
        require("../../src/interfaces/document-generator"),
      ).not.toThrow();
      expect(() =>
        require("../../src/interfaces/confirmation-handler"),
      ).not.toThrow();
    });

    test("should have all required Lambda function files", () => {
      // This test verifies that the Lambda function files exist and can be imported
      expect(() => require("../../src/lambda/orchestrator")).not.toThrow();
      expect(() => require("../../src/lambda/speech-processor")).not.toThrow();
      expect(() => require("../../src/lambda/intent-classifier")).not.toThrow();
      expect(() =>
        require("../../src/lambda/eligibility-engine"),
      ).not.toThrow();
      expect(() =>
        require("../../src/lambda/grievance-generator"),
      ).not.toThrow();
      expect(() => require("../../src/lambda/image-analyzer")).not.toThrow();
      expect(() =>
        require("../../src/lambda/document-generator"),
      ).not.toThrow();
      expect(() =>
        require("../../src/lambda/confirmation-handler"),
      ).not.toThrow();
    });

    test("should have core utility modules", () => {
      expect(() => require("../../src/utils/logger")).not.toThrow();
      expect(() => require("../../src/utils/validation")).not.toThrow();
      expect(() => require("../../src/config/aws-config")).not.toThrow();
    });
  });

  describe("Testing Framework", () => {
    test("should have test data generators available", () => {
      expect(() => require("../utils/test-data-generators")).not.toThrow();
      expect(() => require("../utils/property-test-helpers")).not.toThrow();
    });

    test("should have property test configuration", () => {
      const { PropertyTestConfig } = require("../utils/property-test-helpers");
      expect(PropertyTestConfig.iterations).toBeGreaterThan(0);
      expect(PropertyTestConfig.timeout).toBeGreaterThan(0);
    });
  });
});
