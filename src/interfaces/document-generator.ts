/**
 * Document Generator Interface
 * Creates structured application drafts and grievance forms
 */

import {
  ApplicationDraft,
  GrievanceForm,
  FormattedDocument,
  Document,
  EligibilityResult,
  UserInfo,
  GrievanceDocument,
  OutputFormat,
} from "../types";

export interface DocumentGenerator {
  /**
   * Generate PM-JAY application draft from eligibility result
   * @param eligibilityResult Eligibility assessment result
   * @param userInfo User information
   * @returns Structured application draft
   */
  generateApplication(
    eligibilityResult: EligibilityResult,
    userInfo: UserInfo,
  ): Promise<ApplicationDraft>;

  /**
   * Generate health grievance form from grievance document
   * @param grievance Structured grievance document
   * @param userInfo User information
   * @returns Formatted grievance form
   */
  generateGrievanceForm(
    grievance: GrievanceDocument,
    userInfo: UserInfo,
  ): Promise<GrievanceForm>;

  /**
   * Format document for submission in specified format
   * @param document Document to format
   * @param format Output format
   * @returns Formatted document ready for submission
   */
  formatForSubmission(
    document: Document,
    format: OutputFormat,
  ): Promise<FormattedDocument>;

  /**
   * Validate document completeness before generation
   * @param eligibilityResult Eligibility result (for applications)
   * @param grievance Grievance document (for grievances)
   * @param userInfo User information
   * @returns Array of missing required fields
   */
  validateRequiredFields(
    eligibilityResult?: EligibilityResult,
    grievance?: GrievanceDocument,
    userInfo?: UserInfo,
  ): string[];

  /**
   * Generate document template based on type
   * @param documentType Type of document to generate
   * @returns Document template with required fields
   */
  generateTemplate(documentType: string): Promise<DocumentTemplate>;

  /**
   * Populate template with user data
   * @param template Document template
   * @param data User and assessment data
   * @returns Populated document
   */
  populateTemplate(
    template: DocumentTemplate,
    data: Record<string, any>,
  ): Promise<Document>;

  /**
   * Get submission instructions for document type
   * @param documentType Type of document
   * @returns Submission instructions and requirements
   */
  getSubmissionInstructions(
    documentType: string,
  ): Promise<SubmissionInstructions>;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  sections: TemplateSection[];
  requiredFields: string[];
  optionalFields: string[];
  validationRules: ValidationRule[];
}

export interface TemplateSection {
  id: string;
  title: string;
  fields: TemplateField[];
  required: boolean;
  order: number;
}

export interface TemplateField {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "choice" | "boolean";
  required: boolean;
  validation?: string;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

export interface ValidationRule {
  field: string;
  rule: string;
  message: string;
}

export interface SubmissionInstructions {
  steps: string[];
  requiredDocuments: string[];
  submissionMethods: SubmissionMethod[];
  deadlines?: string[];
  contactInfo: ContactInfo[];
}

export interface SubmissionMethod {
  type: "online" | "offline" | "email" | "post";
  description: string;
  url?: string;
  address?: string;
  requirements: string[];
}

export interface ContactInfo {
  type: "phone" | "email" | "address";
  value: string;
  description: string;
  hours?: string;
}
