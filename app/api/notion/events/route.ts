import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  notionVersion: '2025-09-03', // 최신 버전 사용
})

const DATABASE_ID = process.env.NOTION_DATABASE_ID!

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

export async function GET() {
  try {
    console.log('=== GET /api/notion/events ===')
    console.log('NOTION_API_KEY exists:', !!process.env.NOTION_API_KEY)
    console.log('NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID)
    
    // SDK v5에서는 request 메서드 사용
    const response = await notion.request({
      method: 'post',
      path: `databases/${DATABASE_ID}/query`,
      body: {
        sorts: [
          {
            property: "Schedule",
            direction: "ascending",
          },
        ],
      },
    }) as any

    const events = response.results.map((page: any) => {
      const properties = page.properties

      // Extract title
      const title = properties.Title?.title?.[0]?.plain_text || "Untitled"

      // Extract schedule (date)
      const schedule = properties.Schedule?.date
      let start = null
      let end = null

      if (schedule) {
        start = schedule.start
        end = schedule.end || schedule.start
      }

      // Extract status
      const status = properties.Status?.select?.name || null

      // Extract tags
      const tags = properties.Tags?.multi_select?.map((tag: any) => tag.name) || []

      // Extract URL
      const url = properties.URL?.url || null

      return {
        id: page.id,
        title,
        start,
        end,
        status,
        tags,
        url
      }
    })

    return setCorsHeaders(NextResponse.json(events))
  } catch (error) {
    console.error('Error fetching events:', error)
    return setCorsHeaders(NextResponse.json(
      { error: 'Failed to fetch events', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    ))
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== POST /api/notion/events ===')
    const eventData = await request.json()
    console.log('Event data received:', eventData)
    
    // Build properties object dynamically
    const properties: any = {
      Title: {
        title: [
          {
            text: {
              content: eventData.title,
            },
          },
        ],
      },
      Schedule: {
        date: {
          start: eventData.start,
          end: eventData.end || null,
        },
      },
    }

    // Add optional properties only if they exist
    if (eventData.status) {
      properties.Status = {
        select: {
          name: eventData.status,
        },
      }
    }

    if (eventData.tags && eventData.tags.length > 0) {
      properties.Tags = {
        multi_select: eventData.tags.map((tag: string) => ({ name: tag })),
      }
    }

    if (eventData.url) {
      properties.URL = {
        url: eventData.url,
      }
    }

    const response = await notion.pages.create({
      parent: {
        type: "database_id",
        database_id: DATABASE_ID,
      },
      properties,
    })
    
    // Return the full event data for the client
    return setCorsHeaders(NextResponse.json({
      id: response.id,
      title: eventData.title,
      start: eventData.start,
      end: eventData.end,
      status: eventData.status,
      tags: eventData.tags || [],
      url: eventData.url,
      allDay: false
    }))
  } catch (error) {
    console.error('Error creating event:', error)
    return setCorsHeaders(NextResponse.json(
      { error: 'Failed to create event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    ))
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log('=== PATCH /api/notion/events ===')
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('id')
    
    if (!eventId) {
      return setCorsHeaders(NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      ))
    }

    const eventData = await request.json()
    console.log('Event data to update:', eventData)
    
    // Build properties object dynamically
    const properties: any = {}

    if (eventData.title !== undefined) {
      properties.Title = {
        title: [
          {
            text: {
              content: eventData.title,
            },
          },
        ],
      }
    }

    if (eventData.start !== undefined || eventData.end !== undefined) {
      properties.Schedule = {
        date: {
          start: eventData.start,
          end: eventData.end || null,
        },
      }
    }

    if (eventData.status !== undefined) {
      properties.Status = {
        select: {
          name: eventData.status,
        },
      }
    }

    if (eventData.tags !== undefined) {
      properties.Tags = {
        multi_select: eventData.tags.map((tag: string) => ({ name: tag })),
      }
    }

    if (eventData.url !== undefined) {
      properties.URL = {
        url: eventData.url,
      }
    }

    const response = await notion.pages.update({
      page_id: eventId,
      properties,
    })
    
    return setCorsHeaders(NextResponse.json({
      id: response.id,
      title: eventData.title,
      start: eventData.start,
      end: eventData.end,
      status: eventData.status,
      tags: eventData.tags || [],
      url: eventData.url,
      allDay: false
    }))
  } catch (error) {
    console.error('Error updating event:', error)
    return setCorsHeaders(NextResponse.json(
      { error: 'Failed to update event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    ))
  }
}

export async function PUT(request: NextRequest) {
  // PUT은 전체 리소스 교체를 위해 PATCH와 동일하게 처리
  return PATCH(request)
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('=== DELETE /api/notion/events ===')
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('id')
    
    if (!eventId) {
      return setCorsHeaders(NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      ))
    }

    // Notion에서는 페이지를 실제로 삭제하는 대신 archived로 설정
    await notion.pages.update({
      page_id: eventId,
      archived: true,
    })
    
    return setCorsHeaders(NextResponse.json({ success: true, id: eventId }))
  } catch (error) {
    console.error('Error deleting event:', error)
    return setCorsHeaders(NextResponse.json(
      { error: 'Failed to delete event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    ))
  }
}