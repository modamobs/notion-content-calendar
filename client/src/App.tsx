import React from "react"
import Calendar from "./components/Calendar"

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <Calendar />
      </div>
    </div>
  )
}

export default App
