import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, MapPin, Plus, Users } from 'lucide-react'
import { blink } from '../blink/client'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Booking, Room } from '../types/booking'

export default function Dashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const user = await blink.auth.me()
      
      // Load user's bookings
      const userBookings = await blink.db.bookings.list({
        where: { userId: user.id },
        orderBy: { date: 'asc', startTime: 'asc' },
        limit: 10
      })
      
      // Load all rooms
      const allRooms = await blink.db.rooms.list({
        orderBy: { name: 'asc' }
      })
      
      setBookings(userBookings)
      setRooms(allRooms)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const upcomingBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date)
    return bookingDate >= new Date() && booking.status === 'confirmed'
  })

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Manage your boardroom bookings</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <MapPin className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rooms.length}</div>
            <p className="text-xs text-slate-600">Available for booking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingBookings.length}</div>
            <p className="text-xs text-slate-600">Upcoming meetings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Book</CardTitle>
            <Plus className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <Link to="/book">
              <Button className="w-full">Book a Room</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Upcoming Bookings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No upcoming bookings</p>
                <Link to="/book">
                  <Button>Book Your First Room</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{booking.title}</h4>
                      <p className="text-sm text-slate-600">{booking.roomName}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                        <span>{getDateLabel(booking.date)}</span>
                        <span>{booking.startTime} - {booking.endTime}</span>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Rooms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Available Rooms</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rooms.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No rooms available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rooms.slice(0, 4).map((room) => (
                  <div key={room.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{room.name}</h4>
                      <p className="text-sm text-slate-600">{room.location}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-500">Up to {room.capacity} people</span>
                      </div>
                    </div>
                    <Link to={`/book?room=${room.id}`}>
                      <Button size="sm">Book</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}