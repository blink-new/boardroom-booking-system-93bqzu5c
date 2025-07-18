export interface Room {
  id: string
  name: string
  capacity: number
  amenities: string[]
  location: string
  image?: string
}

export interface Booking {
  id: string
  roomId: string
  roomName: string
  userId: string
  userEmail: string
  userName: string
  title: string
  description?: string
  startTime: string
  endTime: string
  date: string
  status: 'confirmed' | 'pending' | 'cancelled'
  createdAt: string
  googleCalendarEventId?: string
}

export interface TimeSlot {
  start: string
  end: string
  available: boolean
  bookingId?: string
}