import React, { useState } from "react";
import "./App.css";
import VoiceRecorder from "./components/VoiceRecorder";
import ChatInterface from "./components/ChatInterface";
import DocumentViewer from "./components/DocumentViewer";
import LanguageSelector from "./components/LanguageSelector";
import { Mic, FileText, MessageCircle } from "lucide-react";

export interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface Document {
  id: string;
  type: "pmjay_application" | "health_grievance";
  title: string;
  content: any;
  status: "draft" | "confirmed" | "submitted";
}

export type Language = "en" | "hi";

function App() {
  const [activeTab, setActiveTab] = useState<"voice" | "chat" | "documents">(
    "voice",
  );
  const [language, setLanguage] = useState<Language>("en");
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addMessage = (message: Omit<Message, "id" | "timestamp">) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const addDocument = (document: Omit<Document, "id">) => {
    const newDocument: Document = {
      ...document,
      id: Date.now().toString(),
    };
    setDocuments((prev) => [...prev, newDocument]);
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>Voice-First Civic Assistant</h1>
          <p>
            Access PM-JAY eligibility and file health grievances using your
            voice
          </p>
          <LanguageSelector
            language={language}
            onLanguageChange={setLanguage}
          />
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={`nav-button ${activeTab === "voice" ? "active" : ""}`}
          onClick={() => setActiveTab("voice")}
        >
          <Mic size={20} />
          Voice Assistant
        </button>
        <button
          className={`nav-button ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          <MessageCircle size={20} />
          Conversation
        </button>
        <button
          className={`nav-button ${activeTab === "documents" ? "active" : ""}`}
          onClick={() => setActiveTab("documents")}
        >
          <FileText size={20} />
          Documents ({documents.length})
        </button>
      </nav>

      <main className="app-main">
        {activeTab === "voice" && (
          <VoiceRecorder
            language={language}
            onMessage={addMessage}
            onDocument={addDocument}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        )}

        {activeTab === "chat" && (
          <ChatInterface
            messages={messages}
            language={language}
            onMessage={addMessage}
            isProcessing={isProcessing}
          />
        )}

        {activeTab === "documents" && (
          <DocumentViewer
            documents={documents}
            language={language}
            onDocumentUpdate={(id, updates) => {
              setDocuments((prev) =>
                prev.map((doc) =>
                  doc.id === id ? { ...doc, ...updates } : doc,
                ),
              );
            }}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>
          {language === "hi"
            ? "आपकी गोपनीयता सुरक्षित है। सभी डेटा 24 घंटे बाद स्वचालित रूप से हटा दिया जाता है।"
            : "Your privacy is protected. All data is automatically deleted after 24 hours."}
        </p>
      </footer>
    </div>
  );
}

export default App;
