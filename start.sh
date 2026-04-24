#!/bin/bash

# AI Content Studio - Startup Script
# This script will:
# 1. Clean up used ports (3000 and 5001)
# 2. Check/Start PostgreSQL
# 3. Install dependencies
# 4. Set up database and seed data
# 5. Start backend and frontend with hot-reload

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           AI CONTENT STUDIO - Startup Script                 ║"
echo "║      All-in-One AI Content Generation Platform               ║"
echo "║                                                              ║"
echo "║   Features:                                                  ║"
echo "║   - AI Content Calendar      - AI Blog Outline Creator       ║"
echo "║   - AI Repurposer            - AI Newsletter Writer          ║"
echo "║   - AI Plagiarism Checker    - AI Press Release Writer       ║"
echo "║   - AI Image Suggester       - AI Script Writer              ║"
echo "║   - AI Performance Predictor - And 15+ more tools!           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Step 1: Clean up ports
echo ""
echo -e "${YELLOW}Step 1: Cleaning up used ports...${NC}"

# Kill process on port 3000 (Frontend)
if lsof -ti:3000 > /dev/null 2>&1; then
    print_warning "Port 3000 is in use. Killing process..."
    kill -9 $(lsof -ti:3000) 2>/dev/null || true
    sleep 1
    print_status "Port 3000 freed"
else
    print_status "Port 3000 is available"
fi

# Kill process on port 5001 (Backend)
if lsof -ti:5001 > /dev/null 2>&1; then
    print_warning "Port 5001 is in use. Killing process..."
    kill -9 $(lsof -ti:5001) 2>/dev/null || true
    sleep 1
    print_status "Port 5001 freed"
else
    print_status "Port 5001 is available"
fi

# Also check and clean port 5000 just in case
if lsof -ti:5000 > /dev/null 2>&1; then
    print_warning "Port 5000 is in use. Killing process..."
    kill -9 $(lsof -ti:5000) 2>/dev/null || true
    sleep 1
    print_status "Port 5000 freed"
fi

# Step 2: Check PostgreSQL
echo ""
echo -e "${YELLOW}Step 2: Checking PostgreSQL...${NC}"

# Check if PostgreSQL is running
if command -v pg_isready &> /dev/null; then
    if pg_isready -q; then
        print_status "PostgreSQL is running"
    else
        print_warning "PostgreSQL is not running. Attempting to start..."
        if command -v brew &> /dev/null; then
            brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
        elif command -v systemctl &> /dev/null; then
            sudo systemctl start postgresql
        fi
        sleep 2
        if pg_isready -q; then
            print_status "PostgreSQL started successfully"
        else
            print_error "Could not start PostgreSQL. Please start it manually."
            echo "  On macOS: brew services start postgresql"
            echo "  On Linux: sudo systemctl start postgresql"
            exit 1
        fi
    fi
else
    print_warning "pg_isready not found. Assuming PostgreSQL is running..."
fi

# Create database if not exists
print_info "Checking database..."
if command -v createdb &> /dev/null; then
    createdb ai_content_studio 2>/dev/null || true
    print_status "Database 'ai_content_studio' ready"
fi

# Step 3: Check .env file
echo ""
echo -e "${YELLOW}Step 3: Checking environment configuration...${NC}"

if [ -f ".env" ]; then
    print_status ".env file found"

    # Check if OpenRouter API key is set
    if grep -q "your-openrouter-api-key-here" .env 2>/dev/null; then
        print_warning "OpenRouter API key not configured!"
        echo -e "${YELLOW}    Please update OPENROUTER_API_KEY in .env file${NC}"
        echo "    Get your API key at: https://openrouter.ai/keys"
    else
        print_status "OpenRouter API key is configured"
    fi
else
    print_error ".env file not found!"
    echo "Creating default .env file..."
    cat > .env << 'EOF'
# AI Content Studio Environment Configuration

# Database
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/ai_content_studio"

