const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');
require('dotenv').config();

const app = express();
const PORT = 9001;

// Notion Client with 2025-09-03 version
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  'Notion-Version': '2025-09-03'
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Debug: 환경 변수 확인
console.log('🔑 API Key (first 10 chars):', process.env.NOTION_API_KEY?.substring(0, 10) + '...');
console.log('📊 Database ID:', process.env.NOTION_DATABASE_ID);
console.log('📁 Current working directory:', process.cwd());

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running',
    version: '2025-09-03',
    port: PORT
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

// Data Source ID Cache
let dataSourceId = null;

async function getDataSourceId() {
  if (dataSourceId) return dataSourceId;
  
  try {
    const database = await notion.databases.retrieve({
      database_id: DATABASE_ID
    });
    
    if (database.data_sources && database.data_sources.length > 0) {
      dataSourceId = database.data_sources[0].id;
      console.log('✅ Data Source ID:', dataSourceId);
      return dataSourceId;
    }
    
    throw new Error('No data sources found');
  } catch (error) {
    console.error('❌ Error getting data source ID:', error.message);
    throw error;
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Notion Calendar Server v2025-09-03' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    port: PORT,
    notionVersion: '2025-09-03',
    hasApiKey: !!process.env.NOTION_API_KEY,
    hasDatabaseId: !!process.env.NOTION_DATABASE_ID
  });
});

