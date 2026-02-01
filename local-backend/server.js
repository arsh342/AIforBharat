const express = require("express");
const cors = require("cors");
const multer = require("multer");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  }),
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// In-memory storage for development (replace with database in production)
const sessions = new Map();
const documents = new Map();

// Utility functions
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateMockResponse = (input, language, intent = null) => {
  const lowerInput = input.toLowerCase();

  // Detect intent if not provided
  if (!intent) {
    if (
      lowerInput.includes("eligible") ||
      lowerInput.includes("pmjay") ||
      lowerInput.includes("scheme") ||
      lowerInput.includes("पात्र") ||
      lowerInput.includes("योजना") ||
      lowerInput.includes("योग्य")
    ) {
      intent = "eligibility";
    } else if (
      lowerInput.includes("complaint") ||
      lowerInput.includes("grievance") ||
      lowerInput.includes("problem") ||
      lowerInput.includes("hospital") ||
      lowerInput.includes("overcharge") ||
      lowerInput.includes("शिकायत") ||
      lowerInput.includes("समस्या") ||
      lowerInput.includes("अस्पताल")
    ) {
      intent = "grievance";
    } else {
      intent = "inquiry";
    }
  }

  // Generate responses based on intent
  switch (intent) {
    case "eligibility":
      if (language === "hi") {
        return {
          response: `आपकी PM-JAY पात्रता की जांच के लिए मुझे निम्नलिखित जानकारी चाहिए:

1. आपके परिवार में कितने सदस्य हैं?
2. आपकी मासिक पारिवारिक आय कितनी है?
3. क्या आपके पास BPL/APL राशन कार्ड है?
4. आप किस राज्य और जिले में रहते हैं?
5. क्या परिवार में कोई विकलांग व्यक्ति है?

कृपया इन प्रश्नों के उत्तर दें ताकि मैं आपकी सटीक पात्रता निर्धारित कर सकूं।`,
          intent: "eligibility",
          confidence: 0.95,
          followUpQuestions: [
            "परिवार के सदस्यों की संख्या बताएं",
            "मासिक आय की जानकारी दें",
            "राशन कार्ड का प्रकार बताएं",
          ],
        };
      } else {
        return {
          response: `To check your PM-JAY eligibility, I need the following information:

1. How many members are in your family?
2. What is your monthly household income?
3. Do you have a BPL/APL ration card?
4. Which state and district do you live in?
5. Are there any disabled members in your family?

Please provide answers to these questions so I can accurately determine your eligibility.`,
          intent: "eligibility",
          confidence: 0.95,
          followUpQuestions: [
            "Tell me about family size",
            "Provide income details",
            "Share ration card type",
          ],
        };
      }

    case "grievance":
      const documentId = uuidv4();
      const grievanceDoc = {
        type: "health_grievance",
        title:
          language === "hi"
            ? "स्वास्थ्य शिकायत - मसौदा"
            : "Health Grievance - Draft",
        content: {
          title:
            language === "hi"
              ? "स्वास्थ्य सेवा संबंधी शिकायत"
              : "Health Service Related Complaint",
          description:
            language === "hi"
              ? "शिकायत का विस्तृत विवरण यहां होगा..."
              : "Detailed complaint description will be here...",
          category: language === "hi" ? "सामान्य शिकायत" : "General Complaint",
          incidentDate: new Date().toISOString().split("T")[0],
          location:
            language === "hi"
              ? "अस्पताल/स्वास्थ्य केंद्र का नाम"
              : "Hospital/Health Center Name",
          legalReferences: [
            language === "hi"
              ? "PM-JAY दिशानिर्देश धारा 4.2"
              : "PM-JAY Guidelines Section 4.2",
            language === "hi"
              ? "राष्ट्रीय स्वास्थ्य नीति 2017"
              : "National Health Policy 2017",
            language === "hi"
              ? "उपभोक्ता संरक्षण अधिनियम 2019"
              : "Consumer Protection Act 2019",
          ],
          formFields: {
            [language === "hi" ? "शिकायतकर्ता का नाम" : "Complainant Name"]:
              language === "hi" ? "आपका नाम" : "Your Name",
            [language === "hi" ? "संपर्क नंबर" : "Contact Number"]:
              language === "hi" ? "आपका मोबाइल नंबर" : "Your Mobile Number",
            [language === "hi" ? "घटना की तारीख" : "Incident Date"]:
              new Date().toLocaleDateString(
                language === "hi" ? "hi-IN" : "en-US",
              ),
            [language === "hi" ? "अस्पताल का नाम" : "Hospital Name"]:
              language === "hi" ? "संबंधित अस्पताल" : "Concerned Hospital",
          },
        },
        status: "draft",
      };

      documents.set(documentId, grievanceDoc);

      if (language === "hi") {
        return {
          response: `मैं आपकी शिकायत दर्ज करने में सहायता करूंगा। कृपया निम्नलिखित विवरण प्रदान करें:

1. आपकी मुख्य समस्या क्या है?
2. यह घटना कब हुई थी?
3. कौन सा अस्पताल या स्वास्थ्य केंद्र शामिल था?
4. क्या आपके पास कोई बिल, रसीद या अन्य प्रमाण है?
5. आपको कितनी राशि का नुकसान हुआ है?

मैंने आपके लिए एक शिकायत दस्तावेज़ का मसौदा तैयार किया है। आप इसे दस्तावेज़ टैब में देख सकते हैं।`,
          intent: "grievance",
          confidence: 0.92,
          document: grievanceDoc,
        };
      } else {
        return {
          response: `I'll help you file your grievance. Please provide the following details:

1. What is your main complaint?
2. When did this incident occur?
3. Which hospital or health center was involved?
4. Do you have any bills, receipts, or other evidence?
5. What is the financial loss you suffered?

I've prepared a draft grievance document for you. You can view it in the Documents tab.`,
          intent: "grievance",
          confidence: 0.92,
          document: grievanceDoc,
        };
      }

    default:
      if (language === "hi") {
        return {
          response: `नमस्ते! मैं आपकी सहायता के लिए यहां हूं। मैं निम्नलिखित सेवाएं प्रदान कर सकता हूं:

🏥 **PM-JAY योजना सेवाएं:**
• पात्रता की जांच करना
• आवेदन फॉर्म भरने में सहायता
• योजना की जानकारी प्रदान करना

📋 **शिकायत सेवाएं:**
• अस्पताल की अधिक फीस की शिकायत
• इलाज से मना करने की शिकायत
• सेवा की गुणवत्ता की शिकायत
• भेदभाव की शिकायत

📄 **दस्तावेज़ सहायता:**
• बिल और रसीदों की समीक्षा
• आवेदन पत्र तैयार करना
• कानूनी दस्तावेज़ों की सहायता

कृपया बताएं कि आप किस विषय में सहायता चाहते हैं?`,
          intent: "inquiry",
          confidence: 0.8,
        };
      } else {
        return {
          response: `Hello! I'm here to assist you. I can provide the following services:

🏥 **PM-JAY Scheme Services:**
• Check eligibility status
• Help with application forms
• Provide scheme information

📋 **Grievance Services:**
• Hospital overcharging complaints
• Treatment denial complaints
• Service quality complaints
• Discrimination complaints

📄 **Document Assistance:**
• Review bills and receipts
• Prepare application forms
• Legal document support

Please let me know what you need help with?`,
          intent: "inquiry",
          confidence: 0.8,
        };
      }
  }
};