# OpenRouter API Key (Required for AI features)
OPENROUTER_API_KEY="your-openrouter-api-key-here"
OPENROUTER_MODEL="anthropic/claude-haiku-4.5"

# OpenAI API Key (Optional - for TTS audio + DALL-E image generation)
OPENAI_API_KEY=""

# JWT Secret for Authentication
JWT_SECRET="ai-content-studio-super-secret-key-2024"

# Server Configuration (NOT using port 5000)
PORT=5001
NODE_ENV=development

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# Demo Credentials (for auto-populate login)
DEMO_EMAIL="demo@aicontentstudio.com"
DEMO_PASSWORD="Demo123!"
EOF
    print_status ".env file created. Please update OPENROUTER_API_KEY"
fi

# Step 4: Install dependencies
echo ""
echo -e "${YELLOW}Step 4: Installing dependencies...${NC}"

# Backend dependencies
print_info "Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    npm install
    print_status "Backend dependencies installed"
else
    print_status "Backend dependencies already installed"
fi
cd ..

# Frontend dependencies
print_info "Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    npm install
    print_status "Frontend dependencies installed"
else
    print_status "Frontend dependencies already installed"
fi
cd ..

print_status "All dependencies installed"

# Step 5: Set up database
echo ""
echo -e "${YELLOW}Step 5: Setting up database...${NC}"

cd backend

# Export environment variables from root .env for Prisma
export $(grep -v '^#' ../.env | grep -v '^$' | xargs)

print_info "Generating Prisma client..."
npx prisma generate

print_info "Pushing database schema..."
npx prisma db push --accept-data-loss

print_info "Seeding database with sample data (15 items per feature)..."
node src/seed.js
cd ..

print_status "Database setup complete"

# Step 6: Start services with hot-reload
echo ""
echo -e "${YELLOW}Step 6: Starting services with hot-reload...${NC}"

# Final port check before starting
if lsof -ti:5001 > /dev/null 2>&1; then
    print_warning "Port 5001 still in use. Force killing..."
    kill -9 $(lsof -ti:5001) 2>/dev/null || true
    sleep 2
fi
if lsof -ti:3000 > /dev/null 2>&1; then
    print_warning "Port 3000 still in use. Force killing..."
    kill -9 $(lsof -ti:3000) 2>/dev/null || true
    sleep 2
fi

# Start backend with nodemon for auto-reload (2s delay to prevent EADDRINUSE)
print_info "Starting backend server (with nodemon for hot-reload)..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 4

# Start frontend with Vite for hot-reload
print_info "Starting frontend development server (with Vite HMR)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 3

# Print success message
echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           AI Content Studio is Running!                      ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║                                                              ║"
echo "║   Frontend:  http://localhost:3000                           ║"
echo "║   Backend:   http://localhost:5001                           ║"
echo "║                                                              ║"
echo "║   Demo Login:                                                ║"
echo "║   Email:     demo@aicontentstudio.com                        ║"
echo "║   Password:  Demo123!                                        ║"
echo "║                                                              ║"
echo "║   (Use the 'Quick Demo Login' button for easy access)        ║"
echo "║                                                              ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║   NEW FEATURES:                                              ║"
echo "║   - AI Content Calendar    - AI Blog Outline Creator         ║"
echo "║   - AI Repurposer          - AI Newsletter Writer            ║"
echo "║   - AI Plagiarism Checker  - AI Press Release Writer         ║"
echo "║   - AI Image Suggester     - AI Script Writer                ║"
echo "║   - AI Performance Predictor                                 ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║   Hot-reload is ENABLED:                                     ║"
echo "║   - Backend: nodemon watches for changes                     ║"
echo "║   - Frontend: Vite HMR for instant updates                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${CYAN}Press Ctrl+C to stop all services${NC}"
echo ""

# Trap to clean up on exit
cleanup() {
    echo ""
    print_info "Shutting down services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    # Clean up any remaining processes on our ports
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:5001 | xargs kill -9 2>/dev/null || true
    print_status "Services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
