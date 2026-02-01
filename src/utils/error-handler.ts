/**
 * Centralized error handling utilities
 * Provides consistent error handling across all components
 */

import { APIError } from "../types";

export enum ErrorCode {
  // Speech Processing Errors
  AUDIO_QUALITY_POOR = "AUDIO_QUALITY_POOR",
  TRANSCRIPTION_FAILED = "TRANSCRIPTION_FAILED",
  LANGUAGE_DETECTION_FAILED = "LANGUAGE_DETECTION_FAILED",

  // Intent Classification Errors
  INTENT_UNCLEAR = "INTENT_UNCLEAR",
  CONTEXT_INSUFFICIENT = "CONTEXT_INSUFFICIENT",

  // Eligibility Assessment Errors
  HOUSEHOLD_INFO_INCOMPLETE = "HOUSEHOLD_INFO_INCOMPLETE",
  ELIGIBILITY_CRITERIA_UNCLEAR = "ELIGIBILITY_CRITERIA_UNCLEAR",

  // Grievance Processing Errors
  COMPLAINT_DETAILS_INSUFFICIENT = "COMPLAINT_DETAILS_INSUFFICIENT",
  LEGAL_REFERENCES_UNAVAILABLE = "LEGAL_REFERENCES_UNAVAILABLE",

  // Image Analysis Errors
  IMAGE_QUALITY_POOR = "IMAGE_QUALITY_POOR",
  DOCUMENT_TYPE_UNRECOGNIZED = "DOCUMENT_TYPE_UNRECOGNIZED",
  OCR_EXTRACTION_FAILED = "OCR_EXTRACTION_FAILED",

  // Document Generation Errors
  TEMPLATE_NOT_FOUND = "TEMPLATE_NOT_FOUND",
  REQUIRED_FIELDS_MISSING = "REQUIRED_FIELDS_MISSING",

  // System Errors
  AWS_SERVICE_ERROR = "AWS_SERVICE_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",

  // Security Errors
  ENCRYPTION_FAILED = "ENCRYPTION_FAILED",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  DATA_VALIDATION_FAILED = "DATA_VALIDATION_FAILED",
}

export class VoiceCivicAssistantError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, any>;
  public readonly recoverable: boolean;
  public readonly userMessage: string;

  constructor(
    code: ErrorCode,
    message: string,
    userMessage?: string,
    details?: Record<string, any>,
    recoverable: boolean = true,
  ) {
    super(message);
    this.name = "VoiceCivicAssistantError";
    this.code = code;
    this.details = details;
    this.recoverable = recoverable;
    this.userMessage = userMessage || this.getDefaultUserMessage(code);
  }

  private getDefaultUserMessage(code: ErrorCode): string {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.AUDIO_QUALITY_POOR]:
        "कृपया स्पष्ट आवाज़ में दोबारा बोलें। Please speak clearly and try again.",
      [ErrorCode.TRANSCRIPTION_FAILED]:
        "आपकी आवाज़ समझने में समस्या हुई। कृपया दोबारा कोशिश करें। We couldn't understand your voice. Please try again.",
      [ErrorCode.LANGUAGE_DETECTION_FAILED]:
        "भाषा पहचानने में समस्या हुई। कृपया हिंदी या अंग्रेजी में बोलें। Language detection failed. Please speak in Hindi or English.",
      [ErrorCode.INTENT_UNCLEAR]:
        "आपकी आवश्यकता स्पष्ट नहीं है। कृपया बताएं कि आप योजना की जांच करना चाहते हैं या शिकायत दर्ज करना चाहते हैं। Your request is unclear. Please specify if you want to check scheme eligibility or file a complaint.",
      [ErrorCode.CONTEXT_INSUFFICIENT]:
        "अधिक जानकारी की आवश्यकता है। More information is needed.",
      [ErrorCode.HOUSEHOLD_INFO_INCOMPLETE]:
        "परिवार की पूरी जानकारी नहीं मिली। कृपया अधिक विवरण दें। Incomplete household information. Please provide more details.",
      [ErrorCode.ELIGIBILITY_CRITERIA_UNCLEAR]:
        "योग्यता मापदंड स्पष्ट नहीं हैं। Eligibility criteria are unclear.",
      [ErrorCode.COMPLAINT_DETAILS_INSUFFICIENT]:
        "शिकायत का विवरण अधूरा है। कृपया अधिक जानकारी दें। Complaint details are insufficient. Please provide more information.",
      [ErrorCode.LEGAL_REFERENCES_UNAVAILABLE]:
        "कानूनी संदर्भ उपलब्ध नहीं हैं। Legal references are not available.",
      [ErrorCode.IMAGE_QUALITY_POOR]:
        "तस्वीर साफ नहीं है। कृपया बेहतर तस्वीर अपलोड करें। Image quality is poor. Please upload a clearer image.",
      [ErrorCode.DOCUMENT_TYPE_UNRECOGNIZED]:
        "दस्तावेज़ का प्रकार पहचाना नहीं गया। Document type not recognized.",
      [ErrorCode.OCR_EXTRACTION_FAILED]:
        "दस्तावेज़ से जानकारी निकालने में समस्या हुई। Failed to extract information from document.",
      [ErrorCode.TEMPLATE_NOT_FOUND]:
        "फॉर्म टेम्प्लेट नहीं मिला। Form template not found.",
      [ErrorCode.REQUIRED_FIELDS_MISSING]:
        "आवश्यक जानकारी गुम है। Required information is missing.",
      [ErrorCode.AWS_SERVICE_ERROR]:
        "सिस्टम में तकनीकी समस्या है। कृपया बाद में कोशिश करें। Technical system issue. Please try again later.",
      [ErrorCode.TIMEOUT_ERROR]:
        "समय समाप्त हो गया। कृपया दोबारा कोशिश करें। Request timed out. Please try again.",
      [ErrorCode.RATE_LIMIT_EXCEEDED]:
        "बहुत सारे अनुरोध। कृपया थोड़ी देर बाद कोशिश करें। Too many requests. Please try again later.",
      [ErrorCode.CONFIGURATION_ERROR]:
        "सिस्टम कॉन्फ़िगरेशन में समस्या है। System configuration error.",
      [ErrorCode.ENCRYPTION_FAILED]:
        "डेटा सुरक्षा में समस्या है। Data security issue.",
      [ErrorCode.UNAUTHORIZED_ACCESS]: "अनधिकृत पहुंच। Unauthorized access.",
      [ErrorCode.DATA_VALIDATION_FAILED]:
        "डेटा सत्यापन असफल। Data validation failed.",
    };

    return (
      messages[code] || "एक अज्ञात त्रुटि हुई है। An unknown error occurred."
    );
  }

  toAPIError(): APIError {
    return {
      code: this.code,
      message: this.userMessage,
      details: this.details,
    };
  }
}

