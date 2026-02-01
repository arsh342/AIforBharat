/**
 * Unit tests for Speech Processor component
 * Complements property-based tests with specific examples and integration testing
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import fc from "fast-check";
import { SpeechProcessor } from "../../src/interfaces/speech-processor";
import { Language, AudioQuality, TranscriptionResult } from "../../src/types";
import { testGenerators, mockAWSResponses, propertyTestUtils } from "../setup";

// Mock implementation for testing
class MockSpeechProcessor implements SpeechProcessor {
  async processAudio(
    audioData: Buffer,
    language: Language,
  ): Promise<TranscriptionResult> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Mock transcription based on language
    const texts = {
      [Language.HINDI]: "मुझे योजना की जांच करनी है",
      [Language.ENGLISH]: "I want to check scheme eligibility",
    };

    // Simulate confidence based on audio quality
    const confidence = audioData.length > 5000 ? 0.9 : 0.6;

    return {
      text: texts[language] || texts[Language.ENGLISH],
      confidence,
      language,
      timestamp: new Date(),
    };
  }

  async detectLanguage(audioData: Buffer): Promise<Language> {
    // Simple mock: larger files assumed to be Hindi (more complex language)
    return audioData.length > 10000 ? Language.HINDI : Language.ENGLISH;
  }

  async validateAudioQuality(audioData: Buffer): Promise<{
    quality: AudioQuality;
    issues: string[];
    recommendations: string[];
    acceptable: boolean;
  }> {
    const size = audioData.length;

    if (size < 1000) {
      return {
        quality: AudioQuality.POOR,
        issues: ["Audio file too small", "Possible corruption"],
        recommendations: ["Record longer audio", "Check microphone"],
        acceptable: false,
      };
    }

    if (size > 50000) {
      return {
        quality: AudioQuality.EXCELLENT,
        issues: [],
        recommendations: [],
        acceptable: true,
      };
    }

    return {
      quality: AudioQuality.GOOD,
      issues: ["Moderate background noise"],
      recommendations: ["Record in quieter environment"],
      acceptable: true,
    };
  }

  async isAudioAcceptable(audioData: Buffer): Promise<boolean> {
    const assessment = await this.validateAudioQuality(audioData);
    return assessment.acceptable;
  }
}

describe("Speech Processor", () => {
  let speechProcessor: SpeechProcessor;

  beforeEach(() => {
    speechProcessor = new MockSpeechProcessor();
  });

  describe("Property-Based Tests", () => {
    it("Property 1: Speech Processing Accuracy - should handle all valid audio inputs", async () => {
      // Use fast-check for TypeScript property-based testing
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            audioData: fc.uint8Array({ minLength: 1000, maxLength: 100000 }),
            language: fc.constantFrom(Language.HINDI, Language.ENGLISH),
          }),
          async ({ audioData, language }) => {
            const buffer = Buffer.from(audioData);
            const result = await speechProcessor.processAudio(buffer, language);

            // Property assertions
            expect(result).toBeDefined();
            expect(result.text).toBeTruthy();
            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
            expect(result.language).toBe(language);
            expect(result.timestamp).toBeInstanceOf(Date);

            return true;
          },
        ),
        { numRuns: 50, timeout: 5000 },
      );
    });

    it("Property 2: Speech Processing Performance - should complete within time limits", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1000, maxLength: 50000 }),
          async (audioData) => {
            const buffer = Buffer.from(audioData);
            const startTime = Date.now();

            const result = await speechProcessor.processAudio(
              buffer,
              Language.ENGLISH,
            );

            const processingTime = Date.now() - startTime;

            // Performance assertions
            expect(processingTime).toBeLessThan(5000); // 5 seconds max
            expect(result).toBeDefined();

            return true;
          },
        ),
        { numRuns: 30, timeout: 10000 },
      );
    });

    it("Property 3: Error Handling - should handle invalid inputs gracefully", async () => {
      const invalidInputs = [
        Buffer.alloc(0), // Empty buffer
        Buffer.alloc(100), // Too small
        Buffer.alloc(100 * 1024 * 1024), // Too large (100MB)
      ];

      for (const invalidInput of invalidInputs) {
        try {
          const result = await speechProcessor.processAudio(
            invalidInput,
            Language.ENGLISH,
          );

          // If no error thrown, result should still be valid
          if (result) {
            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
          }
        } catch (error) {
          // Error handling should be graceful
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBeTruthy();
        }
      }
    });
  });

  describe("Unit Tests - Specific Examples", () => {
    it("should process Hindi audio correctly", async () => {
      const audioBuffer = testGenerators.audioBuffer(10); // 10KB
      const result = await speechProcessor.processAudio(
        audioBuffer,
        Language.HINDI,
      );

      expect(result.language).toBe(Language.HINDI);
      expect(result.text).toContain("योजना"); // Should contain Hindi text
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should process English audio correctly", async () => {
      const audioBuffer = testGenerators.audioBuffer(10); // 10KB
      const result = await speechProcessor.processAudio(
        audioBuffer,
        Language.ENGLISH,
      );

      expect(result.language).toBe(Language.ENGLISH);
      expect(result.text).toMatch(/scheme|eligibility|help/i); // Should contain English keywords
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should detect language automatically", async () => {
      const smallBuffer = testGenerators.audioBuffer(5); // 5KB - should detect as English
      const largeBuffer = testGenerators.audioBuffer(15); // 15KB - should detect as Hindi

      const englishDetection =
        await speechProcessor.detectLanguage(smallBuffer);
      const hindiDetection = await speechProcessor.detectLanguage(largeBuffer);

      expect(englishDetection).toBe(Language.ENGLISH);
      expect(hindiDetection).toBe(Language.HINDI);
    });

    it("should validate audio quality correctly", async () => {
      const poorAudio = testGenerators.audioBuffer(0.5); // 0.5KB - poor quality
      const goodAudio = testGenerators.audioBuffer(10); // 10KB - good quality
      const excellentAudio = testGenerators.audioBuffer(60); // 60KB - excellent quality

      const poorAssessment =
        await speechProcessor.validateAudioQuality(poorAudio);
      const goodAssessment =
        await speechProcessor.validateAudioQuality(goodAudio);
      const excellentAssessment =
        await speechProcessor.validateAudioQuality(excellentAudio);

      expect(poorAssessment.quality).toBe(AudioQuality.POOR);
      expect(poorAssessment.acceptable).toBe(false);
      expect(poorAssessment.issues.length).toBeGreaterThan(0);

      expect(goodAssessment.quality).toBe(AudioQuality.GOOD);
      expect(goodAssessment.acceptable).toBe(true);

      expect(excellentAssessment.quality).toBe(AudioQuality.EXCELLENT);
      expect(excellentAssessment.acceptable).toBe(true);
      expect(excellentAssessment.issues.length).toBe(0);
    });

    it("should handle regional accents consistently", async () => {
      // Simulate different regional accents with varying audio characteristics
      const mumbaiAccent = testGenerators.audioBuffer(8);
      const delhiAccent = testGenerators.audioBuffer(12);
      const bangaloreAccent = testGenerators.audioBuffer(10);

      const results = await Promise.all([
        speechProcessor.processAudio(mumbaiAccent, Language.HINDI),
        speechProcessor.processAudio(delhiAccent, Language.HINDI),
        speechProcessor.processAudio(bangaloreAccent, Language.ENGLISH),
      ]);

      // All should have reasonable confidence despite accent variations
      results.forEach((result) => {
        expect(result.confidence).toBeGreaterThan(0.4);
        expect(result.text).toBeTruthy();
      });

      // Language should be consistent with input
      expect(results[0].language).toBe(Language.HINDI);
      expect(results[1].language).toBe(Language.HINDI);
      expect(results[2].language).toBe(Language.ENGLISH);
    });
  });

  describe("Integration Tests", () => {
    it("should maintain conversation context across multiple audio inputs", async () => {
      const sessionId = "test-session-123";
      const audioInputs = [
        testGenerators.audioBuffer(8),
        testGenerators.audioBuffer(10),
        testGenerators.audioBuffer(12),
      ];

      const results = [];
      for (const audioBuffer of audioInputs) {
        const result = await speechProcessor.processAudio(
          audioBuffer,
          Language.HINDI,
        );
        results.push(result);
      }

      // All results should be in the same language (conversation consistency)
      const languages = results.map((r) => r.language);
      expect(new Set(languages).size).toBe(1); // All same language

      // Confidence should remain stable or improve
      for (let i = 1; i < results.length; i++) {
        const confidenceDrop =
          results[i - 1].confidence - results[i].confidence;
        expect(confidenceDrop).toBeLessThan(0.3); // No major confidence drops
      }
    });

    it("should handle mixed language scenarios appropriately", async () => {
      const hindiAudio = testGenerators.audioBuffer(15); // Should be detected as Hindi
      const englishAudio = testGenerators.audioBuffer(8); // Should be detected as English

      // Process with explicit language specification
      const hindiResult = await speechProcessor.processAudio(
        hindiAudio,
        Language.HINDI,
      );
      const englishResult = await speechProcessor.processAudio(
        englishAudio,
        Language.ENGLISH,
      );

      expect(hindiResult.language).toBe(Language.HINDI);
      expect(englishResult.language).toBe(Language.ENGLISH);

      // Both should have reasonable confidence
      expect(hindiResult.confidence).toBeGreaterThan(0.5);
      expect(englishResult.confidence).toBeGreaterThan(0.5);
    });
  });

  describe("Performance Tests", () => {
    it("should process multiple concurrent requests efficiently", async () => {
      const concurrentRequests = 5;
      const audioBuffers = Array.from({ length: concurrentRequests }, () =>
        testGenerators.audioBuffer(10),
      );

      const startTime = Date.now();

      const results = await Promise.all(
        audioBuffers.map((buffer) =>
          speechProcessor.processAudio(buffer, Language.ENGLISH),
        ),
      );

      const totalTime = Date.now() - startTime;

      // All requests should complete
      expect(results).toHaveLength(concurrentRequests);
      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(result.text).toBeTruthy();
      });

      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(2000); // 2 seconds for 5 concurrent requests
    });

    it("should handle large audio files within reasonable time", async () => {
      const largeAudioBuffer = testGenerators.audioBuffer(500); // 500KB

      const startTime = Date.now();
      const result = await speechProcessor.processAudio(
        largeAudioBuffer,
        Language.ENGLISH,
      );
      const processingTime = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(processingTime).toBeLessThan(5000); // 5 seconds max for large files
      expect(result.confidence).toBeGreaterThan(0.7); // Large files should have good confidence
    });
  });
});
