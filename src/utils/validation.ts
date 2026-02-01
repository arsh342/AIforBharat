/**
 * Input validation utilities
 * Enhanced with comprehensive validation schemas and property-based testing support
 */

import { z } from "zod";
import {
  Language,
  Intent,
  ComplaintCategory,
  Gender,
  FamilyRelation,
  DocumentType,
  IncomeCategory,
  RationCardType,
  HousingType,
  SeverityLevel,
  EvidenceType,
  AudioQuality,
} from "../types";

// Schema definitions for input validation

export const LanguageSchema = z.nativeEnum(Language);
export const IntentSchema = z.nativeEnum(Intent);
export const ComplaintCategorySchema = z.nativeEnum(ComplaintCategory);
export const GenderSchema = z.nativeEnum(Gender);
export const FamilyRelationSchema = z.nativeEnum(FamilyRelation);
export const DocumentTypeSchema = z.nativeEnum(DocumentType);
export const IncomeCategorySchema = z.nativeEnum(IncomeCategory);
export const RationCardTypeSchema = z.nativeEnum(RationCardType);
export const HousingTypeSchema = z.nativeEnum(HousingType);
export const SeverityLevelSchema = z.nativeEnum(SeverityLevel);
export const EvidenceTypeSchema = z.nativeEnum(EvidenceType);
export const AudioQualitySchema = z.nativeEnum(AudioQuality);

// Enhanced schemas for comprehensive validation

export const AddressSchema = z.object({
  street: z.string().optional(),
  village: z.string().optional(),
  district: z.string().min(1, "District is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  landmark: z.string().optional(),
});

export const DisabilitySchema = z.object({
  type: z.string().min(1),
  severity: z.string().min(1),
  certified: z.boolean(),
});

export const MedicalConditionSchema = z.object({
  condition: z.string().min(1),
  chronic: z.boolean(),
  treatmentRequired: z.boolean(),
});

export const PersonInfoSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  age: z.number().int().min(0).max(150, "Invalid age"),
  gender: GenderSchema,
  relation: FamilyRelationSchema,
  occupation: z.string().max(100).optional(),
  disabilities: z.array(DisabilitySchema).optional(),
  chronicConditions: z.array(MedicalConditionSchema).optional(),
});

export const AssetSchema = z.object({
  type: z.string().min(1),
  description: z.string().min(1),
  value: z.number().min(0).optional(),
});

export const LandOwnershipSchema = z.object({
  hasLand: z.boolean(),
  acreage: z.number().min(0).optional(),
  irrigated: z.boolean().optional(),
});

export const EconomicIndicatorsSchema = z.object({
  incomeCategory: IncomeCategorySchema,
  rationCardType: RationCardTypeSchema.optional(),
  landOwnership: LandOwnershipSchema.optional(),
  housingType: HousingTypeSchema,
  assets: z.array(AssetSchema),
});

export const HouseholdInfoSchema = z.object({
  headOfHousehold: PersonInfoSchema,
  members: z.array(PersonInfoSchema),
  address: AddressSchema,
  economicStatus: EconomicIndicatorsSchema,
  existingSchemes: z.array(z.string()),
});

export const ExtractedEntitySchema = z.object({
  type: z.string().min(1),
  value: z.string().min(1),
  confidence: z.number().min(0).max(1),
  startIndex: z.number().int().min(0).optional(),
  endIndex: z.number().int().min(0).optional(),
});

export const EvidenceSchema = z.object({
  type: EvidenceTypeSchema,
  description: z.string().min(1),
  imageData: z.instanceof(Buffer).optional(),
  extractedInfo: z
    .object({
      text: z.string(),
      keyFields: z.record(z.string()),
      documentType: DocumentTypeSchema,
      confidence: z.number().min(0).max(1),
    })
    .optional(),
});

export const UserComplaintSchema = z.object({
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000),
  incidentDate: z
    .date()
    .max(new Date(), "Incident date cannot be in the future"),
  location: z.string().min(1, "Location is required"),
  involvedParties: z.array(z.string()),
  category: ComplaintCategorySchema,
  severity: SeverityLevelSchema,
  evidence: z.array(EvidenceSchema),
});