export const handleError = (error: unknown): VoiceCivicAssistantError => {
  if (error instanceof VoiceCivicAssistantError) {
    return error;
  }

  if (error instanceof Error) {
    // Map common AWS errors
    if (error.name === "ThrottlingException") {
      return new VoiceCivicAssistantError(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        error.message,
        undefined,
        { originalError: error.name },
      );
    }

    if (error.name === "TimeoutError") {
      return new VoiceCivicAssistantError(
        ErrorCode.TIMEOUT_ERROR,
        error.message,
        undefined,
        { originalError: error.name },
      );
    }

    // Generic AWS service error
    if (error.name.includes("Exception") || error.name.includes("Error")) {
      return new VoiceCivicAssistantError(
        ErrorCode.AWS_SERVICE_ERROR,
        error.message,
        undefined,
        { originalError: error.name },
        false,
      );
    }
  }

  // Unknown error
  return new VoiceCivicAssistantError(
    ErrorCode.AWS_SERVICE_ERROR,
    "Unknown error occurred",
    undefined,
    { originalError: String(error) },
    false,
  );
};

export const createRecoveryOptions = (
  error: VoiceCivicAssistantError,
): string[] => {
  const options: Partial<Record<ErrorCode, string[]>> = {
    [ErrorCode.AUDIO_QUALITY_POOR]: [
      "कृपया शांत जगह से बोलें। Please speak from a quiet location.",
      "माइक्रोफोन के पास बोलें। Speak closer to the microphone.",
      "धीरे और स्पष्ट बोलें। Speak slowly and clearly.",
    ],
    [ErrorCode.IMAGE_QUALITY_POOR]: [
      "बेहतर रोशनी में तस्वीर लें। Take photo in better lighting.",
      "दस्तावेज़ को सीधा रखें। Keep document straight.",
      "कैमरा स्थिर रखें। Keep camera steady.",
    ],
    [ErrorCode.INTENT_UNCLEAR]: [
      "योजना की जांच के लिए 'योग्यता जांच' कहें। Say 'eligibility check' for scheme verification.",
      "शिकायत के लिए 'शिकायत दर्ज करें' कहें। Say 'file complaint' for grievances.",
    ],
    [ErrorCode.HOUSEHOLD_INFO_INCOMPLETE]: [
      "परिवार के सभी सदस्यों की जानकारी दें। Provide information about all family members.",
      "आय और संपत्ति की जानकारी दें। Provide income and asset information.",
      "पता और पहचान दस्तावेज़ की जानकारी दें। Provide address and identity document details.",
    ],
  };

  return (
    options[error.code] || [
      "कृपया दोबारा कोशिश करें। Please try again.",
      "यदि समस्या बनी रहे तो सहायता से संपर्क करें। Contact support if the problem persists.",
    ]
  );
};
