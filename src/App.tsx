import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { blink } from './blink/client'
import { Toaster } from './components/ui/toaster'
import Dashboard from './pages/Dashboard'
import BookRoom from './pages/BookRoom'
import CalendarView from './pages/CalendarView'
import QRBooking from './pages/QRBooking'
import Navigation from './components/Navigation'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Boardroom Booking</h1>
          <p className="text-slate-600 mb-8">Please sign in to access the booking system</p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navigation user={user} />
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/book" element={<BookRoom />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/qr/:roomId?" element={<QRBooking />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </Router>
  )
}

export default App