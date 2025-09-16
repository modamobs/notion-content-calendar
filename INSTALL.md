# Installation Guide

Follow these steps to set up the Notion Content Calendar project:

## Quick Start

\`\`\`bash
# 1. Install all dependencies
npm run install:all

# 2. Set up environment variables (see below)
cp server/.env.example server/.env
# Edit server/.env with your Notion credentials

# 3. Start development servers
npm run dev
\`\`\`

## Detailed Setup

### Step 1: Install Dependencies

\`\`\`bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install

# Or use the convenience script from root:
cd ..
npm run install:all
\`\`\`

### Step 2: Notion Integration Setup

1. **Create Notion Integration**:
   - Visit: https://www.notion.so/my-integrations
   - Click "New integration"
   - Name: "Content Calendar" (or your preferred name)
   - Copy the "Internal Integration Token"

2. **Create Notion Database**:
   Create a new database with these exact properties:
   
   | Property Name | Property Type | Required |
   |---------------|---------------|----------|
   | Title | Title | ✅ |
   | Schedule | Date | ✅ |
   | Status | Select | ❌ |
   | Tags | Multi-select | ❌ |
   | URL | URL | ❌ |

   **Status Select Options** (if using):
   - Todo
   - In Progress  
   - Done

3. **Share Database with Integration**:
   - Open your database in Notion
   - Click "Share" button (top right)
   - Click "Invite" 
   - Search for your integration name
   - Select it and click "Invite"

4. **Get Database ID**:
   - Copy your database URL
   - Format: `https://www.notion.so/workspace/DATABASE_ID?v=view_id`
   - Extract the 32-character DATABASE_ID

### Step 3: Environment Configuration

Create `server/.env` file:

\`\`\`bash
cp server/.env.example server/.env
\`\`\`

Edit `server/.env`:

\`\`\`env
NOTION_API_KEY=secret_your_integration_token_here
NOTION_DATABASE_ID=your_32_character_database_id_here
PORT=5177
\`\`\`

### Step 4: Start Development

\`\`\`bash
# From project root - starts both frontend and backend
npm run dev
\`\`\`

This starts:
- **Frontend**: http://localhost:5173 (React + Vite)
- **Backend**: http://localhost:5178 (Express API)

### Step 5: Verify Setup

1. Open http://localhost:5173
2. You should see the calendar interface
3. If you have events in your Notion database, they should appear
4. Try creating a new event by clicking on a date

## Alternative Installation Methods

### Manual Installation

\`\`\`bash
# Root dependencies
npm install

# Client setup
cd client
npm install
npm run dev &  # Run in background

# Server setup  
cd ../server
npm install
npm run dev &  # Run in background
\`\`\`

### Production Build

\`\`\`bash
# Build client for production
cd client
npm run build

# Build server for production
cd ../server
npm run build
npm start
\`\`\`

## Troubleshooting Installation

### Common Issues

1. **Node.js Version**:
   - Requires Node.js 18+
   - Check: `node --version`

2. **Port Conflicts**:
   - Frontend (5173) or Backend (5174) ports in use
   - Change ports in `client/vite.config.ts` and `server/.env`

3. **Notion API Errors**:
   - Double-check integration token format
   - Ensure database is shared with integration
   - Verify database ID is correct (32 characters)

4. **CORS/Proxy Issues**:
   - Ensure backend is running on port 5178 (default)
   - Check Vite proxy target in `client/vite.config.ts` (should point to http://localhost:5178)
   
5. **Mock Mode**:
   - Set `NOTION_MOCK=true` in `server/.env` to test UI without Notion credentials
   - Mock endpoints: `/api/notion/events` (GET/POST/PATCH/DELETE)

### Verification Commands

\`\`\`bash
# Check if all dependencies installed
npm list --depth=0
cd client && npm list --depth=0
cd ../server && npm list --depth=0

# Test API connection
curl http://localhost:5177/api/health

# Check Notion connection (or mock)
curl http://localhost:5178/api/notion/events
\`\`\`

## Next Steps

After successful installation:

1. **Test Basic Functionality**:
   - View calendar in different modes (month/week/day)
   - Create a test event
   - Try drag & drop to reschedule

2. **Customize**:
   - Add more status options in Notion
   - Create custom tags for your content types
   - Modify the UI colors/styling

3. **Deploy** (optional):
   - Frontend: Deploy to Vercel/Netlify
   - Backend: Deploy to Railway/Heroku
   - Update CORS settings for production URLs

Need help? Check the main README.md for usage instructions and troubleshooting.
