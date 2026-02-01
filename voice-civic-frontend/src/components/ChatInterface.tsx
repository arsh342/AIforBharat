import React, { useState, useRef, useEffect } from "react";
import { Send, Volume2 } from "lucide-react";
import { Message, Language } from "../App";
import { processTextInput } from "../services/api";

interface ChatInterfaceProps {
  messages: Message[];
  language: Language;
  onMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  isProcessing: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  language,
  onMessage,
  isProcessing,
}) => {
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;

    const userMessage = inputText.trim();
    setInputText("");

    // Add user message
    onMessage({
      type: "user",
      content: userMessage,
    });

    setIsTyping(true);

    try {
      const result = await processTextInput(userMessage, language);

      // Add assistant response
      onMessage({
        type: "assistant",
        content: result.response,
      });
    } catch (error) {
      console.error("Error processing text:", error);
      onMessage({
        type: "assistant",
        content:
          language === "hi"
            ? "क्षमा करें, आपके संदेश को प्रोसेस करने में समस्या हुई। कृपया दोबारा कोशिश करें।"
            : "Sorry, there was an error processing your message. Please try again.",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(console.error);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(language === "hi" ? "hi-IN" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSampleQuestions = () => {
    if (language === "hi") {
      return [
        "मैं PM-JAY योजना के लिए पात्र हूं या नहीं?",
        "अस्पताल ने ज्यादा पैसे लिए हैं, शिकायत कैसे करूं?",
        "मेरे परिवार में 5 सदस्य हैं, क्या हम योजना के लिए योग्य हैं?",
        "डॉक्टर ने इलाज से मना कर दिया, क्या करूं?",
      ];
    } else {
      return [
        "Am I eligible for the PM-JAY scheme?",
        "The hospital overcharged me, how do I file a complaint?",
        "My family has 5 members, are we eligible for the scheme?",
        "The doctor refused treatment, what should I do?",
      ];
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <h3>
              {language === "hi" ? "बातचीत शुरू करें" : "Start a conversation"}
            </h3>
            <p>
              {language === "hi"
                ? "नीचे दिए गए सवालों में से कोई एक चुनें या अपना सवाल टाइप करें:"
                : "Choose from the sample questions below or type your own:"}
            </p>
            <div className="sample-questions">
              {getSampleQuestions().map((question, index) => (
                <button
                  key={index}
                  className="sample-question"
                  onClick={() => setInputText(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-content">
                {message.content}
                {message.audioUrl && (
                  <button
                    className="audio-play-button"
                    onClick={() => playAudio(message.audioUrl!)}
                  >
                    <Volume2 size={16} />
                    {language === "hi" ? "सुनें" : "Play"}
                  </button>
                )}
              </div>
              <div className="message-time">
                {formatTime(message.timestamp)}
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="message assistant typing">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            language === "hi"
              ? "अपना सवाल यहां टाइप करें..."
              : "Type your question here..."
          }
          disabled={isProcessing}
        />
        <button
          type="submit"
          className="send-button"
          disabled={!inputText.trim() || isProcessing}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