export const ConversationTurnSchema = z.object({
  timestamp: z.date(),
  userInput: z.string().min(1),
  systemResponse: z.string().min(1),
  intent: IntentSchema,
  entities: z.array(ExtractedEntitySchema),
});

export const ConversationContextSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  currentIntent: IntentSchema,
  language: LanguageSchema,
  accumulatedInfo: z.record(z.any()),
  conversationHistory: z.array(ConversationTurnSchema),
});

// Audio and Image validation schemas

export const AudioInputSchema = z.object({
  audioData: z.instanceof(Buffer).refine(
    (buffer) => buffer.length > 0 && buffer.length <= 10 * 1024 * 1024, // Max 10MB
    { message: "Audio data must be between 1 byte and 10MB" },
  ),
  language: LanguageSchema.optional(),
  sessionId: z.string().uuid().optional(),
});

export const ImageInputSchema = z.object({
  imageData: z.instanceof(Buffer).refine(
    (buffer) => buffer.length > 0 && buffer.length <= 10 * 1024 * 1024, // Max 10MB
    { message: "Image data must be between 1 byte and 10MB" },
  ),
  documentType: DocumentTypeSchema.optional(),
  sessionId: z.string().uuid(),
});

export const TranscriptionResultSchema = z.object({
  text: z.string().min(1, "Transcription text cannot be empty"),
  confidence: z.number().min(0).max(1),
  language: LanguageSchema,
  timestamp: z.date(),
});

export const IntentResultSchema = z.object({
  intent: IntentSchema,
  confidence: z.number().min(0).max(1),
  entities: z.array(ExtractedEntitySchema),
  reasoning: z.string().min(1),
});

// API schemas

export const APIRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  language: LanguageSchema.optional(),
  data: z.record(z.any()),
});

export const APIResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.any()).optional(),
    })
    .optional(),
  timestamp: z.date(),
});

// Validation helper functions

export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        (err) => `${err.path.join(".")}: ${err.message}`,
      );
      throw new Error(`Validation failed: ${errorMessages.join(", ")}`);
    }
    throw error;
  }
}

export function validatePartialInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
): Partial<T> {
  try {
    return (schema as any).partial().parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        (err) => `${err.path.join(".")}: ${err.message}`,
      );
      throw new Error(`Validation failed: ${errorMessages.join(", ")}`);
    }
    throw error;
  }
}

// Enhanced validation functions for property-based testing

export function validatePMJAYEligibility(householdInfo: any): string[] {
  const errors: string[] = [];

  try {
    const validated = HouseholdInfoSchema.parse(householdInfo);

    // Check for required PM-JAY fields
    if (!validated.address.district || !validated.address.state) {
      errors.push("District and state are required for PM-JAY eligibility");
    }

    if (!validated.economicStatus.incomeCategory) {
      errors.push("Income category is required for PM-JAY eligibility");
    }

    // Validate family composition
    if (validated.members.length === 0) {
      errors.push("At least one family member must be specified");
    }

    // Check for head of household
    const hasHead = [validated.headOfHousehold, ...validated.members].some(
      (member) => member.relation === FamilyRelation.HEAD,
    );

    if (!hasHead) {
      errors.push("Head of household must be specified");
    }
  } catch (zodError) {
    if (zodError instanceof z.ZodError) {
      errors.push(
        ...zodError.errors.map(
          (err) => `${err.path.join(".")}: ${err.message}`,
        ),
      );
    } else {
      errors.push("Invalid household information format");
    }
  }

  return errors;
}

