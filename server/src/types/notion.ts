export interface NotionEvent {
  id: string
  title: string
  start: string | null
  end: string | null
  status: string | null
  tags: string[]
  url: string | null
  allDay: boolean
}

export interface CreateEventRequest {
  title: string
  start: string
  end?: string
  status?: string
  tags?: string[]
  url?: string
}

export interface UpdateEventRequest {
  start: string
  end?: string
}
