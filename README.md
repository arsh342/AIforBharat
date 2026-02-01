# Voice-First Civic Assistant

A serverless, AI-powered system that enables citizens to interact with government health schemes and grievance systems using natural voice input in their local language. Built on AWS with comprehensive property-based testing for universal correctness guarantees.

## 🎯 Overview

The Voice-First Civic Assistant addresses accessibility barriers faced by low-literacy and regional-language users when accessing:

- **Ayushman Bharat (PM-JAY)** eligibility checks
- **Health-related grievance filing**
- **Government service navigation**

### Key Features

- 🗣️ **Natural Voice Interaction** - Speak in Hindi or English
- 🤖 **AI-Powered Understanding** - Intent classification and context management
- 📋 **Automated Document Generation** - PM-JAY applications and grievance forms
- 📸 **Image Analysis** - Extract information from bills and documents
- ✅ **Human-in-the-Loop** - Review and confirm all generated documents
- 🔒 **Privacy-First** - Automatic data cleanup after 24 hours
- 🌐 **Multilingual** - Consistent experience across languages

## 🏗️ Architecture

The system uses a serverless microservices architecture built on AWS:

- **API Gateway**: REST and WebSocket endpoints
- **Lambda Functions**: Serverless compute for each component
- **Amazon Bedrock**: AI reasoning with Claude/Titan models
- **Amazon Transcribe**: Speech-to-text with regional accent support
- **Amazon Rekognition**: Document image analysis and OCR
- **DynamoDB**: Session state management with TTL
- **S3**: Temporary file storage with lifecycle policies
- **KMS**: End-to-end data encryption

## 🧩 Components

### Core Services

1. **Speech Processor** - Converts voice input to text using Amazon Transcribe
2. **Intent Classifier** - Determines user intent using Amazon Bedrock
3. **Eligibility Engine** - Evaluates PM-JAY eligibility based on household criteria
4. **Grievance Generator** - Converts complaints into formal grievance documents
5. **Image Analyzer** - Extracts information from uploaded documents
6. **Document Generator** - Creates structured application drafts and forms
7. **Confirmation Handler** - Manages human-in-the-loop confirmation workflow

### Supported Capabilities

- **Languages**: Hindi (hi), English (en) with regional accent support
- **Intents**: PM-JAY eligibility checking, health grievance filing, general inquiries
- **Document Types**: Medical bills, prescriptions, identity documents, hospital receipts
- **Output Formats**: PDF, HTML, JSON, plain text

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+ (for property-based testing)
- AWS CLI configured
- AWS CDK CLI installed
- TypeScript knowledge

### Installation

1. **Clone and setup**:

```bash
git clone <repository-url>
cd voice-civic-assistant
npm install
```

2. **Install Python dependencies** (for property-based testing):

```bash
npm run setup:python
# or manually: pip3 install -r requirements.txt
```

3. **Build and deploy**:

```bash
npm run build
npm run deploy
```

### Environment Configuration

Create a `.env` file or set environment variables:

```bash
# Required
AWS_REGION=us-east-1
SESSION_TABLE_NAME=voice-civic-assistant-sessions
TEMP_STORAGE_BUCKET=voice-civic-assistant-temp-{account}-{region}
KMS_KEY_ID=alias/voice-civic-assistant
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0

# Optional
LOG_LEVEL=INFO
ALLOWED_ORIGINS=*
HYPOTHESIS_PROFILE=default
```

## 🧪 Testing Strategy

The project uses a **dual testing approach** for comprehensive validation:

### Unit Tests (TypeScript + Jest)

```bash
npm test                    # Run all unit tests
npm run test:watch         # Watch mode for development
npm run test:coverage      # Generate coverage report
```

### Property-Based Tests (Python + Hypothesis)

```bash
npm run test:property      # Run property-based tests
npm run test:all          # Run both unit and property tests
```

### Test Configuration

- **Unit Tests**: Specific examples, edge cases, integration points
- **Property Tests**: Universal correctness properties across all inputs
- **Iterations**: 100 examples (default), 1000 in CI
- **Timeout**: 30s for property tests, 5s for unit tests
- **Coverage**: Comprehensive component and integration coverage

## 📋 Correctness Properties

The system validates **21 universal correctness properties**:

### Speech Processing (Properties 1-3)

- **Property 1**: Accuracy for Hindi/English with regional accents
- **Property 2**: Performance within 5-second time limits
- **Property 3**: Error handling with clear recovery options

### Intent Classification (Properties 4-5)

- **Property 4**: 90%+ accuracy for clear user statements
- **Property 5**: Ambiguity handling with clarification questions

### Eligibility Assessment (Properties 6-7, 20)

- **Property 6**: Correct PM-JAY evaluation for complex households
- **Property 7**: Information gathering for incomplete data
- **Property 20**: Explainable decisions with step-by-step reasoning

### Document Generation (Properties 8-9, 16)

