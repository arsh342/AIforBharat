/**
 * Grievance Generator Lambda Function
 * Converts unstructured complaints into formal grievance documents
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { APIResponse } from "../types";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log(
      "Grievance Generator received event:",
      JSON.stringify(event, null, 2),
    );

    const response: APIResponse = {
      success: true,
      data: {
        message: "Grievance Generator is ready",
        supportedCategories: [
          "overcharging",
          "benefit_denial",
          "service_quality",
          "discrimination",
        ],
        legalReferences: [
          "PM-JAY Guidelines",
          "Consumer Protection Act",
          "Right to Health",
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
    console.error("Grievance Generator error:", error);

    const errorResponse: APIResponse = {
      success: false,
      error: {
        code: "GRIEVANCE_GENERATOR_ERROR",
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
