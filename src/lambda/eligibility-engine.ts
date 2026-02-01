/**
 * Eligibility Engine Lambda Function
 * Evaluates PM-JAY eligibility based on household information
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { APIResponse } from "../types";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log(
      "Eligibility Engine received event:",
      JSON.stringify(event, null, 2),
    );

    const response: APIResponse = {
      success: true,
      data: {
        message: "Eligibility Engine is ready",
        supportedSchemes: ["PM-JAY", "Ayushman Bharat"],
        eligibilityCriteria: [
          "income",
          "household_composition",
          "existing_schemes",
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
    console.error("Eligibility Engine error:", error);

    const errorResponse: APIResponse = {
      success: false,
      error: {
        code: "ELIGIBILITY_ENGINE_ERROR",
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
