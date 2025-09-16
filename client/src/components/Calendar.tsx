"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

import type { CalendarEvent } from "../types/event"
import type { SchemaInfo } from "../types/schema"
import { eventApi } from "../services/api"
import EventModal from "./EventModal"

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [schema, setSchema] = useState<SchemaInfo | null>(null)

  const loadEvents = async () => {
    try {
      setLoading(true)
      const eventsData = await eventApi.getEvents()
      setEvents(eventsData)
      setError(null)
    } catch (err) {
      console.error("Failed to load events:", err)
      setError("Failed to load events. Please check your Notion integration.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        const s = await eventApi.getSchema()
        setSchema(s)
      } catch (e) {
        console.warn("Failed to fetch schema; continuing with defaults")
      } finally {
        await loadEvents()
      }
    })()
  }, [])

  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.dateStr)
    setSelectedEvent(null)
    setIsModalOpen(true)
  }

  const handleEventClick = (arg: any) => {
    const event = events.find(e => e.id === arg.event.id)
    if (event) {
      setSelectedEvent(event)
      setSelectedDate(null)
      setIsModalOpen(true)
    }
  }

  const handleEventDrop = async (arg: any) => {
    try {
      const { event } = arg
      const originalEvent = events.find(e => e.id === event.id)
      
      if (!originalEvent) return
      
      // Update event start date in Notion
      const updatedEvent: CalendarEvent = {
        ...originalEvent,
        start: event.startStr.split('T')[0] // Extract date part only
      }
      
      await eventApi.updateEvent(updatedEvent.id, updatedEvent)
      
      // Update local state
      setEvents(prevEvents => 
        prevEvents.map(e => 
          e.id === event.id 
            ? { ...e, start: updatedEvent.start }
            : e
        )
      )
      
      console.log(`Event moved to: ${event.startStr}`)
    } catch (error) {
      console.error('Failed to update event:', error)
      // Revert the event position
      arg.revert()
    }
  }

  const handleEventSave = async (eventData: CalendarEvent) => {
    try {
      if (selectedEvent) {
        // Update existing event
        await eventApi.updateEvent(selectedEvent.id, eventData)
        setEvents(prevEvents => 
          prevEvents.map(e => e.id === selectedEvent.id ? eventData : e)
        )
      } else {
        // Create new event
        const newEvent = await eventApi.createEvent({
          title: eventData.title,
          start: eventData.start ?? new Date().toISOString().slice(0, 10),
          status: eventData.status ?? undefined,
          tags: eventData.tags,
          url: eventData.url ?? undefined,
        })
        setEvents(prevEvents => [...prevEvents, newEvent])
      }
      setIsModalOpen(false)
      setSelectedEvent(null)
      setSelectedDate(null)
    } catch (error) {
      console.error('Failed to save event:', error)
    }
  }

  const handleEventDelete = async (eventId: string) => {
    try {
      await eventApi.deleteEvent(eventId)
      setEvents(prevEvents => prevEvents.filter(e => e.id !== eventId))
      setIsModalOpen(false)
      setSelectedEvent(null)
    } catch (error) {
      console.error('Failed to delete event:', error)
    }
  }

  // Convert events to FullCalendar format
  const calendarEvents = events
    .filter(event => !!event.start)
    .map(event => ({
    id: event.id,
    title: event.title,
    start: event.start as string,
    backgroundColor: event.status === 'Done' ? '#22c55e' : 
                    event.status === 'In Progress' ? '#f59e0b' : '#6b7280',
    borderColor: event.status === 'Done' ? '#16a34a' : 
                event.status === 'In Progress' ? '#d97706' : '#4b5563',
    extendedProps: {
      status: event.status,
      tags: event.tags,
      url: event.url
    }
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading calendar...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-600 text-center">
          <p className="text-lg mb-2">Error loading calendar</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={loadEvents}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Calendar</h2>
        <p className="text-gray-600">Drag and drop events to reschedule. Click dates to create new events.</p>
      </div>
      
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={calendarEvents}
        editable={true}
        droppable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        height={600}
        aspectRatio={1.8}
        eventDisplay="auto"
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
        slotLabelFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
      />

      {isModalOpen && createPortal(
        <EventModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedEvent(null)
            setSelectedDate(null)
          }}
          onSave={handleEventSave}
          onDelete={selectedEvent ? () => handleEventDelete(selectedEvent.id) : undefined}
          event={selectedEvent}
          initialDate={selectedDate}
          schema={schema || undefined}
        />,
        document.body
      )}
    </div>
  )
}

export default Calendar