// Routes

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "Voice Civic Assistant Local Backend",
    version: "1.0.0",
  });
});

// Process voice input
app.post("/api/voice/process", upload.single("audio"), async (req, res) => {
  try {
    const { language = "en" } = req.body;
    const audioFile = req.file;

    if (!audioFile) {
      return res.status(400).json({
        error: "No audio file provided",
      });
    }

    console.log(
      `Processing voice input: ${audioFile.originalname}, Size: ${audioFile.size} bytes, Language: ${language}`,
    );

    // Simulate processing delay
    await delay(2000);

    // Mock transcription based on language
    const mockTranscription =
      language === "hi"
        ? "मुझे PM-JAY योजना की पात्रता जांचनी है"
        : "I want to check my PM-JAY eligibility";

    console.log(`Mock transcription: ${mockTranscription}`);

    const response = generateMockResponse(mockTranscription, language);

    // Store session data
    const sessionId = uuidv4();
    sessions.set(sessionId, {
      sessionId,
      language,
      conversationHistory: [
        {
          timestamp: new Date().toISOString(),
          userInput: mockTranscription,
          systemResponse: response.response,
          intent: response.intent,
        },
      ],
      createdAt: new Date().toISOString(),
    });

    res.json({
      sessionId,
      transcription: mockTranscription,
      ...response,
    });
  } catch (error) {
    console.error("Voice processing error:", error);
    res.status(500).json({
      error: "Failed to process voice input",
      details: error.message,
    });
  }
});

