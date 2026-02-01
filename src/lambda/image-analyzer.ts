/**
 * Image Analyzer Lambda Function
 * Extracts information from uploaded documents and images
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { APIResponse } from "../types";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    console.log(
      "Image Analyzer received event:",
      JSON.stringify(event, null, 2),
    );

    const response: APIResponse = {
      success: true,
      data: {
        message: "Image Analyzer is ready",
        supportedFormats: ["JPEG", "PNG", "PDF"],
        maxFileSize: "10MB",
        supportedDocuments: [
          "medical_bills",
          "prescriptions",
          "identity_documents",
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
    console.error("Image Analyzer error:", error);

    const errorResponse: APIResponse = {
      success: false,
      error: {
        code: "IMAGE_ANALYZER_ERROR",
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
