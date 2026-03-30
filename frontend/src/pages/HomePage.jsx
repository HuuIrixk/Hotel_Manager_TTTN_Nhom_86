// src/pages/HomePage.jsx
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Header from '@/layouts/Header'
import Footer from '@/layouts/Footer'
import HeroSection from '@/features/home/HeroSection'
import { FaCalendar } from 'react-icons/fa'
import { HiUsers } from 'react-icons/hi'
import { useTheme } from '@/features/theme/ThemeProvider'
import { searchRooms } from '@/api/roomApi'

// Card gợi ý phòng trên HomePage
function SuggestedRoomCard({ room, onBook, onViewDetail, isLight }) {
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
  const API_ORIGIN = API_BASE.replace(/\/api$/, '')

  const imageSrc = room.image_url
    ? room.image_url.startsWith('http')
      ? room.image_url
      : `${API_ORIGIN}${room.image_url}`
    : room.image
    ? room.image.startsWith('http')
      ? room.image
      : `${API_ORIGIN}${room.image}`
    : null

  return (
    <div
      className={
        'rounded-2xl overflow-hidden flex flex-col shadow-sm border transition hover:-translate-y-1 hover:shadow-lg ' +
        (isLight
          ? 'bg-white border-slate-200'
          : 'bg-white/5 border-cyan-400/20')
      }
    >
      {/* Ảnh phòng */}
      <div className="w-full h-40 overflow-hidden flex items-center justify-center">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={room.room_number || room.room_id}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={
              'w-full h-full flex items-center justify-center text-xs ' +
              (isLight
                ? 'bg-slate-100 text-slate-500'
                : 'bg-slate-800/60 text-gray-200')
            }
          >
            Ảnh phòng đang cập nhật
          </div>
        )}
      </div>

      <div className="p-4 space-y-1 flex-1 flex flex-col">
        <h2
          className={
            'font-semibold ' +
            (isLight ? 'text-slate-900' : 'text-cyan-300')
          }
        >
          Phòng {room.room_number || room.room_id}
        </h2>

        <p
          className={
            'text-sm ' + (isLight ? 'text-slate-700' : 'text-gray-200')
          }
        >
          Loại: {room.type || 'Không xác định'}
        </p>

        <p
          className={
            'text-sm ' + (isLight ? 'text-slate-700' : 'text-gray-200')
          }
        >
          Sức chứa: {room.capacity || 2} khách
        </p>

        <p
          className={
            'text-sm ' + (isLight ? 'text-slate-700' : 'text-gray-200')
          }
        >
          Giá:{' '}
          <span className="font-semibold text-cyan-500">
            {room.price
              ? `${Number(room.price).toLocaleString('vi-VN')} đ / đêm`
              : 'Liên hệ'}
          </span>
        </p>

        {(() => {
          const amenities = Array.isArray(room.amenities)
            ? room.amenities
            : typeof room.amenities === 'string' && room.amenities
            ? (() => { try { return JSON.parse(room.amenities) } catch { return [] } })()
            : []
          return amenities.length > 0 ? (
            <div className="relative group">
              <div className="flex flex-wrap gap-1 mt-1">
              {amenities.slice(0, 4).map((a) => (
                <span
                  key={a}
                  className={
                    'text-xs px-2 py-0.5 rounded-full border ' +
                    (isLight
                      ? 'bg-cyan-50 border-cyan-200 text-cyan-700'
                      : 'bg-cyan-400/10 border-cyan-300/30 text-cyan-300')
                  }
                >
                  {a}
                </span>
              ))}
              {amenities.length > 4 && (
                <span
                  className={
                    'text-xs px-2 py-0.5 rounded-full border cursor-default ' +
                    (isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-500'
                      : 'bg-slate-700/40 border-slate-500/30 text-gray-400')
                  }
                >
                  +{amenities.length - 4}
                </span>
              )}
            </div>
              {amenities.length > 4 && (
                <div
                  className={
                    'hidden group-hover:block absolute z-20 right-0 bottom-full mb-2 w-64 p-2 rounded-lg border shadow-lg ' +
                    (isLight
                      ? 'bg-white border-slate-200 text-slate-700'
                      : 'bg-slate-900 border-slate-700 text-gray-200')
                  }
                >
                  <div className="text-xs font-semibold mb-1">Tất cả tiện nghi</div>
                  <div className="flex flex-wrap gap-1">
                    {amenities.map((item) => (
                      <span
                        key={`all-${item}`}
                        className={
                          'text-[11px] px-2 py-0.5 rounded-full border ' +
                          (isLight
                            ? 'bg-cyan-50 border-cyan-200 text-cyan-700'
                            : 'bg-cyan-400/10 border-cyan-300/30 text-cyan-300')
                        }
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null
        })()}

        <p
          className={
            'text-xs mt-1 ' +
            (isLight ? 'text-slate-500' : 'text-gray-400')
          }
        >
          Tình trạng:{' '}
          <span className="font-medium">
            {room.status === 'available' ? 'Còn trống' : room.status}
          </span>
        </p>

        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onBook(room)}
            className="text-sm font-semibold text-black bg-gradient-to-r from-cyan-400 to-cyan-500 px-3 py-1.5 rounded-full hover:scale-105 hover:shadow-[0_0_15px_rgba(34,211,238,0.6)] transition"
          >
            Đặt phòng
          </button>

          <button
            type="button"
            onClick={() => onViewDetail(room)}
            className={
              'text-sm underline ' +
              (isLight ? 'text-slate-600 hover:text-cyan-500' : 'text-gray-200 hover:text-cyan-300')
            }
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </div>
  )
}


export default function HomePage() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState('2')

  // Gợi ý phòng từ DB
  const [suggestedRooms, setSuggestedRooms] = useState([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [suggestError, setSuggestError] = useState('')

  useEffect(() => {
    document.title = 'Trang chủ | VAA Hotel'
  }, [])

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
  }, [])

  // Lấy gợi ý phòng từ DB
  useEffect(() => {
    let cancelled = false
    const fetchSuggestions = async () => {
      try {
        setSuggestLoading(true)
        setSuggestError('')

        // searchRooms không truyền gì -> lấy tất cả phòng available, sort price ASC
        const data = await searchRooms({})
        if (cancelled) return

        const list = Array.isArray(data) ? data : []
        // Giới hạn số lượng gợi ý (vd: 3 phòng)
        setSuggestedRooms(list.slice(0, 3))
      } catch (err) {
        console.error('Lỗi load gợi ý phòng:', err)
        if (cancelled) return
        setSuggestError('Không tải được gợi ý phòng. Vui lòng thử lại sau.')
      } finally {
        if (cancelled) return
        setSuggestLoading(false)
      }
    }

    fetchSuggestions()
    return () => {
      cancelled = true
    }
  }, [])

  // Click "Tìm phòng" → sang trang SearchPage với query
  const handleSearch = (e) => {
    e.preventDefault()

    const params = new URLSearchParams()
    if (checkIn) params.set('checkIn', checkIn)
    if (checkOut) params.set('checkOut', checkOut)
    if (guests) params.set('capacity', guests)

    navigate(`/search?${params.toString()}`)
  }

  // Click "Đặt phòng" ở card gợi ý → đi thẳng Booking 
  const handleBookSuggested = (room) => {
    if (!room) return

    const roomId = room.room_id || room.id
    if (!roomId) {
      console.warn('Không có room_id trong room:', room)
      return
    }

    const params = new URLSearchParams()
    params.set('room', String(roomId))
    params.set('capacity', String(room.capacity || guests || 2))
    if (checkIn) params.set('checkIn', checkIn)
    if (checkOut) params.set('checkOut', checkOut)

    navigate(`/booking?${params.toString()}`)
  }

  // Xem chi tiết → /rooms/:id
  const handleViewDetail = (room) => {
    if (!room) return
    const id = room.room_id || room.id
    if (!id) return
    navigate(`/rooms/${id}`)
  }

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero + form tìm phòng */}
      <div className="relative">
        <HeroSection />

        <div className="absolute left-0 right-0 bottom-12 flex justify-center z-30">
          <form
            onSubmit={handleSearch}
            data-aos="fade-up"
            data-aos-delay="100"
            className="hero-search-card bg-white/10 backdrop-blur-md border border-cyan-400/40 rounded-2xl shadow-xl px-6 py-4 flex flex-col sm:flex-row gap-4 items-center w-[90%] max-w-4xl"
          >
            {/* Ngày đến */}
            <div className="flex items-center gap-3 flex-1 w-full">
              <div className="flex flex-1 flex-col">
                <div className="flex flex-row items-center justify-start gap-2 mb-[5px]">
                  <FaCalendar className="w-5 h-5 text-cyan-400" />
                  <div className="text-sm text-gray-200 leading-none">
                    Ngày đến
                  </div>
                </div>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="search-field w-full text-black rounded px-2 py-1"
                />
              </div>
            </div>

            {/* Ngày đi */}
            <div className="flex items-center gap-3 flex-1 w-full">
              <div className="flex flex-1 flex-col">
                <div className="flex flex-row items-center justify-start gap-2 mb-[5px]">
                  <FaCalendar className="w-5 h-5 text-cyan-400" />
                  <div className="text-sm text-gray-200 leading-none">
                    Ngày đi
                  </div>
                </div>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="search-field w-full text-black rounded px-2 py-1"
                />
              </div>
            </div>

            {/* Số khách */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex flex-1 flex-col">
                <div className="flex flex-row items-center justify-start gap-2 mb-[5px]">
                  <HiUsers className="w-5 h-5 text-cyan-400" />
                  <div className="text-sm text-gray-200 leading-none">
                    Số khách
                  </div>
                </div>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="search-field w-32 text-black rounded px-2 py-1"
                >
                  <option value="1">1 người</option>
                  <option value="2">2 người</option>
                  <option value="3">3 người</option>
                  <option value="4">4 người</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="luxury-button bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-2 rounded-lg font-medium"
            >
              Tìm phòng
            </button>
          </form>
        </div>
      </div>

      {/* Phần nội dung chính */}
      <main className={isLight ? 'bg-slate-50' : 'bg-dark-900'}>
        {/* Đề xuất cho bạn */}
        <section className="layout-container py-16">
          <div className="flex items-center justify-between pt-16 mb-8" data-aos="fade-up">
            <h2
              className={
                'luxury-header text-3xl font-bold ' +
                (isLight ? 'text-slate-900' : 'text-white')
              }
            >
              Đề xuất cho bạn
            </h2>

            <Link
              to="/search"
              className={
                'inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold transition ' +
                (isLight
                  ? 'border-cyan-600 text-cyan-600 hover:bg-cyan-50'
                  : 'border-white/60 text-white hover:bg-white/10')
              }
            >
              Xem tất cả
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
            {suggestLoading && (
              <p className={isLight ? 'text-slate-600' : 'text-slate-300'}>
                Đang tải gợi ý phòng phù hợp cho bạn...
              </p>
            )}

            {!suggestLoading && suggestError && (
              <p className="col-span-full text-sm text-red-500">
                {suggestError}
              </p>
            )}

            {!suggestLoading &&
              !suggestError &&
              suggestedRooms.length === 0 && (
                <p
                  className={
                    'col-span-full text-sm ' +
                    (isLight ? 'text-slate-600' : 'text-slate-300')
                  }
                >
                  Hiện chưa có gợi ý riêng cho bạn. Hãy thử tìm phòng ở mục
                  tìm kiếm phía trên.
                </p>
              )}

            {!suggestLoading &&
              !suggestError &&
              suggestedRooms.length > 0 &&
              suggestedRooms.map((room, index) => (
                <div
                  key={room.room_id || room.id}
                  data-aos="fade-up"
                  data-aos-delay={Math.min(index * 120, 240)}
                >
                  <SuggestedRoomCard
                    room={room}
                    onBook={handleBookSuggested}
                    onViewDetail={handleViewDetail}
                    isLight={isLight}
                  />
                </div>
              ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
