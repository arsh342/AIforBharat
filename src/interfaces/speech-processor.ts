/**
 * Speech Processor Interface
 * Handles voice input processing and audio quality management
 */

import { Language, TranscriptionResult, AudioQuality } from "../types";

export interface SpeechProcessor {
  /**
   * Process audio input and convert to text
   * @param audioData Raw audio buffer
   * @param language Target language for transcription
   * @returns Transcription result with confidence score
   */
  processAudio(
    audioData: Buffer,
    language: Language,
  ): Promise<TranscriptionResult>;

  /**
   * Detect the language of the audio input
   * @param audioData Raw audio buffer
   * @returns Detected language
   */
  detectLanguage(audioData: Buffer): Promise<Language>;

  /**
   * Validate audio quality and provide feedback
   * @param audioData Raw audio buffer
   * @returns Quality assessment with recommendations
   */
  validateAudioQuality(audioData: Buffer): Promise<AudioQualityAssessment>;

  /**
   * Check if audio meets minimum quality requirements
   * @param audioData Raw audio buffer
   * @returns True if audio is acceptable for processing
   */
  isAudioAcceptable(audioData: Buffer): Promise<boolean>;
}

export interface AudioQualityAssessment {
  quality: AudioQuality;
  issues: string[];
  recommendations: string[];
  acceptable: boolean;
}
