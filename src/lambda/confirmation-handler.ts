/**
 * Confirmation Handler Lambda Function
 * Manages human-in-the-loop confirmation workflow
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { APIResponse } from "../types";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log(
      "Confirmation Handler received event:",
      JSON.stringify(event, null, 2),
    );

    const response: APIResponse = {
      success: true,
      data: {
        message: "Confirmation Handler is ready",
        supportedActions: [
          "present_for_review",
          "process_feedback",
          "finalize_document",
        ],
        reviewFeatures: [
          "highlight_fields",
          "suggest_changes",
          "track_modifications",
        ],
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
    console.error("Confirmation Handler error:", error);

    const errorResponse: APIResponse = {
      success: false,
      error: {
        code: "CONFIRMATION_HANDLER_ERROR",
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
