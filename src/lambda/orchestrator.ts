/**
 * Main Orchestrator Lambda Function
 * Coordinates workflow between all system components
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { APIResponse } from "../types";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("Orchestrator received event:", JSON.stringify(event, null, 2));

    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};

    // Basic health check response for now
    const response: APIResponse = {
      success: true,
      data: {
        message: "Voice Civic Assistant Orchestrator is running",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
      timestamp: new Date(),
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("Orchestrator error:", error);

    const errorResponse: APIResponse = {
      success: false,
      error: {
        code: "ORCHESTRATOR_ERROR",
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
