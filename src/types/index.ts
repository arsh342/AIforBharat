/**
 * Core type definitions for the Voice-First Civic Assistant
 * Based on the design document specifications
 */

// ============================================================================
// Enums and Constants
// ============================================================================

export enum Language {
  HINDI = "hi",
  ENGLISH = "en",
}

export enum Intent {
  ELIGIBILITY_CHECK = "eligibility",
  GRIEVANCE_FILING = "grievance",
  GENERAL_INQUIRY = "inquiry",
}

export enum ComplaintCategory {
  HOSPITAL_OVERCHARGING = "overcharging",
  BENEFIT_DENIAL = "benefit_denial",
  SERVICE_QUALITY = "service_quality",
  DISCRIMINATION = "discrimination",
}

export enum DocumentType {
  PM_JAY_APPLICATION = "pmjay_application",
  HEALTH_GRIEVANCE = "health_grievance",
  SUPPORTING_DOCUMENT = "supporting_doc",
}

export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export enum FamilyRelation {
  HEAD = "head",
  SPOUSE = "spouse",
  CHILD = "child",
  PARENT = "parent",
  SIBLING = "sibling",
  OTHER = "other",
}

export enum IncomeCategory {
  BPL = "below_poverty_line",
  APL = "above_poverty_line",
  SECC_ELIGIBLE = "secc_eligible",
}

export enum RationCardType {
  AAY = "antyodaya",
  BPL = "below_poverty_line",
  APL = "above_poverty_line",
  NONE = "none",
}

export enum HousingType {
  KUTCHA = "kutcha",
  SEMI_PUCCA = "semi_pucca",
  PUCCA = "pucca",
  HOMELESS = "homeless",
}

export enum SeverityLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum EvidenceType {
  DOCUMENT = "document",
  IMAGE = "image",
  AUDIO = "audio",
  WITNESS = "witness",
}

export enum DocumentStatus {
  DRAFT = "draft",
  UNDER_REVIEW = "under_review",
  CONFIRMED = "confirmed",
  SUBMITTED = "submitted",
}

export enum AudioQuality {
  EXCELLENT = "excellent",
  GOOD = "good",
  FAIR = "fair",
  POOR = "poor",
}

// ============================================================================
// User and Session Management
// ============================================================================

export interface UserSession {
  sessionId: string;
  userId?: string;
  language: Language;
  conversationHistory: ConversationTurn[];
  currentIntent: Intent;
  createdAt: Date;
  expiresAt: Date;
}

export interface ConversationTurn {
  timestamp: Date;
  userInput: string;
  systemResponse: string;
  intent: Intent;
  entities: ExtractedEntity[];
}

export interface ConversationContext {
  sessionId: string;
  currentIntent: Intent;
  language: Language;
  accumulatedInfo: Record<string, any>;
  conversationHistory: ConversationTurn[];
}

export interface ExtractedEntity {
  type: string;
  value: string;
  confidence: number;
  startIndex?: number;
  endIndex?: number;
}

// ============================================================================
// Speech Processing
// ============================================================================

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: Language;
  timestamp: Date;
}

export interface AudioQualityAssessment {
  quality: AudioQuality;
  issues: string[];
  recommendations: string[];
}

// ============================================================================
// Intent Classification
// ============================================================================

export interface IntentResult {
  intent: Intent;
  confidence: number;
  entities: ExtractedEntity[];
  reasoning: string;
}

export interface ClarificationQuestion {
  question: string;
  options?: string[];
  context: string;
}

// ============================================================================
// Household and Eligibility
// ============================================================================

export interface HouseholdInfo {
  headOfHousehold: PersonInfo;
  members: PersonInfo[];
  address: Address;
  economicStatus: EconomicIndicators;
  existingSchemes: string[];
}

export interface PersonInfo {
  name: string;
  age: number;
  gender: Gender;
  relation: FamilyRelation;
  occupation?: string;
  disabilities?: Disability[];
  chronicConditions?: MedicalCondition[];
}

export interface Address {
  street?: string;
  village?: string;
  district: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface EconomicIndicators {
  incomeCategory: IncomeCategory;
  rationCardType?: RationCardType;
  landOwnership?: LandOwnership;
  housingType: HousingType;
  assets: Asset[];
}

export interface Disability {
  type: string;
  severity: string;
  certified: boolean;
}

export interface MedicalCondition {
  condition: string;
  chronic: boolean;
  treatmentRequired: boolean;
}

export interface LandOwnership {
  hasLand: boolean;
  acreage?: number;
  irrigated?: boolean;
}

export interface Asset {
  type: string;
  description: string;
  value?: number;
}

export interface EligibilityResult {
  eligible: boolean;
  reasoning: string[];
  missingCriteria?: string[];
  qualifyingFactors?: string[];
  confidenceScore: number;
}

export interface Question {
  question: string;
  type: "text" | "choice" | "number" | "date";
  options?: string[];
  required: boolean;
  context: string;
}

export interface Explanation {
  summary: string;
  details: string[];
  references: string[];
}

// ============================================================================
// Grievance and Complaint
// ============================================================================

export interface UserComplaint {
  description: string;
  incidentDate: Date;
  location: string;
  involvedParties: string[];
  category: ComplaintCategory;
  severity: SeverityLevel;
  evidence: Evidence[];
}

export interface Evidence {
  type: EvidenceType;
  description: string;
  imageData?: Buffer;
  extractedInfo?: ExtractedInfo;
}

export interface GrievanceDocument {
  title: string;
  description: string;
  category: ComplaintCategory;
  legalReferences: string[];
  evidence: Evidence[];
  recommendedAction: string;
}

export interface EvidenceRequirement {
  type: EvidenceType;
  description: string;
  required: boolean;
  examples: string[];
}

// ============================================================================
// Image Analysis
// ============================================================================

export interface ExtractedInfo {
  text: string;
  keyFields: Record<string, string>;
  documentType: DocumentType;
  confidence: number;
}

export interface QualityAssessment {
  acceptable: boolean;
  issues: string[];
  suggestions: string[];
}

export interface KeyValuePair {
  key: string;
  value: string;
  confidence: number;
}

// ============================================================================
// Document Generation
// ============================================================================

export interface Document {
  id: string;
  type: DocumentType;
  title: string;
  content: DocumentContent;
  metadata: DocumentMetadata;
  status: DocumentStatus;
}

export interface DocumentContent {
  sections: DocumentSection[];
  formFields: Record<string, FormField>;
  attachments: Attachment[];
}

export interface DocumentSection {
  title: string;
  content: string;
  required: boolean;
  complete: boolean;
}

export interface FormField {
  label: string;
  value: string;
  type: "text" | "number" | "date" | "choice";
  required: boolean;
  complete: boolean;
  validation?: string;
}

export interface Attachment {
  name: string;
  type: string;
  data: Buffer;
  description: string;
}

export interface DocumentMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  language: Language;
  version: number;
}

export interface ApplicationDraft {
  formFields: Record<string, string>;
  requiredDocuments: string[];
  submissionInstructions: string;
  incompleteFields: string[];
}

export interface GrievanceForm {
  complaintId: string;
  formFields: Record<string, string>;
  attachedEvidence: string[];
  submissionInstructions: string;
}

export interface FormattedDocument {
  content: string;
  format: OutputFormat;
  metadata: DocumentMetadata;
}

export enum OutputFormat {
  PDF = "pdf",
  HTML = "html",
  JSON = "json",
  PLAIN_TEXT = "plain_text",
}

// ============================================================================
// Confirmation and Review
// ============================================================================

export interface ReviewSession {
  sessionId: string;
  document: Document;
  highlightedFields: string[];
  suggestedChanges: string[];
}

export interface UserFeedback {
  changes: Record<string, string>;
  comments: string[];
  approved: boolean;
}

export interface UpdatedDocument {
  document: Document;
  changesSummary: string[];
  requiresReview: boolean;
}

export interface FinalDocument {
  document: Document;
  approvalTimestamp: Date;
  submissionReady: boolean;
}

// ============================================================================
// User Information
// ============================================================================

export interface UserInfo {
  name: string;
  phone?: string;
  email?: string;
  address: Address;
  preferredLanguage: Language;
  identityDocuments: IdentityDocument[];
}

export interface IdentityDocument {
  type: string;
  number: string;
  verified: boolean;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  timestamp: Date;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface SystemConfig {
  aws: AWSConfig;
  ai: AIConfig;
  security: SecurityConfig;
  performance: PerformanceConfig;
}

export interface AWSConfig {
  region: string;
  s3Bucket: string;
  dynamoTableName: string;
  bedrockModelId: string;
}

export interface AIConfig {
  transcribeLanguages: Language[];
  bedrockModels: Record<string, string>;
  confidenceThresholds: Record<string, number>;
}

export interface SecurityConfig {
  encryptionKeyId: string;
  dataRetentionHours: number;
  allowedOrigins: string[];
}

export interface PerformanceConfig {
  timeoutSeconds: number;
  maxConcurrentRequests: number;
  cacheTTLSeconds: number;
}
