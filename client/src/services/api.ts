import axios from "axios"
import type { CalendarEvent, CreateEventData } from "../types/event"
import type { SchemaInfo } from "../types/schema"

const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
})

// Mock data - 실제 Notion 데이터베이스 구조에 맞춤
const mockSchema: SchemaInfo = {
  properties: {
    title: { label: "Title", type: "title" },
    schedule: { label: "Schedule", type: "date" },
    status: { 
      label: "Status", 
      type: "status", 
      options: ["In Progress", "Not started", "Done"] 
    },
    tags: { 
      label: "Tags", 
      type: "multi_select", 
      options: ["콘텐츠", "마케팅", "기획", "리뷰"] 
    },
    url: { label: "URL", type: "url" }
  }
}

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: '하이',
    start: new Date(2025, 8, 16).toISOString(), // 2025년 9월 16일
    end: new Date(2025, 8, 16, 23, 59).toISOString(),
    backgroundColor: '#f59e0b', // In Progress 색상
    tags: [],
    status: 'In Progress',
    url: 'google.com/web...oQPAgl',
    extendedProps: {
      status: 'In Progress',
      tags: [],
      url: 'google.com/web...oQPAgl'
    }
  },
  {
    id: '2',
    title: '콘텐츠 기획',
    start: new Date(Date.now() + 86400000).toISOString(),
    end: new Date(Date.now() + 86400000 + 7200000).toISOString(),
    backgroundColor: '#6b7280', // Not started 색상
    tags: ['기획'],
    status: 'Not started',
    url: '',
    extendedProps: {
      status: 'Not started',
      tags: ['기획'],
      url: ''
    }
  },
  {
    id: '3',
    title: '마케팅 캠페인',
    start: new Date(Date.now() + 2 * 86400000).toISOString(),
    end: new Date(Date.now() + 2 * 86400000 + 7200000).toISOString(),
    backgroundColor: '#22c55e', // Done 색상
    tags: ['마케팅'],
    status: 'Done',
    url: 'https://example.com',
    extendedProps: {
      status: 'Done',
      tags: ['마케팅'],
      url: 'https://example.com'
    }
  }
]

export const eventApi = {
  // Get schema - use mock data if API fails
  getSchema: async (): Promise<SchemaInfo> => {
    try {
      const response = await api.get("/notion/schema")
      return response.data
    } catch (error) {
      console.warn('API unavailable, using mock schema:', error)
      return mockSchema
    }
  },
  
  // Get all events - use mock data if API fails
  getEvents: async (): Promise<CalendarEvent[]> => {
    try {
      const response = await api.get("/notion/events")
      return response.data
    } catch (error) {
      console.warn('API unavailable, using mock events:', error)
      return mockEvents
    }
  },

  // Create new event
  createEvent: async (eventData: CreateEventData): Promise<CalendarEvent> => {
    const response = await api.post("/notion/events", eventData)
    return response.data
  },

  // Update event (for drag & drop or edit)
  updateEvent: async (id: string, updates: Partial<CalendarEvent>): Promise<void> => {
    await api.patch(`/notion/events?id=${id}`, updates)
  },

  // Delete event
  deleteEvent: async (id: string): Promise<void> => {
    await api.delete(`/notion/events?id=${id}`)
  },
}