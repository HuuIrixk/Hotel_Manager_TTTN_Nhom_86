import { useState, useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Header from '@/layouts/Header'
import Footer from '@/layouts/Footer'
import { searchRooms } from '@/api/roomApi'
import { useNavigate, useLocation } from 'react-router-dom'

export default function SearchPage() {
  const [filters, setFilters] = useState({
    type: '',
    minPrice: '',
    maxPrice: '',
    capacity: '',
    checkIn: '',
    checkOut: '',
  })
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
  const API_ORIGIN = API_BASE.replace(/\/api$/, '');

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
  }, [])


  const handleChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleSearch = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    setHasSearched(true)
    setError('')
    setLoading(true)

    try {
      const data = await searchRooms({
        type: filters.type || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        capacity: filters.capacity || undefined,
        checkIn: filters.checkIn || undefined,
        checkOut: filters.checkOut || undefined,
      })
      setRooms(data)
    } catch (err) {
      console.error(err)
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Lỗi khi tìm phòng'
      )
    } finally {
      setLoading(false)
    }
  }

  // Load tất cả phòng khi vào trang
  useEffect(() => {
    const params = new URLSearchParams(location.search)

    const initialFromQuery = {
      type: params.get('type') || '',
      minPrice: params.get('minPrice') || '',
      maxPrice: params.get('maxPrice') || '',
      capacity: params.get('capacity') || '',
      checkIn: params.get('checkIn') || '',
      checkOut: params.get('checkOut') || '',
    }

    const hasAnyFilter = Object.values(initialFromQuery).some(Boolean)

    if (hasAnyFilter) {
      // Đổ giá trị query vào form filter
      setFilters((prev) => ({
        ...prev,
        ...initialFromQuery,
      }))

      // Search luôn theo filter từ query
      const doSearch = async () => {
        setHasSearched(true)
        setError('')
        setLoading(true)
        try {
          const data = await searchRooms({
            type: initialFromQuery.type || undefined,
            minPrice: initialFromQuery.minPrice || undefined,
            maxPrice: initialFromQuery.maxPrice || undefined,
            capacity: initialFromQuery.capacity || undefined,
            checkIn: initialFromQuery.checkIn || undefined,
            checkOut: initialFromQuery.checkOut || undefined,
          })
          setRooms(data)
        } catch (err) {
          console.error(err)
          setError(
            err?.response?.data?.error ||
              err?.response?.data?.message ||
              'Lỗi khi tìm phòng'
          )
        } finally {
          setLoading(false)
        }
      }

      doSearch()
    } else {
      // Không có query → giữ behavior cũ: load tất cả
      handleSearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  const handleBook = (room) => {
    navigate(`/booking?room=${room.room_id}&amount=${Number(room.price || 0)}`)
  }

  return (
    <div className="relative min-h-screen bg-[url('frontend/public/images/tim-phong.jpg')] bg-cover bg-center text-white">
      {/* overlay mờ */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />

      <Header />

      <main className="relative z-10 max-w-6xl mx-auto px-4 pt-32 pb-24 space-y-10">
        {/* Hero */}
        <section className="text-center mb-4" data-aos="fade-down">
          <h1 className="text-4xl md:text-5xl font-[Playfair_Display] font-bold text-cyan-400 drop-shadow-[0_2px_10px_rgba(34,211,238,0.6)]">
            Tìm phòng khách sạn
          </h1>
          <p className="mt-4 text-gray-300 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Chọn ngày lưu trú và điều kiện phù hợp để tìm phòng{' '}
            <span className="text-cyan-400 font-semibold">
              VAA Hotel
            </span>{' '}
            dành riêng cho bạn.
          </p>
        </section>

        {/* Bộ lọc */}
        <form
          onSubmit={handleSearch}
          data-aos="fade-up"
          className="bg-white/10 backdrop-blur-md border border-cyan-400/20 rounded-2xl shadow-[0_0_25px_rgba(15,23,42,0.6)] p-4 md:p-6 space-y-4"
        >
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">
                Loại phòng
              </label>
              <select
                name="type"
                value={filters.type}
                onChange={handleChange}
                className="w-full rounded-lg bg-black/30 border border-white/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              >
                <option value="">Tất cả</option>
                <option value="Standard">Standard</option>
                <option value="VIP">VIP</option>
                <option value="Suite">Suite</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">
                Giá thấp nhất (VND)
              </label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleChange}
                className="w-full rounded-lg bg-black/30 border border-white/20 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                min={0}
                placeholder="Ví dụ: 1.000.000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">
                Giá cao nhất (VND)
              </label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleChange}
                className="w-full rounded-lg bg-black/30 border border-white/20 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                min={0}
                placeholder="Ví dụ: 3.000.000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">
                Số người
              </label>
              <input
                type="number"
                name="capacity"
                value={filters.capacity}
                onChange={handleChange}
                className="w-full rounded-lg bg-black/30 border border-white/20 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                min={1}
                placeholder="Ví dụ: 2"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">
                Ngày nhận phòng
              </label>
              <input
                type="date"
                name="checkIn"
                value={filters.checkIn}
                onChange={handleChange}
                className="w-full rounded-lg bg-black/30 border border-white/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">
                Ngày trả phòng
              </label>
              <input
                type="date"
                name="checkOut"
                value={filters.checkOut}
                onChange={handleChange}
                className="w-full rounded-lg bg-black/30 border border-white/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/50 border border-red-500/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-center md:justify-start">
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500 font-semibold text-black shadow-[0_18px_35px_rgba(34,211,238,0.55)] hover:shadow-[0_22px_45px_rgba(34,211,238,0.8)] transition-all duration-300 disabled:opacity-60"
            >
              {loading ? 'Đang tìm...' : 'Tìm phòng phù hợp'}
            </button>
          </div>
        </form>

        {/* Kết quả */}
        <section className="space-y-3" data-aos="fade-up" data-aos-delay="100">
          {rooms.length === 0 && !loading && hasSearched && (
            <p className="text-sm text-gray-300">
              Không tìm thấy phòng phù hợp. Thử nới lỏng điều kiện hoặc chọn lại
              ngày khác nhé.
            </p>
          )}

          <div className="grid md:grid-cols-3 gap-5">
            {rooms.map((room, index) => (
              <div
                key={room.room_id}
                data-aos="zoom-in-up"
                data-aos-delay={Math.min(index * 80, 320)}
                className="bg-white/10 backdrop-blur-md border border-cyan-400/20 rounded-xl overflow-hidden flex flex-col shadow-[0_0_20px_rgba(15,23,42,0.8)]"
              >
                <div className="w-full h-40 bg-slate-200/20 overflow-hidden flex items-center justify-center">
                  {room.image_url ? (
                    <img
                      src={
                        room.image_url.startsWith('http')
                          ? room.image_url
                          : `${API_ORIGIN}${room.image_url}`
                      }
                      alt={room.room_number}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-200">
                      Ảnh phòng đang cập nhật
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-1 flex-1 flex flex-col">
                  <h2 className="font-semibold text-cyan-300">
                    Phòng {room.room_number || room.room_id}
                  </h2>
                  <p className="text-sm text-gray-200">
                    Loại: {room.type || 'Không xác định'}
                  </p>
                  <p className="text-sm text-gray-200">
                    Giá:{' '}
                    {room.price
                      ? room.price.toLocaleString('vi-VN') + ' đ / đêm'
                      : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-200">
                    Sức chứa: {room.capacity || 0} người
                  </p>

                  <div className="mt-3 flex gap-4">
                    <button
                      onClick={() => handleBook(room)}
                      className="text-sm font-semibold text-cyan-400 underline"
                    >
                      Đặt phòng
                    </button>

                    <button
                      onClick={() => navigate(`/rooms/${room.room_id}`)}
                      className="text-sm text-gray-200 underline"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
