#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { VoiceCivicAssistantStack } from "./voice-civic-assistant-stack";

const app = new cdk.App();

// Get environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || "us-east-1",
};

// Create the main stack
new VoiceCivicAssistantStack(app, "VoiceCivicAssistantStack", {
  env,
  description:
    "Voice-First Civic Assistant for PM-JAY eligibility and health grievances",
  tags: {
    Project: "VoiceCivicAssistant",
    Environment: process.env.ENVIRONMENT || "development",
    Owner: "VoiceCivicAssistantTeam",
  },
});
