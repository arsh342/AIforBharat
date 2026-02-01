/**
 * Document Generator Lambda Function
 * Creates structured application drafts and grievance forms
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { APIResponse } from "../types";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log(
      "Document Generator received event:",
      JSON.stringify(event, null, 2),
    );

    const response: APIResponse = {
      success: true,
      data: {
        message: "Document Generator is ready",
        supportedDocuments: ["pmjay_application", "health_grievance"],
        outputFormats: ["PDF", "HTML", "JSON"],
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
    console.error("Document Generator error:", error);

    const errorResponse: APIResponse = {
      success: false,
      error: {
        code: "DOCUMENT_GENERATOR_ERROR",
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
