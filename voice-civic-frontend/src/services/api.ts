import axios from "axios";
import { Language, Document } from "../App";

// Configuration
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";
const MOCK_MODE = process.env.REACT_APP_MOCK_MODE === "true" || true; // Enable mock mode by default

// API Client
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Types
interface VoiceProcessingResult {
  response: string;
  intent?: "eligibility" | "grievance" | "inquiry";
  confidence?: number;
  document?: Omit<Document, "id">;
  followUpQuestions?: string[];
}

interface TextProcessingResult {
  response: string;
  intent?: "eligibility" | "grievance" | "inquiry";
  confidence?: number;
  document?: Omit<Document, "id">;
  followUpQuestions?: string[];
}

// Mock responses for development
const getMockResponse = (
  input: string,
  language: Language,
): VoiceProcessingResult => {
  const lowerInput = input.toLowerCase();

  // Eligibility-related keywords
  if (
    lowerInput.includes("eligible") ||
    lowerInput.includes("pmjay") ||
    lowerInput.includes("scheme") ||
    lowerInput.includes("पात्र") ||
    lowerInput.includes("योजना") ||
    lowerInput.includes("योग्य")
  ) {
    if (language === "hi") {
      return {
        response: `आपकी पात्रता की जांच के लिए मुझे कुछ जानकारी चाहिए:

1. आपके परिवार में कितने सदस्य हैं?
2. आपकी मासिक आय कितनी है?
3. क्या आपके पास राशन कार्ड है?
4. आप किस राज्य में रहते हैं?

कृपया इन सवालों के जवाब दें ताकि मैं आपकी PM-JAY योजना की पात्रता की सही जांच कर सकूं।`,
        intent: "eligibility",
        confidence: 0.95,
        followUpQuestions: [
          "परिवार के सदस्यों की संख्या बताएं",
          "मासिक आय की जानकारी दें",
          "राशन कार्ड की जानकारी दें",
        ],
      };
    } else {
      return {
        response: `To check your PM-JAY eligibility, I need some information:

1. How many members are in your family?
2. What is your monthly household income?
3. Do you have a ration card?
4. Which state do you live in?

Please provide answers to these questions so I can accurately assess your eligibility for the PM-JAY scheme.`,
        intent: "eligibility",
        confidence: 0.95,
        followUpQuestions: [
          "Tell me about family members",
          "Provide monthly income details",
          "Share ration card information",
        ],
      };
    }
  }

  // Grievance-related keywords
  if (
    lowerInput.includes("complaint") ||
    lowerInput.includes("grievance") ||
    lowerInput.includes("problem") ||
    lowerInput.includes("hospital") ||
    lowerInput.includes("overcharge") ||
    lowerInput.includes("शिकायत") ||
    lowerInput.includes("समस्या") ||
    lowerInput.includes("अस्पताल")
  ) {
    if (language === "hi") {
      return {
        response: `मैं आपकी शिकायत दर्ज करने में मदद करूंगा। कृपया निम्नलिखित जानकारी दें:

1. आपकी समस्या क्या है?
2. यह कब हुआ था?
3. कौन सा अस्पताल या स्वास्थ्य केंद्र था?
4. क्या आपके पास कोई बिल या रसीद है?

आपकी शिकायत को सही तरीके से दर्ज करने के लिए ये विवरण जरूरी हैं।`,
        intent: "grievance",
        confidence: 0.92,
        document: {
          type: "health_grievance",
          title: "स्वास्थ्य शिकायत - मसौदा",
          content: {
            title: "स्वास्थ्य सेवा संबंधी शिकायत",
            description: "शिकायत का विवरण यहां होगा...",
            category: "सामान्य शिकायत",
            legalReferences: [
              "PM-JAY दिशानिर्देश धारा 4.2",
              "राष्ट्रीय स्वास्थ्य नीति 2017",
            ],
          },
          status: "draft",
        },
      };
    } else {
      return {
        response: `I'll help you file your grievance. Please provide the following information:

1. What is your complaint about?
2. When did this incident occur?
3. Which hospital or health center was involved?
4. Do you have any bills or receipts as evidence?

These details are necessary to properly document your grievance.`,
        intent: "grievance",
        confidence: 0.92,
        document: {
          type: "health_grievance",
          title: "Health Grievance - Draft",
          content: {
            title: "Health Service Related Complaint",
            description: "Complaint details will be filled here...",
            category: "General Complaint",
            legalReferences: [
              "PM-JAY Guidelines Section 4.2",
              "National Health Policy 2017",
            ],
          },
          status: "draft",
        },
      };
    }
  }

  // Default response
  if (language === "hi") {
    return {
      response: `नमस्ते! मैं आपकी सहायता के लिए यहां हूं। मैं निम्नलिखित में आपकी मदद कर सकता हूं:

• PM-JAY योजना की पात्रता जांचना
• स्वास्थ्य संबंधी शिकायत दर्ज करना
• अस्पताल के बिल की समीक्षा करना
• आवेदन फॉर्म भरने में सहायता

कृपया बताएं कि आप किस विषय में सहायता चाहते हैं?`,
      intent: "inquiry",
      confidence: 0.8,
    };
  } else {
    return {
      response: `Hello! I'm here to help you. I can assist you with:

• Checking PM-JAY scheme eligibility
• Filing health-related grievances
• Reviewing hospital bills and charges
• Help with application forms

Please let me know what you need help with?`,
      intent: "inquiry",
      confidence: 0.8,
    };
  }
};

// Voice processing function
export const processVoiceInput = async (
  audioBlob: Blob,
  language: Language,
): Promise<VoiceProcessingResult> => {
  if (MOCK_MODE) {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock transcription
    const mockTranscription =
      language === "hi"
        ? "मुझे PM-JAY योजना की पात्रता जांचनी है"
        : "I want to check my PM-JAY eligibility";

    return getMockResponse(mockTranscription, language);
  }

  try {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("language", language);

    const response = await apiClient.post("/voice/process", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Voice processing error:", error);
    throw new Error("Failed to process voice input");
  }
};

// Text processing function
export const processTextInput = async (
  text: string,
  language: Language,
): Promise<TextProcessingResult> => {
  if (MOCK_MODE) {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return getMockResponse(text, language);
  }

  try {
    const response = await apiClient.post("/text/process", {
      text,
      language,
    });

    return response.data;
  } catch (error) {
    console.error("Text processing error:", error);
    throw new Error("Failed to process text input");
  }
};

// Image processing function
export const processImageInput = async (
  imageFile: File,
  language: Language,
): Promise<{ extractedText: string; analysis: string }> => {
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      extractedText:
        language === "hi"
          ? "अस्पताल बिल - राशि: ₹5,000"
          : "Hospital Bill - Amount: ₹5,000",
      analysis:
        language === "hi"
          ? "यह एक अस्पताल का बिल है जिसमें ₹5,000 की राशि दिखाई गई है।"
          : "This appears to be a hospital bill showing an amount of ₹5,000.",
    };
  }

  try {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("language", language);

    const response = await apiClient.post("/image/process", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Image processing error:", error);
    throw new Error("Failed to process image");
  }
};

// Health check function
export const healthCheck = async (): Promise<{
  status: string;
  timestamp: string;
}> => {
  try {
    const response = await apiClient.get("/health");
    return response.data;
  } catch (error) {
    console.error("Health check failed:", error);
    return {
      status: "error",
      timestamp: new Date().toISOString(),
    };
  }
};
