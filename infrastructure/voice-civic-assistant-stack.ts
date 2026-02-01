import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as kms from "aws-cdk-lib/aws-kms";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class VoiceCivicAssistantStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole",
        ),
      ],
    });

    // Add permissions for AWS services
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
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
      }),
    );

    // ============================================================================
    // Lambda Functions
    // ============================================================================

    // Main orchestrator function
    const orchestratorFunction = new lambda.Function(
      this,
      "OrchestratorFunction",
      {
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
      },
    );

    // Speech processor function
    const speechProcessorFunction = new lambda.Function(
      this,
      "SpeechProcessorFunction",
      {
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
      },
    );

    // Intent classifier function
    const intentClassifierFunction = new lambda.Function(
      this,
      "IntentClassifierFunction",
      {
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
      },
    );

    // Eligibility engine function
    const eligibilityEngineFunction = new lambda.Function(
      this,
      "EligibilityEngineFunction",
      {
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
      },
    );

    // Grievance generator function
    const grievanceGeneratorFunction = new lambda.Function(
      this,
      "GrievanceGeneratorFunction",
      {
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
      },
    );

    // Image analyzer function
    const imageAnalyzerFunction = new lambda.Function(
      this,
      "ImageAnalyzerFunction",
      {
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
      },
    );

    // Document generator function
    const documentGeneratorFunction = new lambda.Function(
      this,
      "DocumentGeneratorFunction",
      {
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
      },
    );

    // Confirmation handler function
    const confirmationHandlerFunction = new lambda.Function(
      this,
      "ConfirmationHandlerFunction",
      {
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
      },
    );

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
    const orchestratorIntegration = new apigateway.LambdaIntegration(
      orchestratorFunction,
    );
    api.root.addResource("process").addMethod("POST", orchestratorIntegration);

    // Speech processing endpoint
    const speechIntegration = new apigateway.LambdaIntegration(
      speechProcessorFunction,
    );
    api.root.addResource("speech").addMethod("POST", speechIntegration);

    // Intent classification endpoint
    const intentIntegration = new apigateway.LambdaIntegration(
      intentClassifierFunction,
    );
    api.root.addResource("intent").addMethod("POST", intentIntegration);

    // Eligibility assessment endpoint
    const eligibilityIntegration = new apigateway.LambdaIntegration(
      eligibilityEngineFunction,
    );
    api.root
      .addResource("eligibility")
      .addMethod("POST", eligibilityIntegration);

    // Grievance generation endpoint
    const grievanceIntegration = new apigateway.LambdaIntegration(
      grievanceGeneratorFunction,
    );
    api.root.addResource("grievance").addMethod("POST", grievanceIntegration);

    // Image analysis endpoint
    const imageIntegration = new apigateway.LambdaIntegration(
      imageAnalyzerFunction,
    );
    api.root.addResource("image").addMethod("POST", imageIntegration);

    // Document generation endpoint
    const documentIntegration = new apigateway.LambdaIntegration(
      documentGeneratorFunction,
    );
    api.root.addResource("document").addMethod("POST", documentIntegration);

    // Confirmation handling endpoint
    const confirmationIntegration = new apigateway.LambdaIntegration(
      confirmationHandlerFunction,
    );
    api.root.addResource("confirm").addMethod("POST", confirmationIntegration);

    // Health check endpoint
    api.root.addResource("health").addMethod(
      "GET",
      new apigateway.MockIntegration({
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
      }),
      {
        methodResponses: [
          {
            statusCode: "200",
            responseModels: {
              "application/json": apigateway.Model.EMPTY_MODEL,
            },
          },
        ],
      },
    );

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
