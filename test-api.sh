#!/bin/bash

# Voice-First Civic Assistant - API Test Script

echo "🧪 Testing Voice-First Civic Assistant API"
echo "=========================================="

BASE_URL="http://localhost:3001/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    echo "Endpoint: $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✅ Success (HTTP $http_code)${NC}"
        echo "Response: $(echo "$body" | jq -r '.response // .status // "Success"' 2>/dev/null || echo "$body" | head -c 100)..."
    else
        echo -e "${RED}❌ Failed (HTTP $http_code)${NC}"
        echo "Response: $body"
    fi
}

# Check if backend is running
echo "🔍 Checking if backend is running..."
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${RED}❌ Backend server is not running on port 3001${NC}"
    echo "Please start the backend server first:"
    echo "  cd local-backend && npm start"
    exit 1
fi

echo -e "${GREEN}✅ Backend server is running${NC}"

# Test endpoints
test_endpoint "GET" "/health" "" "Health Check"

test_endpoint "POST" "/text/process" '{"text": "I want to check PM-JAY eligibility", "language": "en"}' "English Eligibility Query"

test_endpoint "POST" "/text/process" '{"text": "मुझे PM-JAY योजना की पात्रता जांचनी है", "language": "hi"}' "Hindi Eligibility Query"

test_endpoint "POST" "/text/process" '{"text": "Hospital overcharged me, I want to file a complaint", "language": "en"}' "English Grievance Query"

test_endpoint "POST" "/text/process" '{"text": "अस्पताल ने ज्यादा पैसे लिए हैं, शिकायत करनी है", "language": "hi"}' "Hindi Grievance Query"

test_endpoint "GET" "/documents" "" "Get All Documents"

echo -e "\n${GREEN}🎉 API testing completed!${NC}"
echo "=========================================="
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:3001"
echo "📋 API Docs: Check local-backend/README.md"