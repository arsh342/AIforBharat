/**
 * Eligibility Engine Interface
 * Evaluates PM-JAY eligibility based on household information
 */

import {
  HouseholdInfo,
  EligibilityResult,
  Question,
  Explanation,
} from "../types";

export interface EligibilityEngine {
  /**
   * Assess PM-JAY eligibility for a household
   * @param householdInfo Complete or partial household information
   * @returns Eligibility assessment result
   */
  assessEligibility(
    householdInfo: Partial<HouseholdInfo>,
  ): Promise<EligibilityResult>;

  /**
   * Generate targeted questions for missing information
   * @param incompleteInfo Partial household information
   * @returns Array of questions to gather missing data
   */
  generateQuestions(
    incompleteInfo: Partial<HouseholdInfo>,
  ): Promise<Question[]>;

  /**
   * Provide detailed explanation for eligibility decision
   * @param result Eligibility assessment result
   * @param householdInfo Household information used for assessment
   * @returns Detailed explanation of the decision
   */
  explainDecision(
    result: EligibilityResult,
    householdInfo: Partial<HouseholdInfo>,
  ): Promise<Explanation>;

  /**
   * Validate household information completeness
   * @param householdInfo Household information to validate
   * @returns Array of missing required fields
   */
  validateCompleteness(householdInfo: Partial<HouseholdInfo>): string[];

  /**
   * Check if household qualifies for any specific PM-JAY criteria
   * @param householdInfo Household information
   * @returns Array of qualifying criteria
   */
  identifyQualifyingCriteria(householdInfo: Partial<HouseholdInfo>): string[];

  /**
   * Get official PM-JAY eligibility criteria
   * @returns Array of all eligibility criteria with descriptions
   */
  getEligibilityCriteria(): Promise<EligibilityCriterion[]>;
}

export interface EligibilityCriterion {
  id: string;
  title: string;
  description: string;
  category: string;
  required: boolean;
  weight: number;
}
