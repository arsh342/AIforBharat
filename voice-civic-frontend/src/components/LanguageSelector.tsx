import React from "react";
import { Language } from "../App";

interface LanguageSelectorProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  language,
  onLanguageChange,
}) => {
  return (
    <div className="language-selector">
      <button
        className={`language-button ${language === "en" ? "active" : ""}`}
        onClick={() => onLanguageChange("en")}
      >
        English
      </button>
      <button
        className={`language-button ${language === "hi" ? "active" : ""}`}
        onClick={() => onLanguageChange("hi")}
      >
        हिंदी
      </button>
    </div>
  );
};

export default LanguageSelector;
