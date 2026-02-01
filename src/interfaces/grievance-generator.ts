/**
 * Grievance Generator Interface
 * Converts unstructured complaints into formal grievance documents
 */

import {
  UserComplaint,
  GrievanceDocument,
  ComplaintCategory,
  EvidenceRequirement,
  Evidence,
} from "../types";

export interface GrievanceGenerator {
  /**
   * Generate formal grievance document from user complaint
   * @param complaint User's unstructured complaint
   * @param evidence Optional supporting evidence
   * @returns Structured grievance document
   */
  generateGrievance(
    complaint: UserComplaint,
    evidence?: Evidence[],
  ): Promise<GrievanceDocument>;

  /**
   * Categorize complaint based on description
   * @param description Complaint description
   * @returns Identified complaint category
   */
  categorizeComplaint(description: string): Promise<ComplaintCategory>;

  /**
   * Suggest required evidence for complaint category
   * @param category Complaint category
   * @returns Array of evidence requirements
   */
  suggestEvidence(category: ComplaintCategory): Promise<EvidenceRequirement[]>;

  /**
   * Generate targeted questions for incomplete complaints
   * @param complaint Partial complaint information
   * @returns Array of questions to gather missing details
   */
  generateQuestions(complaint: Partial<UserComplaint>): Promise<Question[]>;

  /**
   * Get relevant legal references for complaint category
   * @param category Complaint category
   * @returns Array of applicable legal and policy references
   */
  getLegalReferences(category: ComplaintCategory): Promise<string[]>;

  /**
   * Validate complaint completeness
   * @param complaint Complaint to validate
   * @returns Array of missing required information
   */
  validateCompleteness(complaint: Partial<UserComplaint>): string[];

  /**
   * Generate recommended actions for complaint resolution
   * @param complaint User complaint
   * @param category Complaint category
   * @returns Recommended resolution actions
   */
  generateRecommendedActions(
    complaint: UserComplaint,
    category: ComplaintCategory,
  ): Promise<string[]>;
}

export interface Question {
  question: string;
  type: "text" | "choice" | "number" | "date";
  options?: string[];
  required: boolean;
  context: string;
}
