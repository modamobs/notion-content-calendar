# Notion Content Calendar

A full-stack content calendar application that integrates with Notion databases, featuring drag & drop scheduling and real-time synchronization.

## Features

- 📅 **FullCalendar Integration**: Month, week, and day views with drag & drop support
- 🔄 **Notion Sync**: Real-time synchronization with your Notion database
- 🏷️ **Status Management**: Visual status indicators (Todo, In Progress, Done)
- 🏷️ **Tag Support**: Multi-select tags for content organization
- 🔗 **URL Links**: Direct links to content resources
- 🌏 **Timezone Support**: Asia/Seoul timezone configuration
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for build tooling
- FullCalendar for calendar UI
- Axios for API communication
- date-fns for date manipulation

### Backend
- Express.js + TypeScript
- Notion API integration
- CORS enabled for cross-origin requests
- Asia/Seoul timezone handling

## Project Structure

\`\`\`
notion-content-calendar/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── ...
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── types/          # TypeScript types
│   │   └── index.ts
│   └── package.json
└── package.json           # Root package.json
\`\`\`

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Notion account with API access
- Notion database with the required schema

### 1. Install Dependencies

\`\`\`bash
# Install all dependencies (root, client, and server)
npm run install:all
\`\`\`

### 2. Notion Setup

1. **Create a Notion Integration**:
   - Go to https://www.notion.so/my-integrations
   - Click "New integration"
   - Give it a name (e.g., "Content Calendar")
   - Copy the "Internal Integration Token"

2. **Create a Notion Database** with these properties:
   - `Title` (Title) - Required
   - `Schedule` (Date) - Required, with start and end date support
   - `Status` (Select) - Optional, with options: "Todo", "In Progress", "Done"
   - `Tags` (Multi-select) - Optional
   - `URL` (URL) - Optional

3. **Share Database with Integration**:
   - Open your Notion database
   - Click "Share" → "Invite"
   - Search for your integration name and invite it

4. **Get Database ID**:
   - Copy the database URL: `https://notion.so/your-workspace/DATABASE_ID?v=...`
   - Extract the DATABASE_ID (32-character string)

### 3. Environment Configuration

Create `server/.env` file:

\`\`\`env
NOTION_API_KEY=your_notion_integration_token_here
NOTION_DATABASE_ID=your_notion_database_id_here
PORT=5174
\`\`\`

### 4. Start Development Servers

\`\`\`bash
# Start both frontend and backend concurrently
npm run dev
\`\`\`

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:5174

## API Endpoints

### Events
- `GET /api/notion/events` - Get all calendar events
- `POST /api/notion/events` - Create new event
- `PATCH /api/notion/events/:id` - Update event (for drag & drop)
- `DELETE /api/notion/events/:id` - Delete event (archive in Notion)

### Health Check
- `GET /api/health` - Server health status

## Usage

1. **View Calendar**: Browse your content in month, week, or day view
2. **Create Events**: Click on any date to create a new content item
3. **Edit Events**: Click on existing events to edit details
4. **Drag & Drop**: Drag events to reschedule them instantly
5. **Status Tracking**: Use color-coded status indicators
6. **Tag Organization**: Add multiple tags for better content organization

## Notion Database Schema

Your Notion database should have these properties:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| Title | Title | Yes | Content title |
| Schedule | Date | Yes | Start/end dates |
| Status | Select | No | Todo, In Progress, Done |
| Tags | Multi-select | No | Content categories |
| URL | URL | No | Link to content |

## Development

### Frontend Development
\`\`\`bash
cd client
npm run dev
\`\`\`

### Backend Development
\`\`\`bash
cd server
npm run dev
\`\`\`

### Building for Production
\`\`\`bash
npm run build
\`\`\`

## Troubleshooting

### Common Issues

1. **"Failed to load events"**:
   - Check your Notion API key and database ID
   - Ensure the integration has access to the database
   - Verify the database schema matches requirements

2. **CORS Errors**:
   - Ensure the backend is running on port 5174
   - Check the Vite proxy configuration

3. **Drag & Drop Not Working**:
   - Verify the Schedule property in Notion is a Date type
   - Check browser console for API errors

### Environment Variables

Make sure these are set in `server/.env`:
- `NOTION_API_KEY`: Your Notion integration token
- `NOTION_DATABASE_ID`: Your Notion database ID
- `PORT`: Server port (default: 5174)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
