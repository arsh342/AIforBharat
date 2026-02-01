# Voice-First Civic Assistant - Frontend

A React-based web application that provides a user-friendly interface for the Voice-First Civic Assistant system. This frontend allows users to interact with the AI-powered civic assistance system through voice input, text chat, and document management.

## Features

### 🎤 Voice Recording

- Real-time voice recording with browser microphone
- Support for Hindi and English languages
- Audio quality validation and feedback
- File upload support for pre-recorded audio

### 💬 Text Chat Interface

- Interactive chat with the AI assistant
- Sample questions to get started quickly
- Conversation history management
- Typing indicators and real-time responses

### 📄 Document Management

- View generated PM-JAY applications and health grievances
- Document status tracking (Draft, Confirmed, Submitted)
- Download documents in JSON format
- Document confirmation workflow

### 🌐 Multilingual Support

- Full Hindi and English language support
- Dynamic UI language switching
- Culturally appropriate content and terminology

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Modern web browser with microphone support
- (Optional) Backend API server running

### Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Configure environment:**

```bash
# Copy and edit environment variables
cp .env.example .env
```

3. **Start development server:**

```bash
npm start
```

The app will open at `http://localhost:3000`

### Environment Variables

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:3001/api  # Backend API URL
REACT_APP_MOCK_MODE=true                     # Enable mock responses for development

# Feature Flags
REACT_APP_ENABLE_VOICE_RECORDING=true        # Enable voice recording
REACT_APP_ENABLE_IMAGE_UPLOAD=true           # Enable image upload
REACT_APP_ENABLE_DOCUMENT_DOWNLOAD=true      # Enable document downloads
```

## Usage

### Voice Assistant Tab

1. **Select Language:** Choose Hindi or English from the language selector
2. **Record Voice:** Click the microphone button to start recording
3. **Speak Naturally:** Describe your needs in your preferred language
4. **Get Response:** The AI will process your input and provide assistance

### Chat Interface Tab

1. **Type Messages:** Use the text input to communicate with the assistant
2. **Sample Questions:** Click on suggested questions to get started
3. **View History:** Scroll through your conversation history
4. **Play Audio:** Listen to voice messages in the chat

### Documents Tab

1. **View Documents:** See all generated applications and grievances
2. **Review Content:** Click "View" to see detailed document content
3. **Confirm Drafts:** Approve draft documents to mark them as confirmed
4. **Download:** Save documents to your device

## Mock Mode

The application includes a comprehensive mock mode for development and testing:

- **Realistic Responses:** Context-aware responses based on user input
- **Document Generation:** Sample PM-JAY applications and grievance documents
- **Language Support:** Full Hindi and English mock responses
- **Processing Delays:** Simulated API response times for realistic UX

## API Integration

When `REACT_APP_MOCK_MODE=false`, the app connects to your backend API:

### Expected API Endpoints

```
POST /api/voice/process     # Process voice input
POST /api/text/process      # Process text input
POST /api/image/process     # Process image uploads
GET  /api/health           # Health check
```

### API Request/Response Format

**Voice Processing:**

```typescript
// Request (FormData)
audio: Blob           // Audio file
language: 'hi' | 'en' // Language preference

// Response
{
  response: string;
  intent?: 'eligibility' | 'grievance' | 'inquiry';
  confidence?: number;
  document?: Document;
  followUpQuestions?: string[];
}
```

## Browser Compatibility

### Supported Browsers

- Chrome 60+ (recommended)
- Firefox 55+
- Safari 11+
- Edge 79+

### Required Permissions

- **Microphone Access:** For voice recording functionality
- **File System Access:** For document downloads

## Development

### Available Scripts

```bash
npm start          # Start development server
npm test           # Run test suite
npm run build      # Build for production
npm run eject      # Eject from Create React App
```

### Project Structure

```
src/
├── components/           # React components
│   ├── VoiceRecorder.tsx    # Voice recording interface
│   ├── ChatInterface.tsx    # Text chat interface
│   ├── DocumentViewer.tsx   # Document management
│   └── LanguageSelector.tsx # Language switching
├── services/
│   └── api.ts           # API client and mock responses
├── App.tsx              # Main application component
├── App.css              # Global styles
└── index.tsx            # Application entry point
```

### Key Technologies

- **React 18** with TypeScript
- **Axios** for API communication
- **Lucide React** for icons
- **Web Audio API** for voice recording
- **CSS3** with modern features

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Static Hosting

The built files in the `build/` directory can be deployed to:

- Netlify
- Vercel
- AWS S3 + CloudFront
- GitHub Pages
- Any static hosting service

### Environment Configuration

For production deployment, update environment variables:

```bash
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_MOCK_MODE=false
```

## Troubleshooting

### Common Issues

**Microphone not working:**

- Ensure browser permissions are granted
- Check if HTTPS is enabled (required for microphone access)
- Verify microphone is not being used by other applications

**API connection errors:**

- Verify backend server is running
- Check CORS configuration on backend
- Confirm API URL in environment variables

**Build errors:**

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
- Verify all dependencies are properly installed

### Performance Optimization

- Enable gzip compression on your server
- Use CDN for static assets
- Implement service worker for offline functionality
- Optimize images and audio files

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with descriptive messages
5. Push to your fork and submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- Check the troubleshooting section above
- Review the backend API documentation
- Open an issue in the repository
- Contact the development team

---

Built with ❤️ for accessible civic services in India
