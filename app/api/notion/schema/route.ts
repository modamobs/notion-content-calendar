import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

// Notion Client with 2025-09-03 version
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Data Source ID Cache
let dataSourceId: string | null = null;

async function getDataSourceId() {
  if (dataSourceId) return dataSourceId;
  
  try {
    const database = await notion.databases.retrieve({
      database_id: DATABASE_ID!
    });
    
    // Use the database ID directly as data source ID for compatibility
    dataSourceId = DATABASE_ID!;
    console.log('✅ Data Source ID:', dataSourceId);
    return dataSourceId;
  } catch (error) {
    console.error('❌ Error getting data source ID:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const dsId = await getDataSourceId();
    
    // Get database schema using standard API
    const database: any = await notion.databases.retrieve({
      database_id: DATABASE_ID!
    });
    
    const properties = database.properties;
    
    const schema = {
      dataSourceId: dsId,
      databaseId: DATABASE_ID,
      title: database.title?.[0]?.plain_text || 'Content Calendar',
      properties: {
        title: properties.Title ? { label: "Title", type: "title" } : undefined,
        schedule: properties.Schedule ? { label: "Schedule", type: "date" } : undefined,
        status: properties.Status ? {
          label: "Status", 
          type: properties.Status.type,
          options: properties.Status.select?.options?.map((opt: any) => opt.name) || []
        } : undefined,
        tags: properties.Tags ? {
          label: "Tags", 
          type: "multi_select",
          options: properties.Tags.multi_select?.options?.map((opt: any) => opt.name) || []
        } : undefined,
        url: properties.URL ? { label: "URL", type: "url" } : undefined
      }
    };
    
    console.log('📋 Schema retrieved:', JSON.stringify(schema, null, 2));
    return NextResponse.json(schema);
  } catch (error: any) {
    console.error('❌ Schema error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}