#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Chess Opening Data Migration Script ===${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js is installed${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm is installed${NC}"

# Navigate to the backend directory
cd "$(dirname "$0")/../backend"

echo -e "${BLUE}📁 Working directory: $(pwd)${NC}"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found in backend directory${NC}"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

# Check if mongodb package is installed
if ! npm list mongodb &> /dev/null; then
    echo -e "${YELLOW}📦 Installing mongodb package...${NC}"
    npm install mongodb
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install mongodb package${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ mongodb package installed${NC}"
else
    echo -e "${GREEN}✓ mongodb package already installed${NC}"
fi

# Check if MongoDB is running
echo -e "${YELLOW}🔍 Checking MongoDB connection...${NC}"
if ! nc -z localhost 27017 2>/dev/null; then
    echo -e "${RED}❌ MongoDB is not running on localhost:27017${NC}"
    echo -e "${YELLOW}Please start MongoDB first:${NC}"
    echo "  - On Windows: Start MongoDB service"
    echo "  - On macOS: brew services start mongodb-community"
    echo "  - On Linux: sudo systemctl start mongod"
    exit 1
fi

echo -e "${GREEN}✓ MongoDB is running${NC}"

# Run the migration script
echo -e "${BLUE}🚀 Running migration script...${NC}"
echo ""

node ../scripts/fix-openings-data.js

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Migration completed successfully!${NC}"
    echo -e "${GREEN}You can now test the opening trainer with arrows.${NC}"
else
    echo ""
    echo -e "${RED}❌ Migration failed!${NC}"
    echo -e "${YELLOW}Please check the error messages above and try again.${NC}"
    exit 1
fi 