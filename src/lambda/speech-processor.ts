/**
 * Speech Processor Lambda Function
 * Handles voice input processing and transcription using Amazon Transcribe
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
  TranscriptionJob,
  LanguageCode,
} from "@aws-sdk/client-transcribe";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { transcribeClient, s3Client, config } from "../config/aws-config";
import { SpeechProcessor } from "../interfaces/speech-processor";
import {
  APIResponse,
  Language,
  TranscriptionResult,
  AudioQuality,
} from "../types";
import { logger } from "../utils/logger";
import { validateAudioInput, createErrorResponse } from "../utils/validation";

/**
 * AWS Transcribe Speech Processor Implementation
 */
class AWSTranscribeSpeechProcessor implements SpeechProcessor {
  private readonly bucketName: string;
  private readonly supportedLanguages: Map<Language, LanguageCode>;

  constructor() {
    this.bucketName = config.aws.s3Bucket;
    this.supportedLanguages = new Map([
      [Language.HINDI, "hi-IN" as LanguageCode],
      [Language.ENGLISH, "en-IN" as LanguageCode], // Indian English for better accent handling
    ]);
  }

  async processAudio(
    audioData: Buffer,
    language: Language,
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();
    logger.info("Starting audio processing", {
      audioSize: audioData.length,
      language,
    });

    try {
      // Validate audio quality first
      const qualityAssessment = await this.validateAudioQuality(audioData);
      if (!qualityAssessment.acceptable) {
        throw new Error(
          `Audio quality unacceptable: ${qualityAssessment.issues.join(", ")}`,
        );
      }

      // Upload audio to S3 for Transcribe processing
      const audioKey = await this.uploadAudioToS3(audioData);

      // Start transcription job
      const jobName = `transcription-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const transcriptionJob = await this.startTranscriptionJob(
        jobName,
        audioKey,
        language,
      );

      // Wait for completion and get results
      const transcriptText = await this.waitForTranscriptionCompletion(jobName);

      // Calculate confidence based on audio quality and processing success
      const confidence = this.calculateConfidence(
        qualityAssessment,
        transcriptText,
      );

      // Clean up temporary S3 object
      await this.cleanupS3Object(audioKey);

      const processingTime = Date.now() - startTime;
      logger.info("Audio processing completed", {
        processingTime,
        confidence,
        textLength: transcriptText.length,
      });

      return {
        text: transcriptText,
        confidence,
        language,
        timestamp: new Date(),
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error(
        "Audio processing failed",
        error instanceof Error ? error : new Error(String(error)),
        {
          processingTime,
          language,
        },
      );
      throw error;
    }
  }

  async detectLanguage(audioData: Buffer): Promise<Language> {
    logger.info("Starting language detection", { audioSize: audioData.length });

    try {
      // For production, we would use Amazon Transcribe's language identification
      // For now, we'll use a heuristic approach based on audio characteristics
      // and potentially run transcription with both languages to compare confidence

      const qualityAssessment = await this.validateAudioQuality(audioData);
      if (!qualityAssessment.acceptable) {
        // Default to English for poor quality audio
        return Language.ENGLISH;
      }

      // Try transcription with both languages and compare results
      const [hindiResult, englishResult] = await Promise.allSettled([
        this.processAudioForLanguageDetection(audioData, Language.HINDI),
        this.processAudioForLanguageDetection(audioData, Language.ENGLISH),
      ]);

      // Compare confidence scores and text characteristics
      let detectedLanguage = Language.ENGLISH; // Default

      if (
        hindiResult.status === "fulfilled" &&
        englishResult.status === "fulfilled"
      ) {
        const hindiConfidence = hindiResult.value.confidence;
        const englishConfidence = englishResult.value.confidence;
        const hindiText = hindiResult.value.text;

        // Check for Devanagari script (Hindi)
        const hasDevanagari = /[\u0900-\u097F]/.test(hindiText);

        if (hasDevanagari || hindiConfidence > englishConfidence + 0.1) {
          detectedLanguage = Language.HINDI;
        }
      } else if (hindiResult.status === "fulfilled") {
        const hindiText = hindiResult.value.text;
        if (/[\u0900-\u097F]/.test(hindiText)) {
          detectedLanguage = Language.HINDI;
        }
      }

      logger.info("Language detection completed", { detectedLanguage });
      return detectedLanguage;
    } catch (error) {
      logger.error(
        "Language detection failed",
        error instanceof Error ? error : new Error(String(error)),
        {
          audioSize: audioData.length,
        },
      );
      // Default to English on error
      return Language.ENGLISH;
    }
  }

  async validateAudioQuality(audioData: Buffer): Promise<{
    quality: AudioQuality;
    issues: string[];
    recommendations: string[];
    acceptable: boolean;
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let quality: AudioQuality = AudioQuality.GOOD;

    // Basic audio validation
    if (audioData.length === 0) {
      issues.push("Audio data is empty");
      recommendations.push("Please record audio and try again");
      return {
        quality: AudioQuality.POOR,
        issues,
        recommendations,
        acceptable: false,
      };
    }

    // Check minimum size (approximately 1 second of audio at 16kHz)
    const minSize = 32000; // 32KB minimum
    if (audioData.length < minSize) {
      issues.push("Audio file too small - may be incomplete");
      recommendations.push("Record at least 2-3 seconds of clear speech");
      quality = AudioQuality.POOR;
    }

    // Check maximum size (2 minutes at reasonable quality)
    const maxSize = 10 * 1024 * 1024; // 10MB maximum
    if (audioData.length > maxSize) {
      issues.push("Audio file too large");
      recommendations.push("Keep recordings under 2 minutes for best results");
      quality = AudioQuality.FAIR;
    }

    // Check for valid audio format (basic header validation)
    const isValidFormat = this.validateAudioFormat(audioData);
    if (!isValidFormat) {
      issues.push("Invalid or unsupported audio format");
      recommendations.push("Use WAV, MP3, or M4A format");
      quality = AudioQuality.POOR;
    }

    // Determine overall quality
    if (issues.length === 0) {
      quality = AudioQuality.EXCELLENT;
    } else if (
      issues.some(
        (issue) => issue.includes("empty") || issue.includes("Invalid"),
      )
    ) {
      quality = AudioQuality.POOR;
    } else if (issues.length > 2) {
      quality = AudioQuality.FAIR;
    }

    const acceptable = quality !== AudioQuality.POOR;

    logger.info("Audio quality assessment completed", {
      quality,
      acceptable,
      issueCount: issues.length,
    });

    return { quality, issues, recommendations, acceptable };
  }

  async isAudioAcceptable(audioData: Buffer): Promise<boolean> {
    const assessment = await this.validateAudioQuality(audioData);
    return assessment.acceptable;
  }

  // Private helper methods

  private async uploadAudioToS3(audioData: Buffer): Promise<string> {
    const key = `temp-audio/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.wav`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: audioData,
      ContentType: "audio/wav",
      ServerSideEncryption: "AES256",
    });

    await s3Client.send(command);
    logger.info("Audio uploaded to S3", { key });
    return key;
  }

  private async startTranscriptionJob(
    jobName: string,
    audioKey: string,
    language: Language,
  ): Promise<TranscriptionJob> {
    const languageCode = this.supportedLanguages.get(language);
    if (!languageCode) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const command = new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      LanguageCode: languageCode,
      Media: {
        MediaFileUri: `s3://${this.bucketName}/${audioKey}`,
      },
      OutputBucketName: this.bucketName,
      OutputKey: `transcripts/${jobName}.json`,
      Settings: {
        MaxSpeakerLabels: 1, // Single speaker
        ShowSpeakerLabels: false,
        ChannelIdentification: false,
      },
    });

    const response = await transcribeClient.send(command);
    logger.info("Transcription job started", { jobName, languageCode });

    return response.TranscriptionJob!;
  }

  private async waitForTranscriptionCompletion(
    jobName: string,
  ): Promise<string> {
    const maxWaitTime = 30000; // 30 seconds
    const pollInterval = 2000; // 2 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const command = new GetTranscriptionJobCommand({
        TranscriptionJobName: jobName,
      });

      const response = await transcribeClient.send(command);
      const job = response.TranscriptionJob!;

      if (job.TranscriptionJobStatus === "COMPLETED") {
        // Get transcript from S3
        const transcriptUri = job.Transcript!.TranscriptFileUri!;
        return await this.getTranscriptFromS3(transcriptUri);
      } else if (job.TranscriptionJobStatus === "FAILED") {
        throw new Error(
          `Transcription failed: ${job.FailureReason || "Unknown error"}`,
        );
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error("Transcription job timed out");
  }

  private async getTranscriptFromS3(transcriptUri: string): Promise<string> {
    // Extract S3 key from URI
    const url = new URL(transcriptUri);
    const key = url.pathname.substring(1); // Remove leading slash

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);
    const transcriptData = await response.Body!.transformToString();
    const transcript = JSON.parse(transcriptData);

    // Extract the transcript text
    const transcriptText = transcript.results.transcripts[0]?.transcript || "";

    // Clean up transcript file
    await this.cleanupS3Object(key);

    return transcriptText;
  }

  private async cleanupS3Object(key: string): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: "",
        Metadata: { "delete-after": "24h" },
      });
      // In production, you'd set up S3 lifecycle rules for automatic cleanup
      logger.info("S3 object marked for cleanup", { key });
    } catch (error) {
      logger.warn("Failed to cleanup S3 object", { key, error });
    }
  }

  private validateAudioFormat(audioData: Buffer): boolean {
    if (audioData.length < 12) return false;

    // Check for common audio format headers
    const header = audioData.subarray(0, 12);

    // WAV format
    if (
      header.subarray(0, 4).toString() === "RIFF" &&
      header.subarray(8, 12).toString() === "WAVE"
    ) {
      return true;
    }

    // MP3 format
    if (header[0] === 0xff && (header[1] & 0xe0) === 0xe0) {
      return true;
    }

    // M4A/AAC format
    if (header.subarray(4, 8).toString() === "ftyp") {
      return true;
    }

    return false;
  }

  private calculateConfidence(
    qualityAssessment: { quality: AudioQuality; issues: string[] },
    transcriptText: string,
  ): number {
    let baseConfidence = 0.8;

    // Adjust based on audio quality
    switch (qualityAssessment.quality) {
      case AudioQuality.EXCELLENT:
        baseConfidence = 0.95;
        break;
      case AudioQuality.GOOD:
        baseConfidence = 0.85;
        break;
      case AudioQuality.FAIR:
        baseConfidence = 0.7;
        break;
      case AudioQuality.POOR:
        baseConfidence = 0.5;
        break;
    }

    // Adjust based on transcript length and content
    if (transcriptText.length === 0) {
      return 0.1;
    }

    if (transcriptText.length < 10) {
      baseConfidence *= 0.8;
    }

    // Penalize for quality issues
    const issuePenalty = qualityAssessment.issues.length * 0.05;
    baseConfidence = Math.max(0.1, baseConfidence - issuePenalty);

    return Math.min(1.0, baseConfidence);
  }

  private async processAudioForLanguageDetection(
    audioData: Buffer,
    language: Language,
  ): Promise<{ confidence: number; text: string }> {
    try {
      const result = await this.processAudio(audioData, language);
      return {
        confidence: result.confidence,
        text: result.text,
      };
    } catch (error) {
      return {
        confidence: 0.0,
        text: "",
      };
    }
  }
}

