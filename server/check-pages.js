const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  'Notion-Version': '2025-09-03'
});

async function getActualProperties() {
  try {
    console.log('Querying database pages...');
    const databaseId = process.env.NOTION_DATABASE_ID;
    
    // Query database to get actual pages and their properties
    const response = await notion.request({
      path: `databases/${databaseId}/query`,
      method: 'POST',
      body: {
        page_size: 5
      }
    });
    
    console.log('Found', response.results.length, 'pages');
    
    if (response.results.length > 0) {
      const firstPage = response.results[0];
      console.log('\nFirst page properties:');
      
      for (const [propName, prop] of Object.entries(firstPage.properties)) {
        console.log(`- ${propName}: ${prop.type}`);
        
        // Show some sample data
        if (prop.type === 'title' && prop.title.length > 0) {
          console.log(`  Value: "${prop.title[0].plain_text}"`);
        }
        
        if (prop.type === 'rich_text' && prop.rich_text.length > 0) {
          console.log(`  Value: "${prop.rich_text[0].plain_text}"`);
        }
        
        if (prop.type === 'select' && prop.select) {
          console.log(`  Value: "${prop.select.name}"`);
        }
        
        if (prop.type === 'status' && prop.status) {
          console.log(`  Value: "${prop.status.name}"`);
        }
        
        if (prop.type === 'multi_select' && prop.multi_select.length > 0) {
          console.log(`  Values: [${prop.multi_select.map(item => `"${item.name}"`).join(', ')}]`);
        }
        
        if (prop.type === 'date' && prop.date) {
          console.log(`  Value: ${prop.date.start}`);
        }
        
        if (prop.type === 'url' && prop.url) {
          console.log(`  Value: "${prop.url}"`);
        }
      }
    } else {
      console.log('No pages found in database');
      console.log('This might be an empty database or the integration lacks permissions');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'object_not_found') {
      console.log('\n⚠️  Database not found or no access');
    }
    
    if (error.code === 'unauthorized') {
      console.log('\n⚠️  Unauthorized - check API key and permissions');
    }
  }
}

getActualProperties();