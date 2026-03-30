import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import Header from '@/layouts/Header'
import Footer from '@/layouts/Footer'
import { useAuth } from '@/features/auth/AuthProvider'
// ĐỔI: dùng API lấy phòng theo số phòng
import { getRoomByNumber } from '@/api/roomApi'
import { validateBooking } from '@/api/bookingApi'

function normalizeQueryDate(value) {
  if (!value) return ''

  const now = new Date()
  const currentYear = now.getFullYear()
  const todayMid = new Date(currentYear, now.getMonth(), now.getDate()).getTime()

  let d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''

  // nếu năm < năm hiện tại → đổi thành năm hiện tại
  if (d.getFullYear() < currentYear) {
    d.setFullYear(currentYear)
  }

  // nếu ngày nằm trước hôm nay → chuyển sang năm sau
  if (d.getTime() < todayMid) {
    d.setFullYear(currentYear + 1)
  }

  return d.toISOString().slice(0, 10)
}

export default function BookingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth() // lấy user từ Auth
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
  const API_ORIGIN = API_BASE.replace(/\/api$/, '')

  const searchParams = new URLSearchParams(location.search)
  // THỰC CHẤT đây là room_number do AI gửi
  const roomId = searchParams.get('room')
  const amountFromQuery = searchParams.get('amount')

  const rawCheckIn = searchParams.get('checkIn')
  const rawCheckOut = searchParams.get('checkOut')

  const [room, setRoom] = useState(null)
  const [roomLoading, setRoomLoading] = useState(false)
  const [roomError, setRoomError] = useState('')

  // FIX: Normalize date đầu vào
  const [checkIn, setCheckIn] = useState(() => normalizeQueryDate(rawCheckIn))
  const [checkOut, setCheckOut] = useState(() => normalizeQueryDate(rawCheckOut))

  const [guests, setGuests] = useState(searchParams.get('capacity') || '1')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    document.title = 'Đặt phòng | VAA Hotel'
  }, [])

  // autofill từ user khi có
  useEffect(() => {
    if (!user) return
    setFullName((prev) => prev || user.username || '')
    setEmail((prev) => prev || user.email || '')
    setPhone((prev) => prev || user.phone || '')
  }, [user])



  // tải thông tin phòng theo SỐ PHÒNG trong query
  useEffect(() => {
    if (!roomId) {
      setRoom(null)
      setRoomError(
        'Không có phòng nào được chọn. Vui lòng quay lại trang tìm phòng hoặc chatbot để chọn phòng trước khi đặt.'
      )
      return
    }

    const fetchRoom = async () => {
      setRoomLoading(true)
      setRoomError('')
      try {
        // Lấy phòng theo room_number
        const data = await getRoomByNumber(roomId)
        setRoom(data)
      } catch (err) {
        console.error(err)
        setRoomError(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            'Không tải được thông tin phòng.'
        )
      } finally {
        setRoomLoading(false)
      }
    }
    fetchRoom()
  }, [roomId])

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0
    const ci = new Date(checkIn)
    const co = new Date(checkOut)
    const diff = co.getTime() - ci.getTime()
    return diff > 0 ? diff / (1000 * 60 * 60 * 24) : 0
  }, [checkIn, checkOut])

  const estimatedTotal = useMemo(() => {
    if (!room || nights <= 0) return 0
    return nights * (room.price || 0)
  }, [room, nights])

  const roomImageSrc = useMemo(() => {
    const rawImage = room?.image_url || room?.image
    if (!rawImage) return '/images/superior-room.jpg'

    if (rawImage.startsWith('http')) return rawImage
    if (rawImage.startsWith('/images/')) return rawImage

    if (rawImage.startsWith('/')) {
      return `${API_ORIGIN}${rawImage}`
    }

    return `${API_ORIGIN}/${rawImage}`
  }, [room, API_ORIGIN])

  const formatCurrency = (num) => {
    if (!num || Number.isNaN(Number(num))) return '0₫'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(num))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    // cần có room + room_id thật trong DB
    if (!room || !room.room_id || roomError) {
      setError(
        'Thiếu hoặc không tải được thông tin phòng. Vui lòng quay lại chọn phòng rồi thử lại.'
      )
      return
    }

    if (!checkIn || !checkOut) {
      setError('Vui lòng chọn ngày nhận phòng và trả phòng.')
      return
    }

    const bookingPayload = {
      room_id: Number(room.room_id),
      check_in: checkIn,
      check_out: checkOut,
      guests: Number(guests),
      full_name: fullName,
      email,
      phone,
      note,
    }

    try {
      setSubmitting(true)
      await validateBooking(bookingPayload)

      navigate('/payment', {
        state: {
          bookingPayload,
          amount: estimatedTotal,
          roomName: room.name || `Phòng #${room.room_number || room.room_id}`,
        },
      })
    } catch (err) {
      console.error(err)
      setError(
        err?.response?.data?.error ||
          'Không thể kiểm tra tình trạng phòng. Vui lòng thử lại.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen app-root">
      <Header />

      <main className="pt-28 pb-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          {/* header nhỏ */}
          <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-1">
                Bước 2 / 3
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
                Xác nhận đặt phòng
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-500">
              Kiểm tra lại thông tin trước khi tiếp tục tới bước thanh toán.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_18px_40px_rgba(15,23,42,0.08)] px-4 py-5 md:px-8 md:py-7">
            <div className="grid md:grid-cols-[1.7fr_1.3fr] gap-10 items-start">
              {/* Form bên trái */}
              <section>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Thông tin khách hàng
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full text-black border border-slate-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 bg-white"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full text-black border border-slate-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 bg-white"
                        placeholder="09xxxxxxxx"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-black border border-slate-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 bg-white"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Số khách
                      </label>
                      <select
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        className="w-full text-black border border-slate-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 bg-white"
                      >
                        <option value="1">1 khách</option>
                        <option value="2">2 khách</option>
                        <option value="3">3 khách</option>
                        <option value="4">4 khách</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Ngày nhận phòng
                      </label>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="w-full text-black border border-slate-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Ngày trả phòng
                      </label>
                      <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full text-black border border-slate-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Ghi chú cho khách sạn (tuỳ chọn)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      className="w-full text-black border border-slate-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 bg-white"
                      placeholder="Ví dụ: check-in muộn, yêu cầu giường phụ..."
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}
                  {message && (
                    <p className="text-sm text-emerald-600">{message}</p>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full md:w-auto px-6 py-2.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-sm font-semibold text-black transition disabled:opacity-60"
                    >
                      {submitting ? 'Đang kiểm tra phòng...' : 'Tiếp tục tới thanh toán'}
                    </button>
                  </div>
                </form>
              </section>

              {/* Tóm tắt bên phải */}
              <aside className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <h2 className="text-lg font-semibold text-slate-900 mb-3">
                    Tóm tắt đặt phòng
                  </h2>

                  {roomLoading ? (
                    <p className="text-sm text-slate-500">
                      Đang tải thông tin phòng...
                    </p>
                  ) : roomError ? (
                    <p className="text-sm text-red-600">{roomError}</p>
                  ) : room ? (
                    <>
                      <div className="flex gap-3 mb-3">
                        <div className="w-20 h-20 rounded-md overflow-hidden bg-slate-200">
                          <img
                            src={roomImageSrc}
                            alt={room.name || 'Room'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/images/superior-room.jpg'
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-slate-900">
                            {room.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Phòng: {room.room_number || 'N/A'}
                          </p>
                          <p className="text-xs text-slate-500">
                            Loại: {room.type || 'Standard'}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 my-3" />

                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">
                            Ngày nhận phòng
                          </span>
                          <span>{checkIn || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">
                            Ngày trả phòng
                          </span>
                          <span>{checkOut || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Số đêm</span>
                          <span>{nights || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Giá / đêm</span>
                          <span>
                            {room.price
                              ? formatCurrency(room.price)
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold pt-2">
                          <span>Tạm tính</span>
                          <span className="text-cyan-600">
                            {formatCurrency(estimatedTotal)}
                          </span>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-slate-500">
                        Số tiền cuối cùng sẽ được tính chính xác ở bước thanh
                        toán dựa trên giá phòng và số đêm thực tế.
                      </p>
                    </>
                  ) : null}
                </div>

                {amountFromQuery && (
                  <div className="rounded-xl bg-slate-100 px-4 py-3 text-xs text-slate-600">
                    <p>
                      Số tiền nhận từ trang trước:{' '}
                      <span className="font-semibold">
                        {formatCurrency(amountFromQuery)}
                      </span>
                    </p>
                    <p>Backend vẫn sẽ tính lại để đảm bảo chính xác.</p>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
