/**
 * Intent Classifier Lambda Function
 * Determines user intent from natural language input
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { APIResponse } from "../types";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log(
      "Intent Classifier received event:",
      JSON.stringify(event, null, 2),
    );

    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};

    // Basic response for now - will implement actual intent classification later
    const response: APIResponse = {
      success: true,
      data: {
        message: "Intent Classifier is ready",
        supportedIntents: ["eligibility", "grievance", "inquiry"],
        confidenceThreshold: 0.8,
      },
      timestamp: new Date(),
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("Intent Classifier error:", error);

    const errorResponse: APIResponse = {
      success: false,
      error: {
        code: "INTENT_CLASSIFIER_ERROR",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      timestamp: new Date(),
    };

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(errorResponse),
    };
  }
};
