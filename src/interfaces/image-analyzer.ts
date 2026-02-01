/**
 * Image Analyzer Interface
 * Extracts information from uploaded documents and images
 */

import {
  ExtractedInfo,
  QualityAssessment,
  KeyValuePair,
  DocumentType,
  Evidence,
} from "../types";

export interface ImageAnalyzer {
  /**
   * Analyze document image and extract information
   * @param imageData Raw image buffer
   * @param documentType Expected document type
   * @returns Extracted information with confidence scores
   */
  analyzeDocument(
    imageData: Buffer,
    documentType?: DocumentType,
  ): Promise<ExtractedInfo>;

  /**
   * Validate image quality for processing
   * @param imageData Raw image buffer
   * @returns Quality assessment with recommendations
   */
  validateDocumentQuality(imageData: Buffer): Promise<QualityAssessment>;

  /**
   * Extract key-value pairs from document
   * @param imageData Raw image buffer
   * @returns Array of extracted key-value pairs
   */
  extractKeyValuePairs(imageData: Buffer): Promise<KeyValuePair[]>;

  /**
   * Detect document type from image
   * @param imageData Raw image buffer
   * @returns Detected document type with confidence
   */
  detectDocumentType(imageData: Buffer): Promise<DocumentTypeResult>;

  /**
   * Extract text using OCR
   * @param imageData Raw image buffer
   * @returns Extracted text with confidence score
   */
  extractText(imageData: Buffer): Promise<TextExtractionResult>;

  /**
   * Integrate image data with voice input
   * @param extractedInfo Information from image
   * @param voiceInput Related voice input text
   * @returns Combined evidence object
   */
  integrateWithVoiceInput(
    extractedInfo: ExtractedInfo,
    voiceInput: string,
  ): Promise<Evidence>;

  /**
   * Validate extracted information against expected format
   * @param extractedInfo Extracted information
   * @param documentType Expected document type
   * @returns Validation result with issues
   */
  validateExtractedInfo(
    extractedInfo: ExtractedInfo,
    documentType: DocumentType,
  ): Promise<ValidationResult>;
}

export interface DocumentTypeResult {
  documentType: DocumentType;
  confidence: number;
  alternativeTypes: DocumentType[];
}

export interface TextExtractionResult {
  text: string;
  confidence: number;
  boundingBoxes: BoundingBox[];
}

export interface BoundingBox {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  suggestions: string[];
  confidence: number;
}