export function validateGrievanceCompleteness(complaint: any): string[] {
  const errors: string[] = [];

  try {
    const validated = UserComplaintSchema.parse(complaint);

    // Check category-specific requirements
    if (validated.category === ComplaintCategory.HOSPITAL_OVERCHARGING) {
      const hasFinancialEvidence = validated.evidence.some(
        (evidence) =>
          evidence.type === EvidenceType.DOCUMENT &&
          evidence.description.toLowerCase().includes("bill"),
      );

      if (!hasFinancialEvidence) {
        errors.push(
          "Hospital overcharging complaints require bill or receipt evidence",
        );
      }
    }

    if (validated.category === ComplaintCategory.BENEFIT_DENIAL) {
      if (
        !validated.description.toLowerCase().includes("denied") &&
        !validated.description.toLowerCase().includes("reject")
      ) {
        errors.push(
          "Benefit denial complaints should clearly state the denial",
        );
      }
    }

    // Check evidence quality
    if (
      validated.evidence.length === 0 &&
      validated.severity !== SeverityLevel.LOW
    ) {
      errors.push(
        "Medium and high severity complaints should include supporting evidence",
      );
    }
  } catch (zodError) {
    if (zodError instanceof z.ZodError) {
      errors.push(
        ...zodError.errors.map(
          (err) => `${err.path.join(".")}: ${err.message}`,
        ),
      );
    } else {
      errors.push("Invalid complaint format");
    }
  }

  return errors;
}

export function validateAudioQuality(audioData: Buffer): string[] {
  const errors: string[] = [];

  // Check file size
  if (audioData.length < 1000) {
    // Less than 1KB
    errors.push("Audio file too small - may be corrupted or empty");
  }

  if (audioData.length > 10 * 1024 * 1024) {
    // More than 10MB
    errors.push("Audio file too large - maximum size is 10MB");
  }

  // Basic format validation (check for common audio headers)
  const header = audioData.slice(0, 12);
  const isWAV =
    header.slice(0, 4).toString() === "RIFF" &&
    header.slice(8, 12).toString() === "WAVE";
  const isMP3 =
    header.slice(0, 3).toString() === "ID3" ||
    (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);
  const isM4A = header.slice(4, 8).toString() === "ftyp";

  if (!isWAV && !isMP3 && !isM4A) {
    errors.push("Unsupported audio format - please use WAV, MP3, or M4A");
  }

  return errors;
}

// Legacy validation functions (maintained for backward compatibility)

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[+]?[\d\s\-\(\)]{10,15}$/;
  return phoneRegex.test(phone);
}

export function isValidPincode(pincode: string): boolean {
  const pincodeRegex = /^\d{6}$/;
  return pincodeRegex.test(pincode);
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, "");
}

export function validateAudioBuffer(buffer: Buffer): boolean {
  const minSize = 1024; // 1KB minimum
  const maxSize = 50 * 1024 * 1024; // 50MB maximum
  return buffer.length >= minSize && buffer.length <= maxSize;
}

export function validateImageBuffer(buffer: Buffer): boolean {
  const minSize = 1024; // 1KB minimum
  const maxSize = 10 * 1024 * 1024; // 10MB maximum
  return buffer.length >= minSize && buffer.length <= maxSize;
}

export function validateConfidenceScore(confidence: number): boolean {
  return confidence >= 0 && confidence <= 1;
}

export function validateSessionId(sessionId: string): boolean {
  // Session ID should be UUID format for enhanced security
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(sessionId);
}

// Audio input validation for speech processor
export function validateAudioInput(input: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input) {
    errors.push("Request body is required");
    return { isValid: false, errors };
  }

  if (!input.audioData) {
    errors.push("audioData is required");
  } else if (typeof input.audioData !== "string") {
    errors.push("audioData must be a base64 encoded string");
  } else {
    try {
      const buffer = Buffer.from(input.audioData, "base64");
      const qualityErrors = validateAudioQuality(buffer);
      errors.push(...qualityErrors);
    } catch (error) {
      errors.push("Invalid base64 audioData");
    }
  }

  if (input.language && !Object.values(Language).includes(input.language)) {
    errors.push(
      `Unsupported language: ${input.language}. Supported languages: ${Object.values(Language).join(", ")}`,
    );
  }

  if (input.sessionId && !validateSessionId(input.sessionId)) {
    errors.push("Invalid session ID format");
  }

  return { isValid: errors.length === 0, errors };
}

// Create standardized error response
export function createErrorResponse(
  statusCode: number,
  errorCode: string,
  message: string,
  details?: Record<string, any>,
) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
    body: JSON.stringify({
      success: false,
      error: {
        code: errorCode,
        message,
        details,
      },
      timestamp: new Date(),
    }),
  };
}
