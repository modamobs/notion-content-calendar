import express from "express"
import { Client } from "@notionhq/client"

const router = express.Router()

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  notionVersion: "2025-09-03",
})

const DATABASE_ID = process.env.NOTION_DATABASE_ID!
let DATA_SOURCE_ID = process.env.NOTION_DATA_SOURCE_ID || ""
const TIMEZONE = "Asia/Seoul"

type SchemaKeys = {
  titleKey: string
  dateKey?: string
  statusKey?: string
  statusType?: "status" | "select"
  tagsKey?: string
  urlKey?: string
}

let schemaCache: SchemaKeys | null = null
type SchemaInfo = {
  databaseId: string
  dataSourceId: string
  title: string
  properties: {
    title?: { label: string }
    date?: { label: string }
    status?: { label: string; type: "status" | "select"; options: string[] }
    tags?: { label: string }
    url?: { label: string }
  }
}

async function ensureDataSourceId(): Promise<string> {
  if (DATA_SOURCE_ID) return DATA_SOURCE_ID
  // Retrieve database to list its data sources
  const db: any = await notion.databases.retrieve({ database_id: DATABASE_ID })
  const sources: Array<{ id: string; name?: string }> = db.data_sources || []
  if (!sources.length) {
    throw new Error("No data sources found for database. Create a data source in Notion or provide NOTION_DATA_SOURCE_ID.")
  }
  DATA_SOURCE_ID = sources[0].id
  return DATA_SOURCE_ID
}

async function ensureSchema(): Promise<SchemaKeys> {
  if (schemaCache) return schemaCache
  const dataSourceId = await ensureDataSourceId()
  // Retrieve data source schema
  const ds: any = await notion.request({
    path: `data_sources/${dataSourceId}`,
    method: "get",
  })
  const props: Record<string, any> = ds.properties

  const findKey = (prefName: string, type: string): string | undefined => {
    // Prefer exact preferred name
    for (const [k, v] of Object.entries(props)) {
      if (k === prefName && (v as any).type === type) return k
    }
    // Fallback: first property matching type
    for (const [k, v] of Object.entries(props)) {
      if ((v as any).type === type) return k
    }
    return undefined
  }

  const titleKey = findKey("Title", "title") || findKey("Name", "title")
  if (!titleKey) throw new Error("Database must have a Title/Name (title) property")
  const dateKey = findKey("Schedule", "date")
  // Prefer true Status type, fallback to select
  let statusKey: string | undefined = undefined
  let statusType: "status" | "select" | undefined = undefined
  const tryTypes: Array<"status" | "select"> = ["status", "select"]
  for (const t of tryTypes) {
    const key = findKey("Status", t)
    if (key) {
      statusKey = key
      statusType = t
      break
    }
  }
  if (!statusKey) {
    // fallback: first status/select
    for (const [k, v] of Object.entries(props)) {
      if ((v as any).type === "status" || (v as any).type === "select") {
        statusKey = k
        statusType = (v as any).type as any
        break
      }
    }
  }
  const tagsKey = findKey("Tags", "multi_select")
  const urlKey = findKey("URL", "url")

  schemaCache = { titleKey, dateKey, statusKey, statusType: statusType as any, tagsKey, urlKey }
  return schemaCache
}

// Expose schema for the client so it can render correct labels/options
router.get("/schema", async (_req, res) => {
  try {
    const { titleKey, dateKey, statusKey, statusType, tagsKey, urlKey } = await ensureSchema()
    const dataSourceId = await ensureDataSourceId()
    // Retrieve again to collect status options and DB title
    const ds: any = await notion.request({ path: `data_sources/${dataSourceId}`, method: "get" })
    const props: Record<string, any> = ds.properties

    const info: SchemaInfo = {
      databaseId: DATABASE_ID,
      dataSourceId: dataSourceId,
      title: ds?.title?.[0]?.plain_text || ds?.name || "Database",
      properties: {
        title: titleKey ? { label: titleKey } : undefined,
        date: dateKey ? { label: dateKey } : undefined,
        status: statusKey
          ? {
              label: statusKey,
              type: (statusType as any) || "status",
              options:
                props?.[statusKey]?.status?.options?.map((o: any) => o.name) ||
                props?.[statusKey]?.select?.options?.map((o: any) => o.name) ||
                [],
            }
          : undefined,
        tags: tagsKey ? { label: tagsKey } : undefined,
        url: urlKey ? { label: urlKey } : undefined,
      },
    }
    res.json(info)
  } catch (error: any) {
    console.error("Error fetching schema:", error?.message || error)
    const status = (error && (error.status || error.statusCode)) || 500
    res.status(status).json({ error: error?.message || "Failed to fetch schema", details: error?.body })
  }
})

const toClientStatus = (name?: string | null) => {
  if (!name) return null
  return name.trim().toLowerCase().replace(/\s+/g, "-") // "In Progress" -> "in-progress"
}