app.get('/api/notion/schema', async (req, res) => {
  try {
    const dsId = await getDataSourceId();
    
    // Get data source schema using 2025-09-03 API
    const dataSource = await notion.request({
      path: `data_sources/${dsId}`,
      method: 'GET'
    });
    
    const properties = dataSource.properties || {};
    
    const schema = {
      dataSourceId: dsId,
      databaseId: DATABASE_ID,
      title: dataSource.title?.[0]?.plain_text || 'Content Calendar',
      properties: {
        title: properties.Title ? { label: "Title", type: "title" } : undefined,
        schedule: properties.Schedule ? { label: "Schedule", type: "date" } : undefined,
        status: properties.Status ? {
          label: "Status",
          type: properties.Status.type,
          options: properties.Status.status?.options?.map(opt => opt.name) || 
                  properties.Status.select?.options?.map(opt => opt.name) || []
        } : undefined,
        tags: properties.Tags ? {
          label: "Tags", 
          type: "multi_select",
          options: properties.Tags.multi_select?.options?.map(opt => opt.name) || []
        } : undefined,
        url: properties.URL ? { label: "URL", type: "url" } : undefined
      }
    };
    
    console.log('📋 Schema retrieved:', JSON.stringify(schema, null, 2));
    res.json(schema);
  } catch (error) {
    console.error('❌ Schema error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/notion/events', async (req, res) => {
  try {
    const dsId = await getDataSourceId();
    
    // Query data source using 2025-09-03 API
    const response = await notion.request({
      path: `data_sources/${dsId}/query`,
      method: 'POST',
      body: {
        page_size: 100
      }
    });
    
    const events = response.results.map(page => ({
      id: page.id,
      title: page.properties.Title?.title?.[0]?.plain_text || 'Untitled',
      start: page.properties.Schedule?.date?.start || null,
      end: page.properties.Schedule?.date?.end || null,
      status: page.properties.Status?.status?.name || 
             page.properties.Status?.select?.name || null,
      tags: page.properties.Tags?.multi_select?.map(tag => tag.name) || [],
      url: page.properties.URL?.url || null,
      backgroundColor: getStatusColor(
        page.properties.Status?.status?.name || 
        page.properties.Status?.select?.name
      )
    }));
    
    console.log(`📅 Found ${events.length} events`);
    res.json(events);
  } catch (error) {
    console.error('❌ Events error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST endpoint for creating/updating events
app.post('/api/notion/events', async (req, res) => {
  try {
    const { title, start, end, status, tags, url } = req.body;
    
    // Prepare properties for Notion API
    const properties = {
      Title: {
        title: [{ text: { content: title || 'Untitled' } }]
      }
    };
    
    // Add date if provided
    if (start) {
      properties.Schedule = {
        date: {
          start: start,
          end: end || null
        }
      };
    }
    
    // Add status if provided
    if (status) {
      properties.Status = {
        select: { name: status }
      };
    }
    
    // Add tags if provided
    if (tags && tags.length > 0) {
      properties.Tags = {
        multi_select: tags.map(tag => ({ name: tag }))
      };
    }
    
    // Add URL if provided
    if (url) {
      properties.URL = {
        url: url
      };
    }
    
    // Create new page in database
    const response = await notion.pages.create({
      parent: {
        database_id: DATABASE_ID
      },
      properties: properties
    });
    
    console.log('✅ Event created:', response.id);
    
    // Return the created event in calendar format
    const newEvent = {
      id: response.id,
      title: title || 'Untitled',
      start: start,
      end: end,
      status: status,
      tags: tags || [],
      url: url,
      backgroundColor: getStatusColor(status)
    };
    
    res.json(newEvent);
  } catch (error) {
    console.error('❌ Create event error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH endpoint for partial updates (drag & drop)
app.patch('/api/notion/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, start, end, status, tags, url } = req.body;
    
    console.log(`🔄 PATCH request for event ${id}:`, req.body);
    
    // Prepare properties for update (only update provided fields)
    const properties = {};
    
    if (title !== undefined) {
      properties.Title = {
        title: [{ text: { content: title } }]
      };
    }
    
    if (start !== undefined) {
      properties.Schedule = {
        date: {
          start: start,
          end: end || null
        }
      };
    }
    
    if (status !== undefined) {
      properties.Status = {
        select: { name: status }
      };
    }
    
    if (tags !== undefined) {
      properties.Tags = {
        multi_select: tags.map(tag => ({ name: tag }))
      };
    }
    
    if (url !== undefined) {
      properties.URL = {
        url: url
      };
    }
    
    // Update the page
    const response = await notion.pages.update({
      page_id: id,
      properties: properties
    });
    
    console.log('✅ Event updated via PATCH:', id);
    
    // Return the updated event
    const updatedEvent = {
      id: id,
      title: title,
      start: start,
      end: end,
      status: status,
      tags: tags || [],
      url: url,
      backgroundColor: getStatusColor(status)
    };
    
    res.json(updatedEvent);
  } catch (error) {
    console.error('❌ PATCH event error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT endpoint for updating existing events
app.put('/api/notion/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, start, end, status, tags, url } = req.body;
    
    // Prepare properties for update
    const properties = {};
    
    if (title !== undefined) {
      properties.Title = {
        title: [{ text: { content: title } }]
      };
    }
    
    if (start !== undefined) {
      properties.Schedule = {
        date: {
          start: start,
          end: end || null
        }
      };
    }
    
    if (status !== undefined) {
      properties.Status = {
        select: { name: status }
      };
    }
    
    if (tags !== undefined) {
      properties.Tags = {
        multi_select: tags.map(tag => ({ name: tag }))
      };
    }
    
    if (url !== undefined) {
      properties.URL = {
        url: url
      };
    }
    
    // Update the page
    const response = await notion.pages.update({
      page_id: id,
      properties: properties
    });
    
    console.log('✅ Event updated:', id);
    
    // Return the updated event
    const updatedEvent = {
      id: id,
      title: title,
      start: start,
      end: end,
      status: status,
      tags: tags || [],
      url: url,
      backgroundColor: getStatusColor(status)
    };
    
    res.json(updatedEvent);
  } catch (error) {
    console.error('❌ Update event error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE endpoint for removing events
app.delete('/api/notion/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Archive the page (Notion doesn't support true deletion)
    await notion.pages.update({
      page_id: id,
      archived: true
    });
    
    console.log('✅ Event deleted (archived):', id);
    res.json({ success: true, id: id });
  } catch (error) {
    console.error('❌ Delete event error:', error);
    res.status(500).json({ error: error.message });
  }
});

function getStatusColor(status) {
  switch (status) {
    case 'Done': return '#22c55e';
    case 'In Progress': return '#f59e0b';
    case 'Not started': 
    default: return '#6b7280';
  }
}

console.log(`Starting server on port ${PORT}...`);

app.listen(PORT, (err) => {
  if (err) {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  } else {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🌍 Server listening on all interfaces on port ${PORT}`);
    console.log('🔄 Notion API Version: 2025-09-03');
    console.log('📍 Available endpoints:');
    console.log('  GET    / - Health check');
    console.log('  GET    /test - Test endpoint');
    console.log('  GET    /api/notion/schema - Database schema');
    console.log('  GET    /api/notion/events - Calendar events');
    console.log('  POST   /api/notion/events - Create new event');
    console.log('  PATCH  /api/notion/events/:id - Partial update event');
    console.log('  PUT    /api/notion/events/:id - Full update event');
    console.log('  DELETE /api/notion/events/:id - Delete event');
  }
});