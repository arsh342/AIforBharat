import React, { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Upload } from "lucide-react";
import { Message, Document, Language } from "../App";
import { processVoiceInput } from "../services/api";

interface VoiceRecorderProps {
  language: Language;
  onMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  onDocument: (document: Omit<Document, "id">) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  language,
  onMessage,
  onDocument,
  isProcessing,
  setIsProcessing,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Add user message with audio
        onMessage({
          type: "user",
          content:
            language === "hi" ? "आवाज़ संदेश भेजा गया" : "Voice message sent",
          audioUrl,
        });

        // Process the audio
        await processAudio(audioBlob);

        // Clean up
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Auto-stop after 2 minutes
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          stopRecording();
        }
      }, 120000);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert(
        language === "hi"
          ? "माइक्रोफ़ोन एक्सेस की अनुमति दें"
          : "Please allow microphone access",
      );
    }
  }, [language, onMessage]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      const result = await processVoiceInput(audioBlob, language);

      // Add assistant response
      onMessage({
        type: "assistant",
        content: result.response,
      });

      // Add any generated documents
      if (result.document) {
        onDocument(result.document);
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      onMessage({
        type: "assistant",
        content:
          language === "hi"
            ? "क्षमा करें, आपकी आवाज़ को प्रोसेस करने में समस्या हुई। कृपया दोबारा कोशिश करें।"
            : "Sorry, there was an error processing your voice. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      alert(
        language === "hi"
          ? "कृपया एक ऑडियो फ़ाइल चुनें"
          : "Please select an audio file",
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      alert(
        language === "hi"
          ? "फ़ाइल का साइज़ 10MB से कम होना चाहिए"
          : "File size should be less than 10MB",
      );
      return;
    }

    const audioUrl = URL.createObjectURL(file);
    onMessage({
      type: "user",
      content:
        language === "hi" ? "ऑडियो फ़ाइल अपलोड की गई" : "Audio file uploaded",
      audioUrl,
    });

    await processAudio(file);
  };

  return (
    <div className="voice-recorder">
      <div className="recording-status">
        <h3>
          {isProcessing
            ? language === "hi"
              ? "प्रोसेसिंग..."
              : "Processing..."
            : isRecording
              ? language === "hi"
                ? "रिकॉर्डिंग..."
                : "Recording..."
              : language === "hi"
                ? "बोलने के लिए तैयार"
                : "Ready to listen"}
        </h3>

        {isRecording && <p>{formatTime(recordingTime)} / 2:00</p>}

        {!isRecording && !isProcessing && (
          <p>
            {language === "hi"
              ? "माइक्रोफ़ोन बटन दबाएं और अपनी समस्या बताएं"
              : "Press the microphone button and describe your needs"}
          </p>
        )}

        {isProcessing && (
          <p>
            {language === "hi"
              ? "आपकी आवाज़ को समझा जा रहा है..."
              : "Understanding your voice input..."}
          </p>
        )}
      </div>

      <button
        className={`record-button ${isRecording ? "recording" : ""} ${isProcessing ? "processing" : ""}`}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <div className="spinner" />
        ) : isRecording ? (
          <MicOff size={40} />
        ) : (
          <Mic size={40} />
        )}
      </button>

      <div className="upload-section">
        <label className="upload-button">
          <Upload size={20} />
          {language === "hi" ? "ऑडियो फ़ाइल अपलोड करें" : "Upload Audio File"}
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            style={{ display: "none" }}
            disabled={isProcessing || isRecording}
          />
        </label>
      </div>

      <div className="instructions">
        <h4>
          {language === "hi" ? "आप क्या कर सकते हैं:" : "What you can do:"}
        </h4>
        <ul>
          <li>
            {language === "hi"
              ? "PM-JAY योजना की पात्रता जांचें"
              : "Check PM-JAY scheme eligibility"}
          </li>
          <li>
            {language === "hi"
              ? "स्वास्थ्य संबंधी शिकायत दर्ज करें"
              : "File health-related grievances"}
          </li>
          <li>
            {language === "hi"
              ? "अस्पताल के बिल की जांच करें"
              : "Review hospital bills and charges"}
          </li>
          <li>
            {language === "hi"
              ? "आवेदन फॉर्म की सहायता लें"
              : "Get help with application forms"}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default VoiceRecorder;
