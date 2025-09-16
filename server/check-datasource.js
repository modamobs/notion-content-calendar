const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  'Notion-Version': '2025-09-03'
});

async function getDataSourceSchema() {
  try {
    console.log('Fetching database with data source...');
    const databaseId = process.env.NOTION_DATABASE_ID;
    
    // Get database info
    const database = await notion.databases.retrieve({
      database_id: databaseId
    });
    
    console.log('Database title:', database.title[0]?.plain_text || 'Untitled');
    
    if (database.data_sources && database.data_sources.length > 0) {
      const dataSourceId = database.data_sources[0].id;
      console.log('Data source ID:', dataSourceId);
      
      // Get data source schema
      const dataSource = await notion.data_sources.retrieve({
        data_source_id: dataSourceId
      });
      
      console.log('\nData source schema:');
      console.log('Type:', dataSource.type);
      
      if (dataSource.type === 'database') {
        const dbSchema = dataSource.database;
        console.log('\nProperties:');
        
        if (dbSchema.properties) {
          for (const [propName, prop] of Object.entries(dbSchema.properties)) {
            console.log(`- ${propName}: ${prop.type}`);
            
            if (prop.type === 'select' && prop.select?.options) {
              console.log(`  Options:`, prop.select.options.map(opt => opt.name));
            }
            
            if (prop.type === 'status' && prop.status?.options) {
              console.log(`  Options:`, prop.status.options.map(opt => opt.name));
            }
            
            if (prop.type === 'multi_select' && prop.multi_select?.options) {
              console.log(`  Options:`, prop.multi_select.options.map(opt => opt.name));
            }
          }
        }
      }
      
      console.log('\nFull data source:', JSON.stringify(dataSource, null, 2));
    } else {
      console.log('No data sources found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'object_not_found') {
      console.log('\n⚠️  Object not found. Check:');
      console.log('1. Database/Data source ID is correct');
      console.log('2. Integration has access to the database');
    }
    
    if (error.code === 'unauthorized') {
      console.log('\n⚠️  Unauthorized. Check:');
      console.log('1. API key is valid');
      console.log('2. Integration is properly configured');
    }
  }
}

getDataSourceSchema();