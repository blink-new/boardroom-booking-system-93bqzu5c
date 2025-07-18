import { useState, useEffect, useCallback } from 'react'
import { Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { blink } from '../blink/client'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Booking } from '../types/booking'

export default function CalendarView() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBookings()
  }, [currentDate, loadBookings])

  const loadBookings = useCallback(async () => {
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const startDate = new Date(year, month, 1)
      const endDate = new Date(year, month + 1, 0)
      
      const monthBookings = await blink.db.bookings.list({
        where: {
          AND: [
            { date: { gte: startDate.toISOString().split('T')[0] } },
            { date: { lte: endDate.toISOString().split('T')[0] } },
            { status: 'confirmed' }
          ]
        },
        orderBy: { date: 'asc', startTime: 'asc' }
      })
      
      setBookings(monthBookings)
    } catch (error) {
      console.error('Error loading bookings:', error)
    } finally {
      setLoading(false)
    }
  }, [currentDate])

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []
    
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d))
    }
    
    return days
  }

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return bookings.filter(booking => booking.date === dateStr)
  }

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString()
  }

  const isToday = (date: Date) => {
    return isSameDay(date, new Date())
  }

  const selectedDateBookings = selectedDate ? getBookingsForDate(selectedDate) : []

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-96 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Calendar View</h1>
        <p className="text-slate-600">View all boardroom bookings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousMonth}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextMonth}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-slate-600">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth().map(date => {
                  const dayBookings = getBookingsForDate(date)
                  const isSelected = selectedDate && isSameDay(date, selectedDate)
                  const isCurrentDay = isToday(date)
                  
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`p-2 min-h-[80px] border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors ${
                        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      } ${isCurrentDay ? 'bg-blue-100' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isCurrentDay ? 'text-blue-700' : 'text-slate-900'
                      }`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayBookings.slice(0, 2).map(booking => (
                          <div
                            key={booking.id}
                            className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate"
                          >
                            {booking.startTime} {booking.title}
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <div className="text-xs text-slate-500">
                            +{dayBookings.length - 2} more
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Date Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>
                  {selectedDate 
                    ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Select a date'
                  }
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">Click on a date to view bookings</p>
                </div>
              ) : selectedDateBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No bookings for this date</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateBookings.map(booking => (
                    <div key={booking.id} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-slate-900">{booking.title}</h4>
                        <Badge variant="secondary">
                          {booking.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{booking.startTime} - {booking.endTime}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{booking.roomName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>{booking.userName}</span>
                        </div>
                      </div>
                      
                      {booking.description && (
                        <div className="mt-3 p-2 bg-slate-50 rounded text-sm text-slate-700">
                          {booking.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}