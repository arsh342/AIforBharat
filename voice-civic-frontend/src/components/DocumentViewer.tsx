import React, { useState } from "react";
import { FileText, Download, Check, X, Eye } from "lucide-react";
import { Document, Language } from "../App";

interface DocumentViewerProps {
  documents: Document[];
  language: Language;
  onDocumentUpdate: (id: string, updates: Partial<Document>) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documents,
  language,
  onDocumentUpdate,
}) => {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);

  const getDocumentTypeLabel = (type: Document["type"]) => {
    if (language === "hi") {
      switch (type) {
        case "pmjay_application":
          return "PM-JAY आवेदन";
        case "health_grievance":
          return "स्वास्थ्य शिकायत";
        default:
          return "दस्तावेज़";
      }
    } else {
      switch (type) {
        case "pmjay_application":
          return "PM-JAY Application";
        case "health_grievance":
          return "Health Grievance";
        default:
          return "Document";
      }
    }
  };

  const getStatusLabel = (status: Document["status"]) => {
    if (language === "hi") {
      switch (status) {
        case "draft":
          return "मसौदा";
        case "confirmed":
          return "पुष्ट";
        case "submitted":
          return "जमा किया गया";
        default:
          return status;
      }
    } else {
      switch (status) {
        case "draft":
          return "Draft";
        case "confirmed":
          return "Confirmed";
        case "submitted":
          return "Submitted";
        default:
          return status;
      }
    }
  };

  const handleConfirmDocument = (documentId: string) => {
    onDocumentUpdate(documentId, { status: "confirmed" });
  };

  const handleDownloadDocument = (doc: Document) => {
    const content = JSON.stringify(doc.content, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${doc.title.replace(/\s+/g, "_")}.json`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderDocumentContent = (document: Document) => {
    if (document.type === "pmjay_application") {
      return (
        <div className="document-content">
          <h4>{language === "hi" ? "आवेदन विवरण:" : "Application Details:"}</h4>
          <div className="form-fields">
            {Object.entries(document.content.formFields || {}).map(
              ([key, value]) => (
                <div key={key} className="field-row">
                  <label>{key}:</label>
                  <span>{String(value)}</span>
                </div>
              ),
            )}
          </div>

          {document.content.requiredDocuments && (
            <div className="required-docs">
              <h5>
                {language === "hi"
                  ? "आवश्यक दस्तावेज़:"
                  : "Required Documents:"}
              </h5>
              <ul>
                {document.content.requiredDocuments.map(
                  (doc: string, index: number) => (
                    <li key={index}>{doc}</li>
                  ),
                )}
              </ul>
            </div>
          )}
        </div>
      );
    } else if (document.type === "health_grievance") {
      return (
        <div className="document-content">
          <h4>{language === "hi" ? "शिकायत विवरण:" : "Grievance Details:"}</h4>
          <div className="grievance-content">
            <div className="field-row">
              <label>{language === "hi" ? "शीर्षक:" : "Title:"}</label>
              <span>{document.content.title}</span>
            </div>
            <div className="field-row">
              <label>{language === "hi" ? "विवरण:" : "Description:"}</label>
              <p>{document.content.description}</p>
            </div>
            <div className="field-row">
              <label>{language === "hi" ? "श्रेणी:" : "Category:"}</label>
              <span>{document.content.category}</span>
            </div>

            {document.content.legalReferences && (
              <div className="legal-references">
                <h5>
                  {language === "hi" ? "कानूनी संदर्भ:" : "Legal References:"}
                </h5>
                <ul>
                  {document.content.legalReferences.map(
                    (ref: string, index: number) => (
                      <li key={index}>{ref}</li>
                    ),
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="document-content">
        <pre>{JSON.stringify(document.content, null, 2)}</pre>
      </div>
    );
  };

  if (documents.length === 0) {
    return (
      <div className="document-viewer">
        <div className="empty-state">
          <FileText size={64} />
          <h3>
            {language === "hi"
              ? "कोई दस्तावेज़ नहीं मिला"
              : "No documents found"}
          </h3>
          <p>
            {language === "hi"
              ? "आवाज़ सहायक का उपयोग करके दस्तावेज़ बनाएं"
              : "Use the voice assistant to generate documents"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="document-viewer">
      <div className="documents-header">
        <h2>{language === "hi" ? "आपके दस्तावेज़" : "Your Documents"}</h2>
        <p>
          {language === "hi"
            ? "यहां आपके द्वारा बनाए गए सभी दस्तावेज़ हैं"
            : "Here are all the documents you have generated"}
        </p>
      </div>

      <div className="documents-grid">
        {documents.map((document) => (
          <div key={document.id} className="document-card">
            <div className="document-header">
              <div className="document-info">
                <h3 className="document-title">{document.title}</h3>
                <p className="document-type">
                  {getDocumentTypeLabel(document.type)}
                </p>
              </div>
              <span className={`document-status ${document.status}`}>
                {getStatusLabel(document.status)}
              </span>
            </div>

            <div className="document-preview">
              {document.type === "pmjay_application" && (
                <p>
                  {language === "hi"
                    ? "PM-JAY योजना के लिए आवेदन फॉर्म"
                    : "Application form for PM-JAY scheme"}
                </p>
              )}
              {document.type === "health_grievance" && (
                <p>
                  {language === "hi"
                    ? "स्वास्थ्य संबंधी शिकायत दस्तावेज़"
                    : "Health-related grievance document"}
                </p>
              )}
            </div>

            <div className="document-actions">
              <button
                className="action-button secondary"
                onClick={() => setSelectedDocument(document)}
              >
                <Eye size={16} />
                {language === "hi" ? "देखें" : "View"}
              </button>

              <button
                className="action-button secondary"
                onClick={() => handleDownloadDocument(document)}
              >
                <Download size={16} />
                {language === "hi" ? "डाउनलोड" : "Download"}
              </button>

              {document.status === "draft" && (
                <button
                  className="action-button primary"
                  onClick={() => handleConfirmDocument(document.id)}
                >
                  <Check size={16} />
                  {language === "hi" ? "पुष्टि करें" : "Confirm"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Document Detail Modal */}
      {selectedDocument && (
        <div
          className="document-modal-overlay"
          onClick={() => setSelectedDocument(null)}
        >
          <div className="document-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedDocument.title}</h2>
              <button
                className="close-button"
                onClick={() => setSelectedDocument(null)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-content">
              {renderDocumentContent(selectedDocument)}
            </div>

            <div className="modal-actions">
              <button
                className="action-button secondary"
                onClick={() => handleDownloadDocument(selectedDocument)}
              >
                <Download size={16} />
                {language === "hi" ? "डाउनलोड" : "Download"}
              </button>

              {selectedDocument.status === "draft" && (
                <button
                  className="action-button primary"
                  onClick={() => {
                    handleConfirmDocument(selectedDocument.id);
                    setSelectedDocument(null);
                  }}
                >
                  <Check size={16} />
                  {language === "hi" ? "पुष्टि करें" : "Confirm"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
