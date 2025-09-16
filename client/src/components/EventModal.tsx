import React, { useEffect, useState } from "react"
import type { CalendarEvent } from "../types/event"
import type { SchemaInfo } from "../types/schema"

type Props = {
  isOpen: boolean
  onClose: () => void
  onSave: (eventData: CalendarEvent) => void | Promise<void>
  onDelete?: () => void
  event?: CalendarEvent | null
  initialDate?: string | null
  schema?: SchemaInfo
}

const EventModal: React.FC<Props> = ({ isOpen, onClose, onSave, onDelete, event, initialDate, schema }) => {
  const [title, setTitle] = useState("")
  const [date, setDate] = useState<string>("")
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [tags, setTags] = useState<string>("")
  const [url, setUrl] = useState<string>("")

  useEffect(() => {
    if (event) {
      setTitle(event.title || "")
      setDate((event.start ?? initialDate ?? "").slice(0, 10))
      setStatus(event.status ?? undefined)
      setTags((event.tags ?? []).join(", "))
      setUrl(event.url ?? "")
    } else {
      setTitle("")
      setDate(initialDate ?? new Date().toISOString().slice(0, 10))
      setStatus(undefined)
      setTags("")
      setUrl("")
    }
  }, [event, initialDate])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: CalendarEvent = {
      id: event?.id ?? "",
      title: title.trim(),
      start: date || new Date().toISOString().slice(0, 10),
      end: null,
      status: status ?? null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      url: url || null,
    }
    await onSave(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded bg-white p-4 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold">{event ? "Edit Event" : "New Event"}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm">{schema?.properties.title?.label ?? "Title"}</label>
            <input className="w-full rounded border px-2 py-1" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm">{schema?.properties.date?.label ?? "Start Date"}</label>
            <input type="date" className="w-full rounded border px-2 py-1" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          {schema?.properties.status && (
            <div>
              <label className="mb-1 block text-sm">{schema.properties.status.label}</label>
              <select className="w-full rounded border px-2 py-1" value={status ?? ""} onChange={(e) => setStatus(e.target.value || undefined)}>
                <option value="">(none)</option>
                {schema.properties.status.options.map((opt) => (
                  <option key={opt.toLowerCase()} value={opt.trim().toLowerCase().replace(/\s+/g, "-")}>{opt}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm">{schema?.properties.tags?.label ? `${schema.properties.tags.label} (comma-separated)` : "Tags (comma-separated)"}</label>
            <input className="w-full rounded border px-2 py-1" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm">{schema?.properties.url?.label ?? "URL"}</label>
            <input className="w-full rounded border px-2 py-1" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-white">
                Save
              </button>
              <button type="button" onClick={onClose} className="rounded border px-3 py-1">
                Cancel
              </button>
            </div>
            {onDelete && event && (
              <button type="button" onClick={onDelete} className="rounded bg-red-600 px-3 py-1 text-white">
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default EventModal