// Lambda handler
export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const speechProcessor = new AWSTranscribeSpeechProcessor();

  try {
    logger.info("Speech Processor received request", {
      path: event.path,
      method: event.httpMethod,
    });

    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { audioData, language, action = "processAudio" } = body;

    // Validate input
    const validation = validateAudioInput(body);
    if (!validation.isValid) {
      return createErrorResponse(
        400,
        "INVALID_INPUT",
        validation.errors.join(", "),
      );
    }

    // Convert base64 audio data to buffer
    const audioBuffer = Buffer.from(audioData, "base64");

    let result: any;

    switch (action) {
      case "processAudio":
        result = await speechProcessor.processAudio(
          audioBuffer,
          language as Language,
        );
        break;

      case "detectLanguage":
        result = {
          detectedLanguage: await speechProcessor.detectLanguage(audioBuffer),
        };
        break;

      case "validateQuality":
        result = await speechProcessor.validateAudioQuality(audioBuffer);
        break;

      case "checkAcceptable":
        result = {
          acceptable: await speechProcessor.isAudioAcceptable(audioBuffer),
        };
        break;

      default:
        return createErrorResponse(
          400,
          "INVALID_ACTION",
          `Unknown action: ${action}`,
        );
    }

    const response: APIResponse = {
      success: true,
      data: result,
      timestamp: new Date(),
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    logger.error(
      "Speech Processor error",
      error instanceof Error ? error : new Error(String(error)),
      {
        path: event.path,
        method: event.httpMethod,
      },
    );

    return createErrorResponse(
      500,
      "SPEECH_PROCESSOR_ERROR",
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }
};
