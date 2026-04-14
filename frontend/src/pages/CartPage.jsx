import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'

import Header from '@/layouts/Header'
import Footer from '@/layouts/Footer'
import { getMyCart, removeCartItem } from '@/api/cartApi'

function formatCurrency(num) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(num || 0))
}

function calcNights(checkIn, checkOut) {
  const ci = new Date(checkIn)
  const co = new Date(checkOut)
  const diff = co.getTime() - ci.getTime()
  return diff > 0 ? diff / (1000 * 60 * 60 * 24) : 0
}

export default function CartPage() {
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    document.title = 'Giỏ hàng | VAA Hotel'
  }, [])

  const fetchCart = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getMyCart()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.error || 'Không thể tải dữ liệu giỏ hàng.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [])

  useEffect(() => {
    AOS.refreshHard()
  }, [loading, items.length, error])

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const nights = calcNights(item.check_in, item.check_out)
      const price = Number(item.Room?.price || 0)
      return sum + nights * price
    }, 0)
  }, [items])

  const handleRemove = async (itemId) => {
    try {
      await removeCartItem(itemId)
      setItems((prev) => prev.filter((x) => x.cart_item_id !== itemId))
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.error || 'Không thể xóa phòng khỏi giỏ hàng.')
    }
  }

  const handlePayNow = (item) => {
    const nights = calcNights(item.check_in, item.check_out)
    const amount = nights * Number(item.Room?.price || 0)

    const bookingPayload = {
      cart_item_id: item.cart_item_id,
      room_id: item.room_id,
      check_in: new Date(item.check_in).toISOString().slice(0, 10),
      check_out: new Date(item.check_out).toISOString().slice(0, 10),
      guests: item.guests,
      full_name: item.full_name,
      email: item.email,
      phone: item.phone,
      note: item.note || '',
    }

    navigate('/payment', {
      state: {
        bookingPayload,
        amount,
        roomName:
          item.Room?.name || `Phòng #${item.Room?.room_number || item.room_id}`,
      },
    })
  }

  return (
    <div className="min-h-screen app-root">
      <Header />

      <main className="pt-28 pb-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8" data-aos="fade-down">
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">
              Giỏ hàng của bạn
            </h1>
            <p className="text-slate-600 mt-3 text-sm md:text-base">
              Bạn có thể lưu nhiều phòng trước, sau đó chọn thanh toán từng phòng.
            </p>
          </div>

          {error && (
            <p className="mb-5 text-sm text-red-300 bg-red-950/40 border border-red-600/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-slate-600 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              Đang tải giỏ hàng...
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <p className="text-slate-600 mb-5">Giỏ hàng hiện chưa có phòng nào.</p>
              <button
                type="button"
                onClick={() => navigate('/search')}
                className="px-6 py-2.5 rounded-lg bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition"
              >
                Đi tìm phòng ngay
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {items.map((item, index) => {
                const nights = calcNights(item.check_in, item.check_out)
                const roomPrice = Number(item.Room?.price || 0)
                const amount = nights * roomPrice

                return (
                  <article
                    key={item.cart_item_id}
                    data-aos="fade-up"
                    data-aos-delay={Math.min(index * 80, 320)}
                    className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="space-y-1">
                        <h2 className="text-xl font-bold text-slate-900">
                          {item.Room?.name ? (
                            item.Room.name
                          ) : (
                            <>
                              Phòng <span className="font-extrabold text-slate-950">{item.Room?.room_number || item.room_id}</span>
                            </>
                          )}
                        </h2>
                        <p className="text-sm text-slate-600">
                          Số người: {item.guests}
                        </p>
                        <p className="text-sm text-slate-600">
                          Số đêm: {nights}
                        </p>
                        <p className="text-sm text-slate-600">
                          Người đặt: {item.full_name}
                        </p>
                        <p className="text-sm text-slate-600">
                          Số điện thoại: {item.phone}
                        </p>
                        <p className="text-sm text-slate-600">
                          Ngày nhận phòng: {new Date(item.check_in).toISOString().slice(0, 10)} | Ngày trả phòng: {new Date(item.check_out).toISOString().slice(0, 10)}
                        </p>
                        {item.note && (
                          <p className="text-sm text-slate-500">Ghi chú: {item.note}</p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-slate-500">Tạm tính</p>
                        <p className="text-2xl font-bold text-cyan-600">{formatCurrency(amount)}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handlePayNow(item)}
                        className="px-5 py-2.5 rounded-lg border border-cyan-400 text-cyan-600 font-semibold hover:bg-cyan-50 transition"
                      >
                        Thanh toán phòng này
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.cart_item_id)}
                        className="px-5 py-2.5 rounded-lg border border-red-400 text-red-500 hover:bg-red-50 transition"
                      >
                        Xóa khỏi giỏ hàng
                      </button>
                    </div>
                  </article>
                )
              })}

              <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div>
                  <p className="text-sm text-slate-600">Tổng giá trị giỏ hàng</p>
                  <p className="text-3xl font-bold text-cyan-600">{formatCurrency(totalAmount)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/search')}
                  className="px-5 py-2.5 rounded-lg border border-cyan-400 text-cyan-600 hover:bg-cyan-50 transition"
                >
                  Thêm phòng khác
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
