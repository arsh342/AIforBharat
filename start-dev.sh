#!/bin/bash

# Voice-First Civic Assistant - Development Startup Script

echo "🚀 Starting Voice-First Civic Assistant Development Environment"
echo "=================================================="

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Check if required ports are available
echo "🔍 Checking port availability..."

if ! check_port 3001; then
    echo "❌ Backend port 3001 is in use. Please stop the process or use a different port."
    exit 1
fi

if ! check_port 3000; then
    echo "⚠️  Frontend port 3000 is in use. React will try to use the next available port."
fi

# Start backend server
echo "🔧 Starting backend server on port 3001..."
cd local-backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 3

# Check if backend is running
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend server is running successfully"
else
    echo "❌ Backend server failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend server
echo "🎨 Starting frontend server on port 3000..."
cd voice-civic-frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 Development environment started successfully!"
echo "=================================================="
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:3001"
echo "🏥 Health:   http://localhost:3001/api/health"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "=================================================="

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development environment..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait