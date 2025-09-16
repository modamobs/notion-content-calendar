import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  notionVersion: '2022-06-28', // 이전 안정 버전 사용
})

// CORS 헤더 설정 함수
function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function OPTIONS() {
  return setCorsHeaders(new NextResponse(null, { status: 200 }))
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json()
    
    // Build properties object for updates
    const properties: any = {}
    
    if (updates.start || updates.end) {
      properties.Schedule = {
        date: {
          start: updates.start,
          end: updates.end || updates.start,
        },
      }
    }

    if (updates.title) {
      properties.Title = {
        title: [
          {
            text: {
              content: updates.title,
            },
          },
        ],
      }
    }

    if (updates.status) {
      properties.Status = {
        select: {
          name: updates.status,
        },
      }
    }

    if (updates.tags) {
      properties.Tags = {
        multi_select: updates.tags.map((tag: string) => ({ name: tag })),
      }
    }

    if (updates.url !== undefined) {
      if (updates.url) {
        properties.URL = {
          url: updates.url,
        }
      } else {
        properties.URL = {
          url: null,
        }
      }
    }

    await notion.pages.update({
      page_id: params.id,
      properties,
    })
    
    return setCorsHeaders(NextResponse.json({ success: true }))
  } catch (error) {
    console.error('Error updating event:', error)
    return setCorsHeaders(NextResponse.json(
      { error: 'Failed to update event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    ))
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Archive the page (Notion doesn't have true delete, only archive)
    await notion.pages.update({
      page_id: params.id,
      archived: true,
    })
    
    return setCorsHeaders(NextResponse.json({ success: true }))
  } catch (error) {
    console.error('Error deleting event:', error)
    return setCorsHeaders(NextResponse.json(
      { error: 'Failed to delete event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    ))
  }
}