// Process text input
app.post("/api/text/process", async (req, res) => {
  try {
    const { text, language = "en", sessionId } = req.body;

    if (!text) {
      return res.status(400).json({
        error: "No text provided",
      });
    }

    console.log(`Processing text input: "${text}", Language: ${language}`);

    // Simulate processing delay
    await delay(1000);

    const response = generateMockResponse(text, language);

    // Update or create session
    let session = sessions.get(sessionId) || {
      sessionId: sessionId || uuidv4(),
      language,
      conversationHistory: [],
      createdAt: new Date().toISOString(),
    };

    session.conversationHistory.push({
      timestamp: new Date().toISOString(),
      userInput: text,
      systemResponse: response.response,
      intent: response.intent,
    });

    sessions.set(session.sessionId, session);

    res.json({
      sessionId: session.sessionId,
      ...response,
    });
  } catch (error) {
    console.error("Text processing error:", error);
    res.status(500).json({
      error: "Failed to process text input",
      details: error.message,
    });
  }
});

// Process image input
app.post("/api/image/process", upload.single("image"), async (req, res) => {
  try {
    const { language = "en" } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({
        error: "No image file provided",
      });
    }

    console.log(
      `Processing image: ${imageFile.originalname}, Size: ${imageFile.size} bytes`,
    );

    // Simulate processing delay
    await delay(1500);

    // Mock OCR results
    const mockExtractedText =
      language === "hi"
        ? "अस्पताल बिल\nरोगी का नाम: राम कुमार\nकुल राशि: ₹5,000\nतारीख: 15/12/2023"
        : "Hospital Bill\nPatient Name: Ram Kumar\nTotal Amount: ₹5,000\nDate: 15/12/2023";

    const mockAnalysis =
      language === "hi"
        ? "यह एक अस्पताल का बिल है जिसमें ₹5,000 की राशि दिखाई गई है। बिल में रोगी का नाम और उपचार की तारीख शामिल है।"
        : "This appears to be a hospital bill showing an amount of ₹5,000. The bill includes patient name and treatment date.";

    res.json({
      extractedText: mockExtractedText,
      analysis: mockAnalysis,
      confidence: 0.89,
      documentType: "hospital_bill",
    });
  } catch (error) {
    console.error("Image processing error:", error);
    res.status(500).json({
      error: "Failed to process image",
      details: error.message,
    });
  }
});

// Get session data
app.get("/api/session/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      error: "Session not found",
    });
  }

  res.json(session);
});

// Get all documents
app.get("/api/documents", (req, res) => {
  const allDocuments = Array.from(documents.values());
  res.json(allDocuments);
});

// Get specific document
app.get("/api/documents/:documentId", (req, res) => {
  const { documentId } = req.params;
  const document = documents.get(documentId);

  if (!document) {
    return res.status(404).json({
      error: "Document not found",
    });
  }

  res.json(document);
});

// Update document status
app.patch("/api/documents/:documentId", (req, res) => {
  const { documentId } = req.params;
  const { status } = req.body;

  const document = documents.get(documentId);

  if (!document) {
    return res.status(404).json({
      error: "Document not found",
    });
  }

  document.status = status;
  documents.set(documentId, document);

  res.json(document);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({
    error: "Internal server error",
    details: error.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.path,
    method: req.method,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(
    `🚀 Voice Civic Assistant Backend running on http://localhost:${PORT}`,
  );
  console.log(`📋 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});
