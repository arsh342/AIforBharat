#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const voice_civic_assistant_stack_1 = require("./voice-civic-assistant-stack");
const app = new cdk.App();
// Get environment configuration
const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "us-east-1",
};
// Create the main stack
new voice_civic_assistant_stack_1.VoiceCivicAssistantStack(app, "VoiceCivicAssistantStack", {
    env,
    description: "Voice-First Civic Assistant for PM-JAY eligibility and health grievances",
    tags: {
        Project: "VoiceCivicAssistant",
        Environment: process.env.ENVIRONMENT || "development",
        Owner: "VoiceCivicAssistantTeam",
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMsK0VBQXlFO0FBRXpFLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLGdDQUFnQztBQUNoQyxNQUFNLEdBQUcsR0FBRztJQUNWLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQjtJQUN4QyxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsSUFBSSxXQUFXO0NBQ3RELENBQUM7QUFFRix3QkFBd0I7QUFDeEIsSUFBSSxzREFBd0IsQ0FBQyxHQUFHLEVBQUUsMEJBQTBCLEVBQUU7SUFDNUQsR0FBRztJQUNILFdBQVcsRUFDVCwwRUFBMEU7SUFDNUUsSUFBSSxFQUFFO1FBQ0osT0FBTyxFQUFFLHFCQUFxQjtRQUM5QixXQUFXLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLElBQUksYUFBYTtRQUNyRCxLQUFLLEVBQUUseUJBQXlCO0tBQ2pDO0NBQ0YsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuaW1wb3J0IFwic291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyXCI7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XG5pbXBvcnQgeyBWb2ljZUNpdmljQXNzaXN0YW50U3RhY2sgfSBmcm9tIFwiLi92b2ljZS1jaXZpYy1hc3Npc3RhbnQtc3RhY2tcIjtcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxuLy8gR2V0IGVudmlyb25tZW50IGNvbmZpZ3VyYXRpb25cbmNvbnN0IGVudiA9IHtcbiAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcbiAgcmVnaW9uOiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9SRUdJT04gfHwgXCJ1cy1lYXN0LTFcIixcbn07XG5cbi8vIENyZWF0ZSB0aGUgbWFpbiBzdGFja1xubmV3IFZvaWNlQ2l2aWNBc3Npc3RhbnRTdGFjayhhcHAsIFwiVm9pY2VDaXZpY0Fzc2lzdGFudFN0YWNrXCIsIHtcbiAgZW52LFxuICBkZXNjcmlwdGlvbjpcbiAgICBcIlZvaWNlLUZpcnN0IENpdmljIEFzc2lzdGFudCBmb3IgUE0tSkFZIGVsaWdpYmlsaXR5IGFuZCBoZWFsdGggZ3JpZXZhbmNlc1wiLFxuICB0YWdzOiB7XG4gICAgUHJvamVjdDogXCJWb2ljZUNpdmljQXNzaXN0YW50XCIsXG4gICAgRW52aXJvbm1lbnQ6IHByb2Nlc3MuZW52LkVOVklST05NRU5UIHx8IFwiZGV2ZWxvcG1lbnRcIixcbiAgICBPd25lcjogXCJWb2ljZUNpdmljQXNzaXN0YW50VGVhbVwiLFxuICB9LFxufSk7XG4iXX0=