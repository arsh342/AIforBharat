# Voice Civic Assistant - Local Backend

A local development server that mimics the AWS Lambda functions for the Voice-First Civic Assistant system. This Express.js server provides all the necessary API endpoints for local development and testing.

## Features

### 🎤 Voice Processing

- Audio file upload and processing
- Mock speech-to-text transcription
- Language detection (Hindi/English)
- Intent classification

### 💬 Text Processing

- Natural language understanding
- Context-aware responses
- Conversation history management
- Multi-language support

### 🖼️ Image Processing

- Document image upload
- Mock OCR text extraction
- Bill and receipt analysis
- Document type classification

### 📄 Document Management

- PM-JAY application generation
- Health grievance creation
- Document status tracking
- JSON export functionality

## API Endpoints

### Health Check

```
GET /api/health
```

Returns server status and basic information.

### Voice Processing

```
POST /api/voice/process
Content-Type: multipart/form-data

Body:
- audio: Audio file (WebM, MP3, WAV)
- language: 'hi' | 'en'
```

### Text Processing

```
POST /api/text/process
Content-Type: application/json

Body:
{
  "text": "User input text",
  "language": "hi" | "en",
  "sessionId": "optional-session-id"
}
```

### Image Processing

```
POST /api/image/process
Content-Type: multipart/form-data

Body:
- image: Image file (JPEG, PNG, PDF)
- language: 'hi' | 'en'
```

### Session Management

```
GET /api/session/:sessionId
```

### Document Management

```
GET /api/documents
GET /api/documents/:documentId
PATCH /api/documents/:documentId
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- (Optional) Postman for API testing

### Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Start the server:**

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start at `http://localhost:3001`

### Environment Variables

Create a `.env` file with:

```bash
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
MAX_FILE_SIZE=10485760
```

## Mock Responses

The server provides intelligent mock responses based on user input:

### Eligibility Queries

Input containing keywords like "eligible", "pmjay", "scheme", "पात्र", "योजना" will trigger eligibility assessment responses.

### Grievance Queries

Input containing "complaint", "grievance", "hospital", "शिकायत", "समस्या" will generate grievance documents.

### General Inquiries

Other inputs receive general assistance information.

## Response Format

All API responses follow this structure:

```json
{
  "response": "AI assistant response text",
  "intent": "eligibility" | "grievance" | "inquiry",
  "confidence": 0.95,
  "sessionId": "uuid",
  "document": {
    "type": "pmjay_application" | "health_grievance",
    "title": "Document title",
    "content": { ... },
    "status": "draft"
  },
  "followUpQuestions": ["question1", "question2"]
}
```

## Development Features

### In-Memory Storage

- Sessions stored in memory (Map)
- Documents stored in memory (Map)
- Data persists during server runtime
- Resets on server restart

### Logging

- Request/response logging
- Error tracking
- Processing time monitoring

### CORS Support

- Configured for frontend development
- Supports localhost:3000
- Credentials enabled

## Testing

### Manual Testing

Use the React frontend at `http://localhost:3000` to test all functionality.

### API Testing with curl

**Health Check:**

```bash
curl http://localhost:3001/api/health
```

**Text Processing:**

```bash
curl -X POST http://localhost:3001/api/text/process \
  -H "Content-Type: application/json" \
  -d '{"text": "I want to check PM-JAY eligibility", "language": "en"}'
```

**Voice Processing:**

```bash
curl -X POST http://localhost:3001/api/voice/process \
  -F "audio=@recording.webm" \
  -F "language=en"
```

## Production Deployment

This local server is for development only. For production:

1. **Use the AWS serverless architecture** from the main project
2. **Deploy Lambda functions** with the same API structure
3. **Configure API Gateway** for HTTP endpoints
4. **Set up proper databases** (DynamoDB, S3)

## Troubleshooting

### Common Issues

**Port already in use:**

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

**CORS errors:**

- Verify frontend is running on localhost:3000
- Check ALLOWED_ORIGINS in .env file

**File upload errors:**

- Check file size limits (10MB default)
- Verify file types are supported
- Ensure proper Content-Type headers

### Logs

Server logs include:

- Request processing times
- File upload details
- Error stack traces
- Session management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test locally
4. Ensure all endpoints work with frontend
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

🚀 Ready for local development with the Voice-First Civic Assistant!
