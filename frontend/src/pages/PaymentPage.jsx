// src/pages/PaymentPage.jsx
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'

import Header from '@/layouts/Header'
import Footer from '@/layouts/Footer'
import { createVnpayPayment } from '@/api/paymentApi'
import { createBooking } from '@/api/bookingApi'

export default function PaymentPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  // New flow: booking data passed via router state from BookingPage
  const stateData = location.state || {}
  const bookingPayload = stateData.bookingPayload || null
  const amount = stateData.amount || Number(searchParams.get('amount') || 0)
  const room = stateData.roomName || searchParams.get('room') || ''

  // Legacy fallback: bookingId already in URL (e.g. direct navigation)
  const bookingIdFromUrl = searchParams.get('bookingId') || null

  const [method, setMethod] = useState('vnpay')   // default: VNPay
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
  }, [])

  // If navigated here directly without booking data, send back to search
  useEffect(() => {
    if (!bookingPayload && !bookingIdFromUrl) {
      navigate('/search', { replace: true })
    }
  }, [bookingPayload, bookingIdFromUrl, navigate])

  const formatCurrency = (num) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      setLoading(true)

      if (method === 'vnpay') {
        const payload = bookingPayload
          ? bookingPayload
          : { booking_id: Number(bookingIdFromUrl) }

        const res = await createVnpayPayment(payload)
        if (res.data?.paymentUrl) {
          window.location.href = res.data.paymentUrl
        } else {
          setError('Không nhận được URL thanh toán từ server.')
        }
      } else if (method === 'direct') {
        if (!bookingPayload) {
          setError('Thiếu thông tin đặt phòng, vui lòng quay lại đặt phòng lại.')
          return
        }

        const res = await createBooking(bookingPayload)
        const booking = res.booking || res.data?.booking || res
        const query = new URLSearchParams({
          bookingId: booking?.booking_id?.toString() || '',
          amount:
            res.totalAmount != null ? String(res.totalAmount) : String(amount || 0),
          method: 'direct',
          success: 'true',
          message: 'DirectBookingPending',
        }).toString()
        navigate(`/booking-result?${query}`)
      } else {
        if (method === 'bank') setSuccess('Vui lòng chuyển khoản theo thông tin hiển thị.')
        else if (method === 'momo') setSuccess('Vui lòng quét mã MoMo để thanh toán.')
      }
    } catch (err) {
      console.error(err)
      const msg =
        err?.response?.data?.error || 'Thanh toán thất bại, vui lòng thử lại.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="relative min-h-screen bg-[#050816] text-white">
      <Header />
      <main className="relative z-10 pt-32 pb-24 container mx-auto px-6 flex flex-col items-center">
        <h1
          className="text-4xl md:text-5xl font-[Playfair_Display] text-cyan-400 font-bold mb-8 drop-shadow-[0_2px_10px_rgba(34,211,238,0.5)]"
          data-aos="fade-down"
        >
          Thanh toán đặt phòng
        </h1>

        <div
          className="w-full max-w-2xl bg-white/10 backdrop-blur-lg border border-cyan-400/20 rounded-2xl p-8 shadow-[0_0_25px_rgba(34,211,238,0.15)]"
          data-aos="fade-up"
        >
          <div className="mb-8 text-center">
            <p className="text-gray-300">
              Phòng: {room || 'Chưa rõ'}
            </p>
            <h2 className="text-4xl text-cyan-400 font-semibold mt-2">
              {formatCurrency(amount)}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              (Tổng tiền dự kiến – đã tính số đêm, bao gồm thuế & phí dịch vụ)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div data-aos="fade-right">
              <h3 className="text-lg font-semibold text-cyan-400 mb-3">
                Chọn phương thức thanh toán:
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <label
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                    method === 'vnpay'
                      ? 'bg-cyan-400/10 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                      : 'bg-white/5 border-gray-600 hover:border-cyan-400/60'
                  }`}
                  onClick={() => setMethod('vnpay')}
                >
                  <span className="text-sm font-medium">
                    Thanh toán qua VNPay
                  </span>
                </label>

                <label
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                    method === 'direct'
                      ? 'bg-cyan-400/10 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                      : 'bg-white/5 border-gray-600 hover:border-cyan-400/60'
                  }`}
                  onClick={() => setMethod('direct')}
                >
                  <span className="text-sm font-medium">
                    Thanh toán trực tiếp tại khách sạn
                  </span>
                </label>
              </div>
            </div>

            {method === 'vnpay' && (
              <div
                className="bg-black/30 p-5 rounded-lg border border-cyan-400/20"
                data-aos="zoom-in"
              >
                <h4 className="text-cyan-400 font-semibold mb-2">
                  VNPay - Cổng thanh toán trực tuyến
                </h4>
                <p className="text-gray-300 text-sm">
                  Bạn sẽ được chuyển hướng đến cổng VNPay để xác nhận thanh
                  toán.
                </p>
              </div>
            )}

            {method === 'direct' && (
              <div
                className="bg-black/30 p-5 rounded-lg border border-cyan-400/20"
                data-aos="zoom-in"
              >
                <h4 className="text-cyan-400 font-semibold mb-2">
                  Thanh toán trực tiếp tại khách sạn
                </h4>
                <p className="text-gray-300 text-sm">
                  Hệ thống sẽ tạo đơn ở trạng thái chờ. Bạn thanh toán tại quầy
                  lễ tân khi đến khách sạn.
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-600/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {success && (
              <p className="text-sm text-emerald-300 bg-emerald-950/40 border border-emerald-600/40 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            <div className="text-center pt-4" data-aos="fade-up">
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-3 bg-gradient-to-r from-cyan-400 to-cyan-500 text-black font-semibold rounded-lg hover:scale-105 hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-all duration-300 disabled:opacity-60"
              >
                {loading
                  ? 'Đang xử lý...'
                  : method === 'vnpay'
                  ? 'Thanh toán qua VNPay'
                  : 'Xác nhận đặt phòng'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
