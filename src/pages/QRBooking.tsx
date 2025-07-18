import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QrCode, Download, Share2, Calendar, MapPin, Users } from 'lucide-react'
import QRCode from 'qrcode'
import { blink } from '../blink/client'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { useToast } from '../hooks/use-toast'
import { Room } from '../types/booking'

export default function QRBooking() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRooms()
  }, [])

  useEffect(() => {
    if (roomId && rooms.length > 0) {
      const room = rooms.find(r => r.id === roomId)
      if (room) {
        setSelectedRoom(room)
        generateQRCode(room.id)
      }
    }
  }, [roomId, rooms])

  useEffect(() => {
    if (selectedRoom) {
      generateQRCode(selectedRoom.id)
    }
  }, [selectedRoom])

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

  const generateQRCode = async (roomId: string) => {
    try {
      const bookingUrl = `${window.location.origin}/book?room=${roomId}`
      const qrDataUrl = await QRCode.toDataURL(bookingUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        }
      })
      setQrCodeUrl(qrDataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl || !selectedRoom) return

    const link = document.createElement('a')
    link.download = `${selectedRoom.name.replace(/\s+/g, '-')}-QR-Code.png`
    link.href = qrCodeUrl
    link.click()

    toast({
      title: 'QR Code Downloaded',
      description: `QR code for ${selectedRoom.name} has been downloaded`,
    })
  }

  const shareQRCode = async () => {
    if (!selectedRoom) return

    const bookingUrl = `${window.location.origin}/book?room=${selectedRoom.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Book ${selectedRoom.name}`,
          text: `Scan this QR code or use this link to book ${selectedRoom.name}`,
          url: bookingUrl
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(bookingUrl)
        toast({
          title: 'Link Copied',
          description: 'Booking link has been copied to clipboard',
        })
      } catch (error) {
        console.error('Error copying to clipboard:', error)
      }
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">QR Code Booking</h1>
        <p className="text-slate-600">Generate QR codes for quick room booking</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Room Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Select Room</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Select
                value={selectedRoom?.id || ''}
                onValueChange={(value) => {
                  const room = rooms.find(r => r.id === value)
                  setSelectedRoom(room || null)
                  if (room) {
                    navigate(`/qr/${room.id}`)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a room to generate QR code" />
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

            {selectedRoom && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-3">Room Details</h4>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedRoom.name} - {selectedRoom.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Capacity: {selectedRoom.capacity} people</span>
                  </div>
                  {selectedRoom.amenities.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium text-slate-700 mb-1">Amenities:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedRoom.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="text-sm text-slate-600">
              <h4 className="font-medium text-slate-900 mb-2">How it works:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Select a room to generate its QR code</li>
                <li>Download or share the QR code</li>
                <li>Team members can scan to book the room instantly</li>
                <li>QR code links directly to the booking form</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <QrCode className="w-5 h-5" />
              <span>QR Code</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedRoom ? (
              <div className="text-center py-12">
                <QrCode className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Select a room to generate QR code</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* QR Code Image */}
                <div className="flex justify-center">
                  <div className="p-4 bg-white border-2 border-slate-200 rounded-lg shadow-sm">
                    {qrCodeUrl ? (
                      <img
                        src={qrCodeUrl}
                        alt={`QR Code for ${selectedRoom.name}`}
                        className="w-64 h-64"
                      />
                    ) : (
                      <div className="w-64 h-64 bg-slate-100 animate-pulse rounded"></div>
                    )}
                  </div>
                </div>

                {/* Room Info */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {selectedRoom.name}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Scan to book this room instantly
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button
                    onClick={downloadQRCode}
                    disabled={!qrCodeUrl}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={shareQRCode}
                    variant="outline"
                    className="flex-1"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>

                {/* Direct Link */}
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600 mb-2">Direct booking link:</p>
                  <code className="text-xs text-slate-800 break-all">
                    {window.location.origin}/book?room={selectedRoom.id}
                  </code>
                </div>

                {/* Quick Book Button */}
                <Button
                  onClick={() => navigate(`/book?room=${selectedRoom.id}`)}
                  variant="outline"
                  className="w-full"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book This Room Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}