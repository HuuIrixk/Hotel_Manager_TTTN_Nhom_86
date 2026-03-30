import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Header from '@/layouts/Header'
import Footer from '@/layouts/Footer'
import { getRoomDetails } from '@/api/roomApi'

function normalizeAmenities(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean)
    } catch {
      return trimmed.split(',').map((item) => item.trim()).filter(Boolean)
    }
  }
  return []
}

export default function RoomDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // FE user nên mặc định là 4000 chứ không phải 4001
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
  const API_ORIGIN = API_BASE.replace(/\/api$/, '')

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
  }, [])

  useEffect(() => {
    async function fetchRoom() {
      try {
        const data = await getRoomDetails(id)

        // backend có thể trả { room: {...} } hoặc {...}
        const roomData = data.room || data

        // debug nếu cần
        // console.log('Room detail from API:', data, '=> roomData:', roomData)

        setRoom(roomData)
      } catch (e) {
        console.error(e)
        setError('Không tìm thấy phòng')
      } finally {
        setLoading(false)
      }
    }

    fetchRoom()
  }, [id])

  const handleBook = () => {
    if (!room) return
    navigate(`/booking?room=${room.room_id}&amount=${room.price}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <p>Đang tải dữ liệu phòng...</p>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center">
        <p>{error || 'Không tìm thấy phòng'}</p>
      </div>
    )
  }

  const roomImg = room.image_url
    ? (room.image_url.startsWith('http')
        ? room.image_url
        : `${API_ORIGIN}${room.image_url}`)
    : room.image && room.image.startsWith('http')
    ? room.image
    : room.image
    ? `${API_ORIGIN}${room.image}`
    : null

  const roomAmenities = normalizeAmenities(room.amenities)

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />
      <main className="pt-24 pb-16 px-4 max-w-6xl mx-auto">
        <section className="grid md:grid-cols-2 gap-10 items-start">
          {/* Cột ảnh */}
          <div data-aos="fade-right" className="space-y-4">
            <div className="overflow-hidden rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.16)] border border-slate-200 w-full h-[320px] md:h-[380px] bg-slate-100 flex items-center justify-center">
              {roomImg ? (
                <img
                  src={roomImg}
                  alt={room.room_number || `Phòng ${room.room_id}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800/40 text-slate-300 text-sm">
                  Ảnh phòng đang cập nhật
                </div>
              )}
            </div>
          </div>

          {/* Cột thông tin */}
          <div data-aos="fade-left" className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-cyan-400">
              Phòng {room.room_number || room.room_id}
            </h1>

            <p className="text-slate-700 text-lg">
              Loại phòng: {room.type || 'Chưa cập nhật'}
            </p>
            <p className="text-slate-700 text-lg">
              Sức chứa: {room.capacity || '?'} người
            </p>
            <p className="text-slate-700 text-lg">
              Giá: {Number(room.price).toLocaleString('vi-VN') || 'N/A'} đ / đêm
            </p>
            <p className="text-slate-700 text-lg">
              Trạng thái{' '}
              <span
                className={
                  room.status === 'available'
                    ? 'text-green-400'
                    : 'text-red-400'
                }
              >
                {room.status === 'available' ? 'Còn phòng' : 'Không khả dụng'}
              </span>
            </p>

            <p className="mt-4 text-slate-600 leading-relaxed text-lg">
              {room.description || 'Chưa có mô tả cho phòng này.'}
            </p>

            {roomAmenities.length > 0 && (
              <div className="mt-2 space-y-2">
                <p className="text-slate-800 font-semibold text-lg">Tiện nghi</p>
                <div className="flex flex-wrap gap-2">
                  {roomAmenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="px-3 py-1 rounded-full text-sm bg-cyan-50 border border-cyan-200 text-cyan-700"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {room.status === 'available' && (
              <button
                onClick={handleBook}
                className="mt-6 px-10 py-3 bg-gradient-to-r from-cyan-400 to-cyan-500 text-black font-semibold rounded-full shadow-[0_0_25px_rgba(34,211,238,0.6)] hover:shadow-[0_0_35px_rgba(34,211,238,0.9)] transition-all duration-300"
              >
                Đặt phòng ngay
              </button>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
