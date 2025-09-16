const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  'Notion-Version': '2025-09-03'
});

async function getDatabaseSchema() {
  try {
    console.log('Fetching database schema...');
    const databaseId = process.env.NOTION_DATABASE_ID;
    
    // Get database info
    const database = await notion.databases.retrieve({
      database_id: databaseId
    });
    
    console.log('Database title:', database.title[0]?.plain_text || 'Untitled');
    console.log('\nProperties:');
    
    if (database.properties) {
      for (const [propName, prop] of Object.entries(database.properties)) {
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
    } else {
      console.log('No properties found');
    }
    
    console.log('\nFull database object:', JSON.stringify(database, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    
    if (error.code === 'object_not_found') {
      console.log('\n⚠️  Database not found. Check:');
      console.log('1. Database ID is correct');
      console.log('2. Integration has access to the database');
      console.log('3. Database exists and is accessible');
    }
    
    if (error.code === 'unauthorized') {
      console.log('\n⚠️  Unauthorized. Check:');
      console.log('1. API key is valid');
      console.log('2. Integration is properly configured');
    }
  }
}

getDatabaseSchema();