const toNotionStatus = (value?: string | null) => {
  if (!value) return undefined
  const v = value.trim().toLowerCase()
  if (v === "in-progress") return "In Progress"
  if (v === "todo") return "Todo"
  if (v === "done") return "Done"
  // fallback: title-case words
  return value
}

// Get all calendar events
router.get("/events", async (req, res) => {
  try {
    const { titleKey, dateKey, statusKey, tagsKey, urlKey } = await ensureSchema()
    const dataSourceId = await ensureDataSourceId()
    const response: any = await notion.request({
      path: `data_sources/${dataSourceId}/query`,
      method: "patch",
      body: {},
    })

    const events = response.results.map((page: any) => {
      const properties = page.properties

      // Extract title
      const title = properties[titleKey]?.title?.[0]?.plain_text || "Untitled"

      // Extract schedule (date)
  const schedule = dateKey ? properties?.[dateKey]?.date : undefined
  let start: string | null = null
  let end: string | null = null

      if (schedule) {
        start = schedule.start
        end = schedule.end || schedule.start
      }

      // Extract status (supports both status/select)
      let status: string | null = null
      if (statusKey) {
        const statusName = properties?.[statusKey]?.status?.name ?? properties?.[statusKey]?.select?.name ?? null
        status = toClientStatus(statusName)
      }

      // Extract tags
  const tags = tagsKey ? (properties?.[tagsKey]?.multi_select?.map((tag: any) => tag.name) || []) : []

      // Extract URL
  const url = urlKey ? (properties?.[urlKey]?.url || null) : null

      return {
        id: page.id,
        title,
        start,
        end,
        status,
        tags,
        url,
        allDay: schedule?.start && !schedule.start.includes("T"),
      }
    })

    res.json(events)
  } catch (error: any) {
    console.error("Error fetching events:", error?.message || error)
    const status = (error && (error.status || error.statusCode)) || 500
    res.status(status).json({ error: error?.message || "Failed to fetch events", details: error?.body })
  }
})

// Update event schedule (for drag & drop)
router.patch("/events/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { start, end } = req.body
    const { dateKey } = await ensureSchema()
    if (!dateKey) return res.status(400).json({ error: "Database is missing a date property (e.g., 'Schedule')" })

    const updateData: any = {
      [dateKey]: {
        date: {
          start: start,
          end: end || start,
        },
      },
    }

    await notion.pages.update({
      page_id: id,
      properties: updateData,
    })

    res.json({ success: true })
  } catch (error: any) {
    console.error("Error updating event:", error?.message || error)
    const status = (error && (error.status || error.statusCode)) || 500
    res.status(status).json({ error: error?.message || "Failed to update event", details: error?.body })
  }
})

// Create new event
router.post("/events", async (req, res) => {
  try {
  const { title, start, end, status, tags, url } = req.body
  const { titleKey, dateKey, statusKey, statusType, tagsKey, urlKey } = await ensureSchema()
    const dataSourceId = await ensureDataSourceId()

    const properties: any = {}
    properties[titleKey] = {
      title: [
        {
          text: {
            content: title,
          },
        },
      ],
    }
    if (dateKey) {
      properties[dateKey] = {
        date: {
          start: start,
          end: end || start,
        },
      }
    }

    if (status && statusKey) {
      const notionStatus = toNotionStatus(status)
      if (notionStatus) {
        if (statusType === "status") {
          properties[statusKey] = { status: { name: notionStatus } }
        } else {
          properties[statusKey] = { select: { name: notionStatus } }
        }
      }
    }

    if (tags && tags.length > 0 && tagsKey) {
      properties[tagsKey] = { multi_select: tags.map((tag: string) => ({ name: tag })) }
    }

    if (url && urlKey) {
      properties[urlKey] = { url }
    }

    // Use custom request to support data_source_id in parent regardless of SDK typing
    const response: any = await notion.request({
      path: "pages",
      method: "post",
      body: {
        parent: {
          type: "data_source_id",
          data_source_id: dataSourceId,
        },
        properties,
      },
    })

    res.json({
      id: response.id,
      title,
      start,
      end: end || start,
      status: status ? toClientStatus(toNotionStatus(status)) : null,
      tags: Array.isArray(tags) ? tags : [],
      url: url || null,
      allDay: start && !String(start).includes("T"),
      success: true,
    })
  } catch (error: any) {
    console.error("Error creating event:", error?.message || error)
    const status = (error && (error.status || error.statusCode)) || 500
    res.status(status).json({ error: error?.message || "Failed to create event", details: error?.body })
  }
})

// Delete event
router.delete("/events/:id", async (req, res) => {
  try {
    const { id } = req.params

    await notion.pages.update({
      page_id: id,
      archived: true,
    })

    res.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting event:", error?.message || error)
    const status = (error && (error.status || error.statusCode)) || 500
    res.status(status).json({ error: error?.message || "Failed to delete event", details: error?.body })
  }
})

export { router as notionRouter }
