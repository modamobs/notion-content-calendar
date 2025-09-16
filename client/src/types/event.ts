export interface CalendarEvent {
  id: string
  title: string
  start: string | null
  end?: string | null
  status?: string | null
  tags: string[]
  url?: string | null
  backgroundColor?: string
  extendedProps?: {
    status?: string
    tags?: string[]
    url?: string
  }
}

export interface CreateEventData {
  title: string
  start: string
  end?: string
  status?: string
  tags?: string[]
  url?: string
}
