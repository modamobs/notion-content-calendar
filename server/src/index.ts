import express from "express"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 8080

console.log('Starting server with PORT:', PORT)

// Middleware
app.use(cors())
app.use(express.json())

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Server is running", port: PORT })
})

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    port: PORT
  })
})

// Mock schema route
app.get("/api/notion/schema", (req, res) => {
  res.json({
    properties: {
      title: { label: "제목", type: "title" },
      schedule: { label: "일정", type: "date" },
      status: { label: "상태", type: "status", options: ["계획됨", "진행중", "완료됨"] },
      tags: { label: "태그", type: "multi_select", options: ["업무", "개인", "중요"] },
      url: { label: "URL", type: "url" }
    }
  })
})

console.log('About to listen on port:', PORT)

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
  console.log('Server is ready to accept connections')
})

server.on('error', (err) => {
  console.error('❌ Server error:', err)
})

// Add error handling
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
})
