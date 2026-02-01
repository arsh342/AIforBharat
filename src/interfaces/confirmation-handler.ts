/**
 * Confirmation Handler Interface
 * Manages human-in-the-loop confirmation workflow
 */

import {
  ReviewSession,
  UserFeedback,
  UpdatedDocument,
  FinalDocument,
  Document,
} from "../types";

export interface ConfirmationHandler {
  /**
   * Present document for user review
   * @param document Document to review
   * @returns Review session with highlighted fields
   */
  presentForReview(document: Document): Promise<ReviewSession>;

  /**
   * Process user feedback and update document
   * @param sessionId Review session identifier
   * @param feedback User feedback and changes
   * @returns Updated document with changes applied
   */
  processUserFeedback(
    sessionId: string,
    feedback: UserFeedback,
  ): Promise<UpdatedDocument>;

  /**
   * Finalize document after user approval
   * @param sessionId Review session identifier
   * @param approved Whether user approved the document
   * @returns Final document ready for submission
   */
  finalizeDocument(
    sessionId: string,
    approved: boolean,
  ): Promise<FinalDocument>;

  /**
   * Get review session by ID
   * @param sessionId Review session identifier
   * @returns Review session details
   */
  getReviewSession(sessionId: string): Promise<ReviewSession | null>;

  /**
   * Highlight important fields in document
   * @param document Document to analyze
   * @returns Array of field names to highlight
   */
  identifyHighlightFields(document: Document): Promise<string[]>;

  /**
   * Generate suggested changes for document improvement
   * @param document Document to analyze
   * @returns Array of suggested changes
   */
  generateSuggestedChanges(document: Document): Promise<string[]>;

  /**
   * Validate user feedback before applying changes
   * @param feedback User feedback
   * @param document Original document
   * @returns Validation result with any issues
   */
  validateFeedback(
    feedback: UserFeedback,
    document: Document,
  ): Promise<FeedbackValidationResult>;

  /**
   * Track document changes across review iterations
   * @param originalDocument Original document
   * @param updatedDocument Updated document
   * @returns Change summary
   */
  trackChanges(
    originalDocument: Document,
    updatedDocument: Document,
  ): Promise<ChangesSummary>;
}

export interface FeedbackValidationResult {
  valid: boolean;
  issues: string[];
  warnings: string[];
}

export interface ChangesSummary {
  totalChanges: number;
  fieldChanges: FieldChange[];
  addedSections: string[];
  removedSections: string[];
  timestamp: Date;
}

export interface FieldChange {
  fieldName: string;
  oldValue: string;
  newValue: string;
  changeType: "modified" | "added" | "removed";
}
