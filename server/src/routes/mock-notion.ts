import express from "express"

const router = express.Router()

type MockEvent = {
  id: string
  title: string
  start: string
  end: string | null
  status?: string | null
  tags?: string[]
  url?: string | null
  allDay?: boolean
}

let events: MockEvent[] = [
  {
    id: "mock-1",
    title: "Sample Post",
    start: new Date().toISOString().split("T")[0],
    end: null,
    status: "todo",
    tags: ["blog"],
    url: null,
    allDay: true,
  },
]

router.get("/events", (_req, res) => {
  res.json(events)
})

router.get("/schema", (_req, res) => {
  res.json({
    databaseId: "mock-db",
    dataSourceId: "mock-ds",
    title: "Mock Database",
    properties: {
      title: { label: "Title" },
      date: { label: "Schedule" },
      status: { label: "Status", type: "select", options: ["Todo", "In Progress", "Done"] },
      tags: { label: "Tags" },
      url: { label: "URL" },
    },
  })
})

router.post("/events", (req, res) => {
  const { title, start, end, status, tags, url } = req.body || {}
  const id = `mock-${Date.now()}`
  const ev: MockEvent = {
    id,
    title: title || "Untitled",
    start,
    end: end || null,
    status: status || null,
    tags: Array.isArray(tags) ? tags : [],
    url: url || null,
    allDay: start && !String(start).includes("T"),
  }
  events.push(ev)
  res.json({ id, title: ev.title, start: ev.start, end: ev.end, status: ev.status, success: true })
})

router.patch("/events/:id", (req, res) => {
  const { id } = req.params
  const { start, end } = req.body || {}
  const idx = events.findIndex((e) => e.id === id)
  if (idx === -1) return res.status(404).json({ error: "Event not found" })
  events[idx].start = start ?? events[idx].start
  events[idx].end = end ?? events[idx].end
  res.json({ success: true })
})

router.delete("/events/:id", (req, res) => {
  const { id } = req.params
  const before = events.length
  events = events.filter((e) => e.id !== id)
  if (events.length === before) return res.status(404).json({ error: "Event not found" })
  res.json({ success: true })
})

export { router as mockNotionRouter }