- **Property 8**: Complete document generation with required fields
- **Property 9**: Format compliance with official requirements
- **Property 16**: Secure finalization workflow

### And 12 more properties covering grievance processing, image analysis, multilingual support, security, and performance.

## 🌐 API Endpoints

### Main Orchestrator

- `POST /v1/process` - Main processing endpoint with full workflow

### Individual Services

- `POST /v1/speech` - Speech processing and transcription
- `POST /v1/intent` - Intent classification and entity extraction
- `POST /v1/eligibility` - PM-JAY eligibility assessment
- `POST /v1/grievance` - Grievance document generation
- `POST /v1/image` - Image analysis and OCR
- `POST /v1/document` - Document generation and formatting
- `POST /v1/confirm` - Human-in-the-loop confirmation

### System

- `GET /v1/health` - System health and status check

## 🔧 Development

### Project Structure

```
├── src/
│   ├── config/          # AWS configuration and service clients
│   ├── interfaces/      # TypeScript interfaces for all components
│   ├── lambda/          # Lambda function implementations
│   ├── types/           # Core type definitions and enums
│   └── utils/           # Utilities (validation, error handling, session management)
├── infrastructure/      # AWS CDK infrastructure as code
├── test/
│   ├── unit/           # TypeScript unit tests with Jest
│   ├── property/       # Python property-based tests with Hypothesis
│   └── setup.ts        # Test configuration, mocks, and generators
├── requirements.txt    # Python dependencies for property testing
└── package.json       # Node.js dependencies and scripts
```

### Development Workflow

1. **Add new features**:
   - Define interfaces in `src/interfaces/`
   - Implement in `src/lambda/`
   - Add types in `src/types/`
   - Update infrastructure in `infrastructure/`

2. **Write comprehensive tests**:
   - Unit tests in `test/unit/` for specific examples
   - Property tests in `test/property/` for universal properties
   - Integration tests for component interactions

3. **Quality assurance**:

```bash
npm run lint              # Code linting
npm run lint:fix          # Auto-fix linting issues
npm run build            # Type checking and compilation
npm run test:all         # Full test suite
```

## 🔒 Security & Privacy

### Data Protection

- **Encryption**: All data encrypted in transit and at rest using AWS KMS
- **Key Rotation**: Automatic KMS key rotation enabled
- **Access Control**: IAM-based permissions with least privilege principle
- **Network Security**: VPC isolation and security groups

### Privacy Compliance

- **Data Retention**: Automatic deletion after 24 hours via DynamoDB TTL
- **User Control**: Immediate data deletion on user request
- **Minimal Collection**: Only necessary data collected and processed
- **No Permanent Storage**: Personal information never stored permanently

### Security Testing

- **Property-Based Security Tests**: Validate encryption and access controls
- **Input Validation**: Comprehensive validation with Zod schemas
- **Error Handling**: Secure error messages without information leakage

## 📊 Performance & Monitoring

### Performance Requirements

- **Voice Processing**: < 5 seconds for simple queries
- **Document Generation**: < 30 seconds for complex documents
- **Concurrent Users**: 100+ simultaneous sessions
- **Availability**: 99.5% uptime during business hours

### Monitoring & Observability

- **CloudWatch Logs**: Structured logging with correlation IDs
- **Metrics**: Custom metrics for performance and business KPIs
- **Alarms**: Automated alerting for system issues
- **Tracing**: Request tracing across all microservices
- **Dashboards**: Real-time system health visualization

## 🤝 Contributing

### Development Guidelines

1. **Follow TypeScript best practices** and maintain type safety
2. **Write property-based tests** for all new features
3. **Include unit tests** for specific examples and edge cases
4. **Update documentation** for API changes
5. **Ensure security compliance** with data handling requirements

### Testing Requirements

- All new features must include both unit and property tests
- Property tests should validate universal correctness properties
- Integration tests for component interactions
- Performance tests for time-critical operations
- Security tests for data handling and access control

### Code Review Process

1. Ensure all tests pass: `npm run test:all`
2. Verify code quality: `npm run lint`
3. Check type safety: `npm run build`
4. Review property test coverage
5. Validate security implications

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support & Troubleshooting

### Getting Help

1. **Check the test suite** for expected behavior examples
2. **Review CloudWatch logs** for detailed error information
3. **Consult property test results** for correctness validation
4. **Check the API documentation** for endpoint specifications

### Common Issues

- **Audio Quality**: Use WAV/MP3 format, ensure good microphone quality
- **Language Detection**: Speak clearly in Hindi or English
- **Session Timeout**: Sessions expire after 24 hours automatically
- **Document Generation**: Ensure all required fields are provided

### Reporting Issues

When reporting issues, please include:

- Steps to reproduce the problem
- Expected vs actual behavior
- Relevant log entries from CloudWatch
- Audio/image samples (if applicable)
- Session ID for debugging

---

**Built with ❤️ for accessible government services in India**
