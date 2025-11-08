#!/bin/bash

# API Testing Script for Client Onboarding App
# Make sure the dev server is running before executing this script

BASE_URL="http://localhost:3000"

echo "🧪 Testing Client Onboarding API"
echo "================================"
echo ""

# Test 1: Get all clients (should be empty initially or show existing)
echo "1️⃣  Testing GET /api/clients"
echo "----------------------------"
curl -s -X GET "$BASE_URL/api/clients" | jq '.' || echo "Response received (jq not installed, showing raw)"
echo ""
echo ""

# Test 2: Add a new client
echo "2️⃣  Testing POST /api/clients (Add new client)"
echo "-----------------------------------------------"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/clients" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test.user@example.com",
    "business_name": "Test Business Inc"
  }')

echo "$RESPONSE" | jq '.' || echo "$RESPONSE"
echo ""
echo ""

# Test 3: Get all clients again (should include the new one)
echo "3️⃣  Testing GET /api/clients (After adding client)"
echo "---------------------------------------------------"
curl -s -X GET "$BASE_URL/api/clients" | jq '.' || echo "Response received"
echo ""
echo ""

# Test 4: Try to add duplicate email (should fail)
echo "4️⃣  Testing POST /api/clients (Duplicate email - should fail)"
echo "--------------------------------------------------------------"
curl -s -X POST "$BASE_URL/api/clients" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another User",
    "email": "test.user@example.com",
    "business_name": "Another Business"
  }' | jq '.' || echo "Response received"
echo ""
echo ""

# Test 5: Test validation (missing fields)
echo "5️⃣  Testing POST /api/clients (Missing fields - should fail)"
echo "-------------------------------------------------------------"
curl -s -X POST "$BASE_URL/api/clients" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Incomplete User"
  }' | jq '.' || echo "Response received"
echo ""
echo ""

echo "✅ API Testing Complete!"
echo ""
echo "💡 Tip: Check your email inbox for the welcome email sent to test.user@example.com"
echo "💡 Tip: Visit http://localhost:3000 to see the web UI"

