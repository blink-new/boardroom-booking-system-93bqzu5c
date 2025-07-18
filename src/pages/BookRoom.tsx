import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, Users, AlertCircle, Check } from 'lucide-react'
import { blink } from '../blink/client'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Alert, AlertDescription } from '../components/ui/alert'
import { useToast } from '../hooks/use-toast'
import { Room, Booking, TimeSlot } from '../types/booking'
// Removed date-fns import to avoid potential issues

export default function BookRoom() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [conflict, setConflict] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: ''
  })

  useEffect(() => {
    loadRooms()
  }, [])

  useEffect(() => {
    if (selectedRoom && selectedDate) {
      loadTimeSlots()
    }
  }, [selectedRoom, selectedDate, loadTimeSlots])

  useEffect(() => {
    const roomId = searchParams.get('room')
    if (roomId && rooms.length > 0) {
      const room = rooms.find(r => r.id === roomId)
      if (room) {
        setSelectedRoom(room)
      }
    }
  }, [searchParams, rooms])

  const loadRooms = async () => {
    try {
      const allRooms = await blink.db.rooms.list({
        orderBy: { name: 'asc' }
      })
      setRooms(allRooms)
    } catch (error) {
      console.error('Error loading rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTimeSlots = useCallback(async () => {
    if (!selectedRoom) return

    try {
      // Get existing bookings for the selected room and date
      const existingBookings = await blink.db.bookings.list({
        where: {
          AND: [
            { roomId: selectedRoom.id },
            { date: selectedDate },
            { status: 'confirmed' }
          ]
        }
      })

      // Generate time slots (9 AM to 6 PM, 1-hour slots)
      const slots: TimeSlot[] = []
      for (let hour = 9; hour < 18; hour++) {
        const start = `${hour.toString().padStart(2, '0')}:00`
        const end = `${(hour + 1).toString().padStart(2, '0')}:00`
        
        const isBooked = existingBookings.some(booking => {
          const bookingStart = booking.startTime
          const bookingEnd = booking.endTime
          return (start >= bookingStart && start < bookingEnd) || 
                 (end > bookingStart && end <= bookingEnd) ||
                 (start <= bookingStart && end >= bookingEnd)
        })

        slots.push({
          start,
          end,
          available: !isBooked,
          bookingId: isBooked ? existingBookings.find(b => 
            (start >= b.startTime && start < b.endTime) || 
            (end > b.startTime && end <= b.endTime) ||
            (start <= b.startTime && end >= b.endTime)
          )?.id : undefined
        })
      }

      setTimeSlots(slots)
    } catch (error) {
      console.error('Error loading time slots:', error)
    }
  }, [selectedRoom, selectedDate])

  const checkConflict = async (startTime: string, endTime: string) => {
    if (!selectedRoom || !selectedDate) return

    try {
      const existingBookings = await blink.db.bookings.list({
        where: {
          AND: [
            { roomId: selectedRoom.id },
            { date: selectedDate },
            { status: 'confirmed' }
          ]
        }
      })

      const hasConflict = existingBookings.some(booking => {
        return (startTime >= booking.startTime && startTime < booking.endTime) || 
               (endTime > booking.startTime && endTime <= booking.endTime) ||
               (startTime <= booking.startTime && endTime >= booking.endTime)
      })

      if (hasConflict) {
        setConflict('This time slot conflicts with an existing booking')
      } else {
        setConflict(null)
      }
    } catch (error) {
      console.error('Error checking conflict:', error)
    }
  }

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)

    if (newFormData.startTime && newFormData.endTime) {
      checkConflict(newFormData.startTime, newFormData.endTime)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRoom || conflict) return

    setSubmitting(true)
    try {
      const user = await blink.auth.me()
      
      const booking: Omit<Booking, 'id' | 'createdAt'> = {
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
        userId: user.id,
        userEmail: user.email,
        userName: user.displayName || user.email,
        title: formData.title,
        description: formData.description,
        startTime: formData.startTime,
        endTime: formData.endTime,
        date: selectedDate,
        status: 'confirmed'
      }

      await blink.db.bookings.create(booking)

      toast({
        title: 'Booking Confirmed',
        description: `${selectedRoom.name} booked for ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${formData.startTime}`,
      })

      navigate('/dashboard')
    } catch (error) {
      console.error('Error creating booking:', error)
      toast({
        title: 'Booking Failed',
        description: 'There was an error creating your booking. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-64 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Book a Room</h1>
        <p className="text-slate-600">Reserve a boardroom for your meeting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Room Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Room & Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Room Selection */}
            <div>
              <Label htmlFor="room">Room</Label>
              <Select
                value={selectedRoom?.id || ''}
                onValueChange={(value) => {
                  const room = rooms.find(r => r.id === value)
                  setSelectedRoom(room || null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      <div className="flex items-center space-x-2">
                        <span>{room.name}</span>
                        <span className="text-sm text-slate-500">({room.capacity} people)</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleTimeChange('startTime', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleTimeChange('endTime', e.target.value)}
                />
              </div>
            </div>

            {conflict && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{conflict}</AlertDescription>
              </Alert>
            )}

            {/* Available Time Slots */}
            {selectedRoom && timeSlots.length > 0 && (
              <div>
                <Label>Available Time Slots</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {timeSlots.map((slot) => (
                    <Button
                      key={`${slot.start}-${slot.end}`}
                      variant={slot.available ? "outline" : "secondary"}
                      size="sm"
                      disabled={!slot.available}
                      onClick={() => {
                        if (slot.available) {
                          setFormData({
                            ...formData,
                            startTime: slot.start,
                            endTime: slot.end
                          })
                          setSelectedTimeSlot(slot)
                          setConflict(null)
                        }
                      }}
                      className={`text-xs ${selectedTimeSlot === slot ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      {slot.start} - {slot.end}
                      {!slot.available && <span className="ml-1">🚫</span>}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Form */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Meeting Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Team Standup"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Meeting agenda or notes..."
                  rows={3}
                />
              </div>

              {selectedRoom && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-2">Booking Summary</h4>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedRoom.name} - {selectedRoom.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Capacity: {selectedRoom.capacity} people</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    {formData.startTime && formData.endTime && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{formData.startTime} - {formData.endTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!selectedRoom || !formData.title || !formData.startTime || !formData.endTime || !!conflict || submitting}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Booking...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirm Booking
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}