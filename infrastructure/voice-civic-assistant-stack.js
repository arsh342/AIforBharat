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
exports.VoiceCivicAssistantStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const kms = __importStar(require("aws-cdk-lib/aws-kms"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
class VoiceCivicAssistantStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // ============================================================================
        // KMS Key for Encryption
        // ============================================================================
        const encryptionKey = new kms.Key(this, "VoiceCivicAssistantKey", {
            description: "KMS key for Voice Civic Assistant data encryption",
            enableKeyRotation: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
        });
        encryptionKey.addAlias("alias/voice-civic-assistant");
        // ============================================================================
        // S3 Bucket for Temporary Storage
        // ============================================================================
        const tempStorageBucket = new s3.Bucket(this, "TempStorageBucket", {
            bucketName: `voice-civic-assistant-temp-${this.account}-${this.region}`,
            encryption: s3.BucketEncryption.KMS,
            encryptionKey: encryptionKey,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            versioned: false,
            lifecycleRules: [
                {
                    id: "DeleteTempFiles",
                    enabled: true,
                    expiration: cdk.Duration.hours(24), // Auto-delete after 24 hours
                },
            ],
            removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
        });
        // ============================================================================
        // DynamoDB Table for Session Management
        // ============================================================================
        const sessionTable = new dynamodb.Table(this, "SessionTable", {
            tableName: "voice-civic-assistant-sessions",
            partitionKey: {
                name: "sessionId",
                type: dynamodb.AttributeType.STRING,
            },
            encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryptionKey: encryptionKey,
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            timeToLiveAttribute: "expiresAt",
            removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
            pointInTimeRecovery: true,
        });
        // Add GSI for user-based queries
        sessionTable.addGlobalSecondaryIndex({
            indexName: "UserIdIndex",
            partitionKey: {
                name: "userId",
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: "createdAt",
                type: dynamodb.AttributeType.STRING,
            },
        });
        // ============================================================================
        // IAM Role for Lambda Functions
        // ============================================================================
        const lambdaRole = new iam.Role(this, "LambdaExecutionRole", {
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
            ],
        });
        // Add permissions for AWS services
        lambdaRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                // Bedrock permissions
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream",
                // Transcribe permissions
                "transcribe:StartTranscriptionJob",
                "transcribe:GetTranscriptionJob",
                "transcribe:StartStreamTranscription",
                // Rekognition permissions
                "rekognition:DetectText",
                "rekognition:AnalyzeDocument",
                "rekognition:DetectLabels",
                // S3 permissions
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                // DynamoDB permissions
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan",
                // KMS permissions
                "kms:Decrypt",
                "kms:Encrypt",
                "kms:GenerateDataKey",
            ],
            resources: ["*"], // Restrict in production
        }));
        // ============================================================================
        // Lambda Functions
        // ============================================================================
        // Main orchestrator function
        const orchestratorFunction = new lambda.Function(this, "OrchestratorFunction", {
            functionName: "voice-civic-assistant-orchestrator",
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: "orchestrator.handler",
            code: lambda.Code.fromAsset("dist/lambda"),
            role: lambdaRole,
            timeout: cdk.Duration.seconds(30),
            memorySize: 1024,
            environment: {
                SESSION_TABLE_NAME: sessionTable.tableName,
                TEMP_STORAGE_BUCKET: tempStorageBucket.bucketName,
                KMS_KEY_ID: encryptionKey.keyId,
                BEDROCK_MODEL_ID: "anthropic.claude-3-sonnet-20240229-v1:0",
                LOG_LEVEL: "INFO",
            },
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
        // Speech processor function
        const speechProcessorFunction = new lambda.Function(this, "SpeechProcessorFunction", {
            functionName: "voice-civic-assistant-speech-processor",
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: "speech-processor.handler",
            code: lambda.Code.fromAsset("dist/lambda"),
            role: lambdaRole,
            timeout: cdk.Duration.seconds(30),
            memorySize: 512,
            environment: {
                TEMP_STORAGE_BUCKET: tempStorageBucket.bucketName,
                KMS_KEY_ID: encryptionKey.keyId,
                LOG_LEVEL: "INFO",
            },
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
        // Intent classifier function
        const intentClassifierFunction = new lambda.Function(this, "IntentClassifierFunction", {
            functionName: "voice-civic-assistant-intent-classifier",
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: "intent-classifier.handler",
            code: lambda.Code.fromAsset("dist/lambda"),
            role: lambdaRole,
            timeout: cdk.Duration.seconds(15),
            memorySize: 512,
            environment: {
                BEDROCK_MODEL_ID: "anthropic.claude-3-sonnet-20240229-v1:0",
                LOG_LEVEL: "INFO",
            },
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
        // Eligibility engine function
        const eligibilityEngineFunction = new lambda.Function(this, "EligibilityEngineFunction", {
            functionName: "voice-civic-assistant-eligibility-engine",
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: "eligibility-engine.handler",
            code: lambda.Code.fromAsset("dist/lambda"),
            role: lambdaRole,
            timeout: cdk.Duration.seconds(30),
            memorySize: 1024,
            environment: {
                BEDROCK_MODEL_ID: "anthropic.claude-3-sonnet-20240229-v1:0",
                LOG_LEVEL: "INFO",
            },
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
        // Grievance generator function
        const grievanceGeneratorFunction = new lambda.Function(this, "GrievanceGeneratorFunction", {
            functionName: "voice-civic-assistant-grievance-generator",
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: "grievance-generator.handler",
            code: lambda.Code.fromAsset("dist/lambda"),
            role: lambdaRole,
            timeout: cdk.Duration.seconds(30),
            memorySize: 1024,
            environment: {
                BEDROCK_MODEL_ID: "anthropic.claude-3-sonnet-20240229-v1:0",
                LOG_LEVEL: "INFO",
            },
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
        // Image analyzer function
        const imageAnalyzerFunction = new lambda.Function(this, "ImageAnalyzerFunction", {
            functionName: "voice-civic-assistant-image-analyzer",
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: "image-analyzer.handler",
            code: lambda.Code.fromAsset("dist/lambda"),
            role: lambdaRole,
            timeout: cdk.Duration.seconds(30),
            memorySize: 1024,
            environment: {
                TEMP_STORAGE_BUCKET: tempStorageBucket.bucketName,
                BEDROCK_MODEL_ID: "anthropic.claude-3-sonnet-20240229-v1:0",
                LOG_LEVEL: "INFO",
            },
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
        // Document generator function
        const documentGeneratorFunction = new lambda.Function(this, "DocumentGeneratorFunction", {
            functionName: "voice-civic-assistant-document-generator",
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: "document-generator.handler",
            code: lambda.Code.fromAsset("dist/lambda"),
            role: lambdaRole,
            timeout: cdk.Duration.seconds(30),
            memorySize: 512,
            environment: {
                TEMP_STORAGE_BUCKET: tempStorageBucket.bucketName,
                LOG_LEVEL: "INFO",
            },
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
        // Confirmation handler function
        const confirmationHandlerFunction = new lambda.Function(this, "ConfirmationHandlerFunction", {
            functionName: "voice-civic-assistant-confirmation-handler",
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: "confirmation-handler.handler",
            code: lambda.Code.fromAsset("dist/lambda"),
            role: lambdaRole,
            timeout: cdk.Duration.seconds(15),
            memorySize: 512,
            environment: {
                SESSION_TABLE_NAME: sessionTable.tableName,
                LOG_LEVEL: "INFO",
            },
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
        // ============================================================================
        // API Gateway
        // ============================================================================
        const api = new apigateway.RestApi(this, "VoiceCivicAssistantAPI", {
            restApiName: "Voice Civic Assistant API",
            description: "API for Voice-First Civic Assistant",
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS, // Restrict in production
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: [
                    "Content-Type",
                    "X-Amz-Date",
                    "Authorization",
                    "X-Api-Key",
                ],
            },
            deployOptions: {
                stageName: "v1",
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: true,
                metricsEnabled: true,
            },
        });
        // Main orchestrator endpoint
        const orchestratorIntegration = new apigateway.LambdaIntegration(orchestratorFunction);
        api.root.addResource("process").addMethod("POST", orchestratorIntegration);
        // Speech processing endpoint
        const speechIntegration = new apigateway.LambdaIntegration(speechProcessorFunction);
        api.root.addResource("speech").addMethod("POST", speechIntegration);
        // Intent classification endpoint
        const intentIntegration = new apigateway.LambdaIntegration(intentClassifierFunction);
        api.root.addResource("intent").addMethod("POST", intentIntegration);
        // Eligibility assessment endpoint
        const eligibilityIntegration = new apigateway.LambdaIntegration(eligibilityEngineFunction);
        api.root
            .addResource("eligibility")
            .addMethod("POST", eligibilityIntegration);
        // Grievance generation endpoint
        const grievanceIntegration = new apigateway.LambdaIntegration(grievanceGeneratorFunction);
        api.root.addResource("grievance").addMethod("POST", grievanceIntegration);
        // Image analysis endpoint
        const imageIntegration = new apigateway.LambdaIntegration(imageAnalyzerFunction);
        api.root.addResource("image").addMethod("POST", imageIntegration);
        // Document generation endpoint
        const documentIntegration = new apigateway.LambdaIntegration(documentGeneratorFunction);
        api.root.addResource("document").addMethod("POST", documentIntegration);
        // Confirmation handling endpoint
        const confirmationIntegration = new apigateway.LambdaIntegration(confirmationHandlerFunction);
        api.root.addResource("confirm").addMethod("POST", confirmationIntegration);
        // Health check endpoint
        api.root.addResource("health").addMethod("GET", new apigateway.MockIntegration({
            integrationResponses: [
                {
                    statusCode: "200",
                    responseTemplates: {
                        "application/json": JSON.stringify({
                            status: "healthy",
                            timestamp: "$context.requestTime",
                            version: "1.0.0",
                        }),
                    },
                },
            ],
            requestTemplates: {
                "application/json": '{"statusCode": 200}',
            },
        }), {
            methodResponses: [
                {
                    statusCode: "200",
                    responseModels: {
                        "application/json": apigateway.Model.EMPTY_MODEL,
                    },
                },
            ],
        });
        // ============================================================================
        // Outputs
        // ============================================================================
        new cdk.CfnOutput(this, "APIEndpoint", {
            value: api.url,
            description: "Voice Civic Assistant API endpoint",
        });
        new cdk.CfnOutput(this, "SessionTableName", {
            value: sessionTable.tableName,
            description: "DynamoDB table for session management",
        });
        new cdk.CfnOutput(this, "TempStorageBucket", {
            value: tempStorageBucket.bucketName,
            description: "S3 bucket for temporary file storage",
        });
        new cdk.CfnOutput(this, "EncryptionKeyId", {
            value: encryptionKey.keyId,
            description: "KMS key ID for data encryption",
        });
    }
}
exports.VoiceCivicAssistantStack = VoiceCivicAssistantStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidm9pY2UtY2l2aWMtYXNzaXN0YW50LXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidm9pY2UtY2l2aWMtYXNzaXN0YW50LXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1RUFBeUQ7QUFDekQsbUVBQXFEO0FBQ3JELHlEQUEyQztBQUMzQyx5REFBMkM7QUFDM0MsK0RBQWlEO0FBQ2pELDJEQUE2QztBQUM3Qyx1REFBeUM7QUFHekMsTUFBYSx3QkFBeUIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUNyRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLCtFQUErRTtRQUMvRSx5QkFBeUI7UUFDekIsK0VBQStFO1FBRS9FLE1BQU0sYUFBYSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsd0JBQXdCLEVBQUU7WUFDaEUsV0FBVyxFQUFFLG1EQUFtRDtZQUNoRSxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxrQkFBa0I7U0FDN0QsQ0FBQyxDQUFDO1FBRUgsYUFBYSxDQUFDLFFBQVEsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1FBRXRELCtFQUErRTtRQUMvRSxrQ0FBa0M7UUFDbEMsK0VBQStFO1FBRS9FLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUNqRSxVQUFVLEVBQUUsOEJBQThCLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUN2RSxVQUFVLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLEdBQUc7WUFDbkMsYUFBYSxFQUFFLGFB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QUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDMUMsS0FBSyxFQUFFLFlBQVksQ0FBQyxTQUFTO1lBQzdCLFdBQVcsRUFBRSx1Q0FBdUM7U0FDckQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUMzQyxLQUFLLEVBQUUsaUJBQWlCLENBQUMsVUFBVTtZQUNuQyxXQUFXLEVBQUUsc0NBQXNDO1NBQ3BELENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDekMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxLQUFLO1lBQzFCLFdBQVcsRUFBRSxnQ0FBZ0M7U0FDOUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBaGFELDREQWdhQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tIFwiYXdzLWNkay1saWJcIjtcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSBcImF3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5XCI7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiXCI7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1pYW1cIjtcbmltcG9ydCAqIGFzIGttcyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWttc1wiO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtbGFtYmRhXCI7XG5pbXBvcnQgKiBhcyBsb2dzIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtbG9nc1wiO1xuaW1wb3J0ICogYXMgczMgZnJvbSBcImF3cy1jZGstbGliL2F3cy1zM1wiO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcblxuZXhwb3J0IGNsYXNzIFZvaWNlQ2l2aWNBc3Npc3RhbnRTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBLTVMgS2V5IGZvciBFbmNyeXB0aW9uXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgY29uc3QgZW5jcnlwdGlvbktleSA9IG5ldyBrbXMuS2V5KHRoaXMsIFwiVm9pY2VDaXZpY0Fzc2lzdGFudEtleVwiLCB7XG4gICAgICBkZXNjcmlwdGlvbjogXCJLTVMga2V5IGZvciBWb2ljZSBDaXZpYyBBc3Npc3RhbnQgZGF0YSBlbmNyeXB0aW9uXCIsXG4gICAgICBlbmFibGVLZXlSb3RhdGlvbjogdHJ1ZSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksIC8vIEZvciBkZXZlbG9wbWVudFxuICAgIH0pO1xuXG4gICAgZW5jcnlwdGlvbktleS5hZGRBbGlhcyhcImFsaWFzL3ZvaWNlLWNpdmljLWFzc2lzdGFudFwiKTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBTMyBCdWNrZXQgZm9yIFRlbXBvcmFyeSBTdG9yYWdlXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgY29uc3QgdGVtcFN0b3JhZ2VCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsIFwiVGVtcFN0b3JhZ2VCdWNrZXRcIiwge1xuICAgICAgYnVja2V0TmFtZTogYHZvaWNlLWNpdmljLWFzc2lzdGFudC10ZW1wLSR7dGhpcy5hY2NvdW50fS0ke3RoaXMucmVnaW9ufWAsXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLktNUyxcbiAgICAgIGVuY3J5cHRpb25LZXk6IGVuY3J5cHRpb25LZXksXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgdmVyc2lvbmVkOiBmYWxzZSxcbiAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogXCJEZWxldGVUZW1wRmlsZXNcIixcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIGV4cGlyYXRpb246IGNkay5EdXJhdGlvbi5ob3VycygyNCksIC8vIEF1dG8tZGVsZXRlIGFmdGVyIDI0IGhvdXJzXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gRm9yIGRldmVsb3BtZW50XG4gICAgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gRHluYW1vREIgVGFibGUgZm9yIFNlc3Npb24gTWFuYWdlbWVudFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIGNvbnN0IHNlc3Npb25UYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCBcIlNlc3Npb25UYWJsZVwiLCB7XG4gICAgICB0YWJsZU5hbWU6IFwidm9pY2UtY2l2aWMtYXNzaXN0YW50LXNlc3Npb25zXCIsXG4gICAgICBwYXJ0aXRpb25LZXk6IHtcbiAgICAgICAgbmFtZTogXCJzZXNzaW9uSWRcIixcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uLkNVU1RPTUVSX01BTkFHRUQsXG4gICAgICBlbmNyeXB0aW9uS2V5OiBlbmNyeXB0aW9uS2V5LFxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcbiAgICAgIHRpbWVUb0xpdmVBdHRyaWJ1dGU6IFwiZXhwaXJlc0F0XCIsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLCAvLyBGb3IgZGV2ZWxvcG1lbnRcbiAgICAgIHBvaW50SW5UaW1lUmVjb3Zlcnk6IHRydWUsXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgR1NJIGZvciB1c2VyLWJhc2VkIHF1ZXJpZXNcbiAgICBzZXNzaW9uVGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiBcIlVzZXJJZEluZGV4XCIsXG4gICAgICBwYXJ0aXRpb25LZXk6IHtcbiAgICAgICAgbmFtZTogXCJ1c2VySWRcIixcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgc29ydEtleToge1xuICAgICAgICBuYW1lOiBcImNyZWF0ZWRBdFwiLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gSUFNIFJvbGUgZm9yIExhbWJkYSBGdW5jdGlvbnNcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICBjb25zdCBsYW1iZGFSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsIFwiTGFtYmRhRXhlY3V0aW9uUm9sZVwiLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbChcImxhbWJkYS5hbWF6b25hd3MuY29tXCIpLFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZShcbiAgICAgICAgICBcInNlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGVcIixcbiAgICAgICAgKSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgcGVybWlzc2lvbnMgZm9yIEFXUyBzZXJ2aWNlc1xuICAgIGxhbWJkYVJvbGUuYWRkVG9Qb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgIC8vIEJlZHJvY2sgcGVybWlzc2lvbnNcbiAgICAgICAgICBcImJlZHJvY2s6SW52b2tlTW9kZWxcIixcbiAgICAgICAgICBcImJlZHJvY2s6SW52b2tlTW9kZWxXaXRoUmVzcG9uc2VTdHJlYW1cIixcbiAgICAgICAgICAvLyBUcmFuc2NyaWJlIHBlcm1pc3Npb25zXG4gICAgICAgICAgXCJ0cmFuc2NyaWJlOlN0YXJ0VHJhbnNjcmlwdGlvbkpvYlwiLFxuICAgICAgICAgIFwidHJhbnNjcmliZTpHZXRUcmFuc2NyaXB0aW9uSm9iXCIsXG4gICAgICAgICAgXCJ0cmFuc2NyaWJlOlN0YXJ0U3RyZWFtVHJhbnNjcmlwdGlvblwiLFxuICAgICAgICAgIC8vIFJla29nbml0aW9uIHBlcm1pc3Npb25zXG4gICAgICAgICAgXCJyZWtvZ25pdGlvbjpEZXRlY3RUZXh0XCIsXG4gICAgICAgICAgXCJyZWtvZ25pdGlvbjpBbmFseXplRG9jdW1lbnRcIixcbiAgICAgICAgICBcInJla29nbml0aW9uOkRldGVjdExhYmVsc1wiLFxuICAgICAgICAgIC8vIFMzIHBlcm1pc3Npb25zXG4gICAgICAgICAgXCJzMzpHZXRPYmplY3RcIixcbiAgICAgICAgICBcInMzOlB1dE9iamVjdFwiLFxuICAgICAgICAgIFwiczM6RGVsZXRlT2JqZWN0XCIsXG4gICAgICAgICAgLy8gRHluYW1vREIgcGVybWlzc2lvbnNcbiAgICAgICAgICBcImR5bmFtb2RiOkdldEl0ZW1cIixcbiAgICAgICAgICBcImR5bmFtb2RiOlB1dEl0ZW1cIixcbiAgICAgICAgICBcImR5bmFtb2RiOlVwZGF0ZUl0ZW1cIixcbiAgICAgICAgICBcImR5bmFtb2RiOkRlbGV0ZUl0ZW1cIixcbiAgICAgICAgICBcImR5bmFtb2RiOlF1ZXJ5XCIsXG4gICAgICAgICAgXCJkeW5hbW9kYjpTY2FuXCIsXG4gICAgICAgICAgLy8gS01TIHBlcm1pc3Npb25zXG4gICAgICAgICAgXCJrbXM6RGVjcnlwdFwiLFxuICAgICAgICAgIFwia21zOkVuY3J5cHRcIixcbiAgICAgICAgICBcImttczpHZW5lcmF0ZURhdGFLZXlcIixcbiAgICAgICAgXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbXCIqXCJdLCAvLyBSZXN0cmljdCBpbiBwcm9kdWN0aW9uXG4gICAgICB9KSxcbiAgICApO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIExhbWJkYSBGdW5jdGlvbnNcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvLyBNYWluIG9yY2hlc3RyYXRvciBmdW5jdGlvblxuICAgIGNvbnN0IG9yY2hlc3RyYXRvckZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbihcbiAgICAgIHRoaXMsXG4gICAgICBcIk9yY2hlc3RyYXRvckZ1bmN0aW9uXCIsXG4gICAgICB7XG4gICAgICAgIGZ1bmN0aW9uTmFtZTogXCJ2b2ljZS1jaXZpYy1hc3Npc3RhbnQtb3JjaGVzdHJhdG9yXCIsXG4gICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgICBoYW5kbGVyOiBcIm9yY2hlc3RyYXRvci5oYW5kbGVyXCIsXG4gICAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChcImRpc3QvbGFtYmRhXCIpLFxuICAgICAgICByb2xlOiBsYW1iZGFSb2xlLFxuICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICAgIG1lbW9yeVNpemU6IDEwMjQsXG4gICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgU0VTU0lPTl9UQUJMRV9OQU1FOiBzZXNzaW9uVGFibGUudGFibGVOYW1lLFxuICAgICAgICAgIFRFTVBfU1RPUkFHRV9CVUNLRVQ6IHRlbXBTdG9yYWdlQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICAgICAgS01TX0tFWV9JRDogZW5jcnlwdGlvbktleS5rZXlJZCxcbiAgICAgICAgICBCRURST0NLX01PREVMX0lEOiBcImFudGhyb3BpYy5jbGF1ZGUtMy1zb25uZXQtMjAyNDAyMjktdjE6MFwiLFxuICAgICAgICAgIExPR19MRVZFTDogXCJJTkZPXCIsXG4gICAgICAgIH0sXG4gICAgICAgIGxvZ1JldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgLy8gU3BlZWNoIHByb2Nlc3NvciBmdW5jdGlvblxuICAgIGNvbnN0IHNwZWVjaFByb2Nlc3NvckZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbihcbiAgICAgIHRoaXMsXG4gICAgICBcIlNwZWVjaFByb2Nlc3NvckZ1bmN0aW9uXCIsXG4gICAgICB7XG4gICAgICAgIGZ1bmN0aW9uTmFtZTogXCJ2b2ljZS1jaXZpYy1hc3Npc3RhbnQtc3BlZWNoLXByb2Nlc3NvclwiLFxuICAgICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcbiAgICAgICAgaGFuZGxlcjogXCJzcGVlY2gtcHJvY2Vzc29yLmhhbmRsZXJcIixcbiAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KFwiZGlzdC9sYW1iZGFcIiksXG4gICAgICAgIHJvbGU6IGxhbWJkYVJvbGUsXG4gICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgICAgbWVtb3J5U2l6ZTogNTEyLFxuICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgIFRFTVBfU1RPUkFHRV9CVUNLRVQ6IHRlbXBTdG9yYWdlQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICAgICAgS01TX0tFWV9JRDogZW5jcnlwdGlvbktleS5rZXlJZCxcbiAgICAgICAgICBMT0dfTEVWRUw6IFwiSU5GT1wiLFxuICAgICAgICB9LFxuICAgICAgICBsb2dSZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFSyxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIC8vIEludGVudCBjbGFzc2lmaWVyIGZ1bmN0aW9uXG4gICAgY29uc3QgaW50ZW50Q2xhc3NpZmllckZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbihcbiAgICAgIHRoaXMsXG4gICAgICBcIkludGVudENsYXNzaWZpZXJGdW5jdGlvblwiLFxuICAgICAge1xuICAgICAgICBmdW5jdGlvbk5hbWU6IFwidm9pY2UtY2l2aWMtYXNzaXN0YW50LWludGVudC1jbGFzc2lmaWVyXCIsXG4gICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgICBoYW5kbGVyOiBcImludGVudC1jbGFzc2lmaWVyLmhhbmRsZXJcIixcbiAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KFwiZGlzdC9sYW1iZGFcIiksXG4gICAgICAgIHJvbGU6IGxhbWJkYVJvbGUsXG4gICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDE1KSxcbiAgICAgICAgbWVtb3J5U2l6ZTogNTEyLFxuICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgIEJFRFJPQ0tfTU9ERUxfSUQ6IFwiYW50aHJvcGljLmNsYXVkZS0zLXNvbm5ldC0yMDI0MDIyOS12MTowXCIsXG4gICAgICAgICAgTE9HX0xFVkVMOiBcIklORk9cIixcbiAgICAgICAgfSxcbiAgICAgICAgbG9nUmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXG4gICAgICB9LFxuICAgICk7XG5cbiAgICAvLyBFbGlnaWJpbGl0eSBlbmdpbmUgZnVuY3Rpb25cbiAgICBjb25zdCBlbGlnaWJpbGl0eUVuZ2luZUZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbihcbiAgICAgIHRoaXMsXG4gICAgICBcIkVsaWdpYmlsaXR5RW5naW5lRnVuY3Rpb25cIixcbiAgICAgIHtcbiAgICAgICAgZnVuY3Rpb25OYW1lOiBcInZvaWNlLWNpdmljLWFzc2lzdGFudC1lbGlnaWJpbGl0eS1lbmdpbmVcIixcbiAgICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICAgIGhhbmRsZXI6IFwiZWxpZ2liaWxpdHktZW5naW5lLmhhbmRsZXJcIixcbiAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KFwiZGlzdC9sYW1iZGFcIiksXG4gICAgICAgIHJvbGU6IGxhbWJkYVJvbGUsXG4gICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgICAgbWVtb3J5U2l6ZTogMTAyNCxcbiAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICBCRURST0NLX01PREVMX0lEOiBcImFudGhyb3BpYy5jbGF1ZGUtMy1zb25uZXQtMjAyNDAyMjktdjE6MFwiLFxuICAgICAgICAgIExPR19MRVZFTDogXCJJTkZPXCIsXG4gICAgICAgIH0sXG4gICAgICAgIGxvZ1JldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgLy8gR3JpZXZhbmNlIGdlbmVyYXRvciBmdW5jdGlvblxuICAgIGNvbnN0IGdyaWV2YW5jZUdlbmVyYXRvckZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbihcbiAgICAgIHRoaXMsXG4gICAgICBcIkdyaWV2YW5jZUdlbmVyYXRvckZ1bmN0aW9uXCIsXG4gICAgICB7XG4gICAgICAgIGZ1bmN0aW9uTmFtZTogXCJ2b2ljZS1jaXZpYy1hc3Npc3RhbnQtZ3JpZXZhbmNlLWdlbmVyYXRvclwiLFxuICAgICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcbiAgICAgICAgaGFuZGxlcjogXCJncmlldmFuY2UtZ2VuZXJhdG9yLmhhbmRsZXJcIixcbiAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KFwiZGlzdC9sYW1iZGFcIiksXG4gICAgICAgIHJvbGU6IGxhbWJkYVJvbGUsXG4gICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgICAgbWVtb3J5U2l6ZTogMTAyNCxcbiAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICBCRURST0NLX01PREVMX0lEOiBcImFudGhyb3BpYy5jbGF1ZGUtMy1zb25uZXQtMjAyNDAyMjktdjE6MFwiLFxuICAgICAgICAgIExPR19MRVZFTDogXCJJTkZPXCIsXG4gICAgICAgIH0sXG4gICAgICAgIGxvZ1JldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgLy8gSW1hZ2UgYW5hbHl6ZXIgZnVuY3Rpb25cbiAgICBjb25zdCBpbWFnZUFuYWx5emVyRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKFxuICAgICAgdGhpcyxcbiAgICAgIFwiSW1hZ2VBbmFseXplckZ1bmN0aW9uXCIsXG4gICAgICB7XG4gICAgICAgIGZ1bmN0aW9uTmFtZTogXCJ2b2ljZS1jaXZpYy1hc3Npc3RhbnQtaW1hZ2UtYW5hbHl6ZXJcIixcbiAgICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICAgIGhhbmRsZXI6IFwiaW1hZ2UtYW5hbHl6ZXIuaGFuZGxlclwiLFxuICAgICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoXCJkaXN0L2xhbWJkYVwiKSxcbiAgICAgICAgcm9sZTogbGFtYmRhUm9sZSxcbiAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgICBtZW1vcnlTaXplOiAxMDI0LFxuICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgIFRFTVBfU1RPUkFHRV9CVUNLRVQ6IHRlbXBTdG9yYWdlQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICAgICAgQkVEUk9DS19NT0RFTF9JRDogXCJhbnRocm9waWMuY2xhdWRlLTMtc29ubmV0LTIwMjQwMjI5LXYxOjBcIixcbiAgICAgICAgICBMT0dfTEVWRUw6IFwiSU5GT1wiLFxuICAgICAgICB9LFxuICAgICAgICBsb2dSZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFSyxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIC8vIERvY3VtZW50IGdlbmVyYXRvciBmdW5jdGlvblxuICAgIGNvbnN0IGRvY3VtZW50R2VuZXJhdG9yRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKFxuICAgICAgdGhpcyxcbiAgICAgIFwiRG9jdW1lbnRHZW5lcmF0b3JGdW5jdGlvblwiLFxuICAgICAge1xuICAgICAgICBmdW5jdGlvbk5hbWU6IFwidm9pY2UtY2l2aWMtYXNzaXN0YW50LWRvY3VtZW50LWdlbmVyYXRvclwiLFxuICAgICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcbiAgICAgICAgaGFuZGxlcjogXCJkb2N1bWVudC1nZW5lcmF0b3IuaGFuZGxlclwiLFxuICAgICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoXCJkaXN0L2xhbWJkYVwiKSxcbiAgICAgICAgcm9sZTogbGFtYmRhUm9sZSxcbiAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgICBtZW1vcnlTaXplOiA1MTIsXG4gICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgVEVNUF9TVE9SQUdFX0JVQ0tFVDogdGVtcFN0b3JhZ2VCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgICAgICBMT0dfTEVWRUw6IFwiSU5GT1wiLFxuICAgICAgICB9LFxuICAgICAgICBsb2dSZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFSyxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIC8vIENvbmZpcm1hdGlvbiBoYW5kbGVyIGZ1bmN0aW9uXG4gICAgY29uc3QgY29uZmlybWF0aW9uSGFuZGxlckZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbihcbiAgICAgIHRoaXMsXG4gICAgICBcIkNvbmZpcm1hdGlvbkhhbmRsZXJGdW5jdGlvblwiLFxuICAgICAge1xuICAgICAgICBmdW5jdGlvbk5hbWU6IFwidm9pY2UtY2l2aWMtYXNzaXN0YW50LWNvbmZpcm1hdGlvbi1oYW5kbGVyXCIsXG4gICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgICBoYW5kbGVyOiBcImNvbmZpcm1hdGlvbi1oYW5kbGVyLmhhbmRsZXJcIixcbiAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KFwiZGlzdC9sYW1iZGFcIiksXG4gICAgICAgIHJvbGU6IGxhbWJkYVJvbGUsXG4gICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDE1KSxcbiAgICAgICAgbWVtb3J5U2l6ZTogNTEyLFxuICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgIFNFU1NJT05fVEFCTEVfTkFNRTogc2Vzc2lvblRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgICBMT0dfTEVWRUw6IFwiSU5GT1wiLFxuICAgICAgICB9LFxuICAgICAgICBsb2dSZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFSyxcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBBUEkgR2F0ZXdheVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIGNvbnN0IGFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgXCJWb2ljZUNpdmljQXNzaXN0YW50QVBJXCIsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiBcIlZvaWNlIENpdmljIEFzc2lzdGFudCBBUElcIixcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkFQSSBmb3IgVm9pY2UtRmlyc3QgQ2l2aWMgQXNzaXN0YW50XCIsXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhcGlnYXRld2F5LkNvcnMuQUxMX09SSUdJTlMsIC8vIFJlc3RyaWN0IGluIHByb2R1Y3Rpb25cbiAgICAgICAgYWxsb3dNZXRob2RzOiBhcGlnYXRld2F5LkNvcnMuQUxMX01FVEhPRFMsXG4gICAgICAgIGFsbG93SGVhZGVyczogW1xuICAgICAgICAgIFwiQ29udGVudC1UeXBlXCIsXG4gICAgICAgICAgXCJYLUFtei1EYXRlXCIsXG4gICAgICAgICAgXCJBdXRob3JpemF0aW9uXCIsXG4gICAgICAgICAgXCJYLUFwaS1LZXlcIixcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICBkZXBsb3lPcHRpb25zOiB7XG4gICAgICAgIHN0YWdlTmFtZTogXCJ2MVwiLFxuICAgICAgICBsb2dnaW5nTGV2ZWw6IGFwaWdhdGV3YXkuTWV0aG9kTG9nZ2luZ0xldmVsLklORk8sXG4gICAgICAgIGRhdGFUcmFjZUVuYWJsZWQ6IHRydWUsXG4gICAgICAgIG1ldHJpY3NFbmFibGVkOiB0cnVlLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIE1haW4gb3JjaGVzdHJhdG9yIGVuZHBvaW50XG4gICAgY29uc3Qgb3JjaGVzdHJhdG9ySW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihcbiAgICAgIG9yY2hlc3RyYXRvckZ1bmN0aW9uLFxuICAgICk7XG4gICAgYXBpLnJvb3QuYWRkUmVzb3VyY2UoXCJwcm9jZXNzXCIpLmFkZE1ldGhvZChcIlBPU1RcIiwgb3JjaGVzdHJhdG9ySW50ZWdyYXRpb24pO1xuXG4gICAgLy8gU3BlZWNoIHByb2Nlc3NpbmcgZW5kcG9pbnRcbiAgICBjb25zdCBzcGVlY2hJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKFxuICAgICAgc3BlZWNoUHJvY2Vzc29yRnVuY3Rpb24sXG4gICAgKTtcbiAgICBhcGkucm9vdC5hZGRSZXNvdXJjZShcInNwZWVjaFwiKS5hZGRNZXRob2QoXCJQT1NUXCIsIHNwZWVjaEludGVncmF0aW9uKTtcblxuICAgIC8vIEludGVudCBjbGFzc2lmaWNhdGlvbiBlbmRwb2ludFxuICAgIGNvbnN0IGludGVudEludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oXG4gICAgICBpbnRlbnRDbGFzc2lmaWVyRnVuY3Rpb24sXG4gICAgKTtcbiAgICBhcGkucm9vdC5hZGRSZXNvdXJjZShcImludGVudFwiKS5hZGRNZXRob2QoXCJQT1NUXCIsIGludGVudEludGVncmF0aW9uKTtcblxuICAgIC8vIEVsaWdpYmlsaXR5IGFzc2Vzc21lbnQgZW5kcG9pbnRcbiAgICBjb25zdCBlbGlnaWJpbGl0eUludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oXG4gICAgICBlbGlnaWJpbGl0eUVuZ2luZUZ1bmN0aW9uLFxuICAgICk7XG4gICAgYXBpLnJvb3RcbiAgICAgIC5hZGRSZXNvdXJjZShcImVsaWdpYmlsaXR5XCIpXG4gICAgICAuYWRkTWV0aG9kKFwiUE9TVFwiLCBlbGlnaWJpbGl0eUludGVncmF0aW9uKTtcblxuICAgIC8vIEdyaWV2YW5jZSBnZW5lcmF0aW9uIGVuZHBvaW50XG4gICAgY29uc3QgZ3JpZXZhbmNlSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihcbiAgICAgIGdyaWV2YW5jZUdlbmVyYXRvckZ1bmN0aW9uLFxuICAgICk7XG4gICAgYXBpLnJvb3QuYWRkUmVzb3VyY2UoXCJncmlldmFuY2VcIikuYWRkTWV0aG9kKFwiUE9TVFwiLCBncmlldmFuY2VJbnRlZ3JhdGlvbik7XG5cbiAgICAvLyBJbWFnZSBhbmFseXNpcyBlbmRwb2ludFxuICAgIGNvbnN0IGltYWdlSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihcbiAgICAgIGltYWdlQW5hbHl6ZXJGdW5jdGlvbixcbiAgICApO1xuICAgIGFwaS5yb290LmFkZFJlc291cmNlKFwiaW1hZ2VcIikuYWRkTWV0aG9kKFwiUE9TVFwiLCBpbWFnZUludGVncmF0aW9uKTtcblxuICAgIC8vIERvY3VtZW50IGdlbmVyYXRpb24gZW5kcG9pbnRcbiAgICBjb25zdCBkb2N1bWVudEludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oXG4gICAgICBkb2N1bWVudEdlbmVyYXRvckZ1bmN0aW9uLFxuICAgICk7XG4gICAgYXBpLnJvb3QuYWRkUmVzb3VyY2UoXCJkb2N1bWVudFwiKS5hZGRNZXRob2QoXCJQT1NUXCIsIGRvY3VtZW50SW50ZWdyYXRpb24pO1xuXG4gICAgLy8gQ29uZmlybWF0aW9uIGhhbmRsaW5nIGVuZHBvaW50XG4gICAgY29uc3QgY29uZmlybWF0aW9uSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihcbiAgICAgIGNvbmZpcm1hdGlvbkhhbmRsZXJGdW5jdGlvbixcbiAgICApO1xuICAgIGFwaS5yb290LmFkZFJlc291cmNlKFwiY29uZmlybVwiKS5hZGRNZXRob2QoXCJQT1NUXCIsIGNvbmZpcm1hdGlvbkludGVncmF0aW9uKTtcblxuICAgIC8vIEhlYWx0aCBjaGVjayBlbmRwb2ludFxuICAgIGFwaS5yb290LmFkZFJlc291cmNlKFwiaGVhbHRoXCIpLmFkZE1ldGhvZChcbiAgICAgIFwiR0VUXCIsXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5Nb2NrSW50ZWdyYXRpb24oe1xuICAgICAgICBpbnRlZ3JhdGlvblJlc3BvbnNlczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0YXR1c0NvZGU6IFwiMjAwXCIsXG4gICAgICAgICAgICByZXNwb25zZVRlbXBsYXRlczoge1xuICAgICAgICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIHN0YXR1czogXCJoZWFsdGh5XCIsXG4gICAgICAgICAgICAgICAgdGltZXN0YW1wOiBcIiRjb250ZXh0LnJlcXVlc3RUaW1lXCIsXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogXCIxLjAuMFwiLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgcmVxdWVzdFRlbXBsYXRlczoge1xuICAgICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiAne1wic3RhdHVzQ29kZVwiOiAyMDB9JyxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICAge1xuICAgICAgICBtZXRob2RSZXNwb25zZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdGF0dXNDb2RlOiBcIjIwMFwiLFxuICAgICAgICAgICAgcmVzcG9uc2VNb2RlbHM6IHtcbiAgICAgICAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IGFwaWdhdGV3YXkuTW9kZWwuRU1QVFlfTU9ERUwsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gT3V0cHV0c1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiQVBJRW5kcG9pbnRcIiwge1xuICAgICAgdmFsdWU6IGFwaS51cmwsXG4gICAgICBkZXNjcmlwdGlvbjogXCJWb2ljZSBDaXZpYyBBc3Npc3RhbnQgQVBJIGVuZHBvaW50XCIsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIlNlc3Npb25UYWJsZU5hbWVcIiwge1xuICAgICAgdmFsdWU6IHNlc3Npb25UYWJsZS50YWJsZU5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogXCJEeW5hbW9EQiB0YWJsZSBmb3Igc2Vzc2lvbiBtYW5hZ2VtZW50XCIsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIlRlbXBTdG9yYWdlQnVja2V0XCIsIHtcbiAgICAgIHZhbHVlOiB0ZW1wU3RvcmFnZUJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgZGVzY3JpcHRpb246IFwiUzMgYnVja2V0IGZvciB0ZW1wb3JhcnkgZmlsZSBzdG9yYWdlXCIsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIkVuY3J5cHRpb25LZXlJZFwiLCB7XG4gICAgICB2YWx1ZTogZW5jcnlwdGlvbktleS5rZXlJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiBcIktNUyBrZXkgSUQgZm9yIGRhdGEgZW5jcnlwdGlvblwiLFxuICAgIH0pO1xuICB9XG59XG4iXX0=