// src/pages/UserPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Header from '@/layouts/Header'
import Footer from '@/layouts/Footer'
import { useAuth } from '@/features/auth/AuthProvider'
import { useTheme } from '@/features/theme/ThemeProvider'
import { getProfile, updateProfile, changePassword } from '@/api/authApi'
import { getMyBookings, cancelBooking } from '@/api/bookingApi'

// ===== Nút đổi theme riêng =====
function ThemeToggleButton({ theme, toggleTheme }) {
  const isLight = theme === 'light'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={
        'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium shadow-sm transition ' +
        (isLight
          ? 'bg-white/90 border border-slate-300 text-slate-800 hover:bg-slate-50'
          : 'bg-slate-900/90 border border-slate-600 text-slate-100 hover:bg-slate-800')
      }
    >
      {/* <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> */}
      <span>
        {isLight ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
      </span>
    </button>
  )
}

export default function UserPage() {
  const { isAuthenticated, loading } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('profile')

  // PROFILE
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileMessage, setProfileMessage] = useState('')

  const [showEditModal, setShowEditModal] = useState(false)
  const [editFullName, setEditFullName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

  // BOOKINGS
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingsError, setBookingsError] = useState('')
  const [selectedBookingId, setSelectedBookingId] = useState(null)
  const [bookingActionMessage, setBookingActionMessage] = useState('')

  // redirect nếu chưa login
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  // load profile
  useEffect(() => {
    if (!isAuthenticated || loading || activeTab !== 'profile') return

    const fetchProfile = async () => {
      setProfileLoading(true)
      setProfileError('')
      setProfileMessage('')

      try {
        const data = await getProfile()
        setProfile(data)
      } catch (err) {
        console.error(err)
        setProfileError(
          err?.response?.data?.error || 'Lỗi khi tải thông tin hồ sơ.'
        )
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [isAuthenticated, loading, activeTab])

  // load bookings
  useEffect(() => {
    if (!isAuthenticated || loading || activeTab !== 'bookings') return

    const fetchBookings = async () => {
      setBookingsLoading(true)
      setBookingsError('')
      setBookingActionMessage('')

      try {
        const data = await getMyBookings()
        const all = Array.isArray(data) ? data : []
        setBookings(all)
        if (all.length > 0) {
          setSelectedBookingId(all[0].booking_id)
        }
      } catch (err) {
        console.error(err)
        setBookingsError(
          err?.response?.data?.error || 'Lỗi khi tải lịch sử đặt phòng.'
        )
      } finally {
        setBookingsLoading(false)
      }
    }

    fetchBookings()
  }, [isAuthenticated, loading, activeTab])

  const selectedBooking = useMemo(
    () => bookings.find((b) => b.booking_id === selectedBookingId) || null,
    [bookings, selectedBookingId]
  )

  const formatDate = (value) => {
    if (!value) return 'N/A'
    const d = new Date(value)
    return d.toLocaleDateString('vi-VN')
  }

  const calcNights = (booking) => {
    if (!booking?.check_in || !booking?.check_out) return 0
    const checkIn = new Date(booking.check_in)
    const checkOut = new Date(booking.check_out)
    const diffMs = checkOut.getTime() - checkIn.getTime()
    return diffMs / (1000 * 60 * 60 * 24)
  }

  const formatCurrency = (num) => {
    if (!num || Number.isNaN(Number(num))) return '0₫'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(num))
  }

  const readableBookingStatus = (status) => {
    switch (status) {
      case 'pending':
        return 'Đang chờ'
      case 'confirmed':
        return 'Đã xác nhận'
      case 'cancelled':
        return 'Đã hủy'
      case 'completed':
        return 'Hoàn tất'
      default:
        return status || 'Không rõ'
    }
  }


  const readablePaymentMethod = (payment) => {
    if (!payment) return 'N/A'
    switch (payment.method) {
      case 'vnpay':
        return 'VNPay'
      case 'cash':
      case 'direct':
        return 'Thanh toán trực tiếp'
      default:
        return payment.method
    }
  }

  const canCancelBooking = (booking) => {
    if (!booking) return false
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return false
    }
    const now = new Date()
    const checkIn = new Date(booking.check_in)
    return checkIn.getTime() > now.getTime()
  }

  const totalBookings = bookings.length
  const completedBookings = bookings.filter(
    (b) => b.status === 'completed'
  ).length
  const upcomingBookings = bookings.filter((b) => canCancelBooking(b)).length

  // mở / submit modal sửa info
  const openEditModal = () => {
    if (!profile) return
    setEditFullName(profile.username || '')
    setEditEmail(profile.email || '')
    setEditPhone(profile.phone || '')
    setEditError('')
    setProfileMessage('')
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    if (editSubmitting) return
    setShowEditModal(false)
  }

  const handleSubmitEditProfile = async (e) => {
    e.preventDefault()
    setEditError('')
    setProfileMessage('')

    if (!editFullName.trim()) {
      setEditError('Họ và tên không được để trống.')
      return
    }
    if (!editEmail.trim()) {
      setEditError('Email không được để trống.')
      return
    }

    try {
      setEditSubmitting(true)
      const res = await updateProfile({
        username: editFullName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
      })

      setProfile((prev) => ({
        ...(prev || {}),
        username: res.user?.username || editFullName.trim(),
        email: res.user?.email || editEmail.trim(),
        phone: res.user?.phone || editPhone.trim(),
      }))

      setProfileMessage('Cập nhật thông tin thành công.')
      setShowEditModal(false)
    } catch (err) {
      console.error(err)
      setEditError(
        err?.response?.data?.error || 'Lỗi khi cập nhật thông tin.'
      )
    } finally {
      setEditSubmitting(false)
    }
  }

  // mở / submit modal đổi mật khẩu
  const openPasswordModal = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setPasswordMessage('')
    setShowPasswordModal(true)
  }

  const closePasswordModal = () => {
    if (passwordSubmitting) return
    setShowPasswordModal(false)
  }

  const handleSubmitChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordMessage('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Vui lòng nhập đầy đủ các trường.')
      return
    }

    try {
      setPasswordSubmitting(true)
      const res = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })

      setPasswordMessage(res.message || 'Đổi mật khẩu thành công.')
      setTimeout(() => {
        setShowPasswordModal(false)
      }, 700)
    } catch (err) {
      console.error(err)
      setPasswordError(
        err?.response?.data?.error || 'Lỗi khi đổi mật khẩu.'
      )
    } finally {
      setPasswordSubmitting(false)
    }
  }

  const handleCancelBooking = async (booking) => {
    if (!booking || !canCancelBooking(booking)) return
    try {
      const res = await cancelBooking(booking.booking_id)
      setBookingActionMessage(res.message || 'Hủy đặt phòng thành công.')
      setBookings((prev) =>
        prev.map((b) =>
          b.booking_id === booking.booking_id ? res.booking : b
        )
      )
    } catch (err) {
      console.error(err)
      setBookingActionMessage(
        err?.response?.data?.error || 'Lỗi khi hủy đặt phòng.'
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen app-root flex items-center justify-center">
        Đang tải tài khoản...
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // ===== UI CHÍNH =====
  return (
    <div className="min-h-screen app-root flex flex-col">
      <Header />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-[15px] md:text-[16px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold">
                Tài khoản của tôi
              </h1>
              <p className="text-sm md:text-base text-slate-500 mt-2">
                Quản lý thông tin cá nhân và các đặt phòng đã thực hiện.
              </p>
            </div>

            <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />
          </div>

          {/* tabs */}
          <div className="mb-6">
            <div className="inline-flex rounded-full bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-1.5 text-xs md:text-sm rounded-full ${
                  activeTab === 'profile'
                    ? 'bg-white shadow text-slate-900 font-medium'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Thông tin cá nhân
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bookings')}
                className={`px-4 py-1.5 text-xs md:text-sm rounded-full ${
                  activeTab === 'bookings'
                    ? 'bg-white shadow text-slate-900 font-medium'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Lịch sử đặt phòng
              </button>
            </div>
          </div>

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <section className="app-card p-5 md:p-6 shadow-sm">
              {profileLoading ? (
                <p className="text-sm text-slate-500">Đang tải hồ sơ...</p>
              ) : profileError ? (
                <p className="text-sm text-red-600">{profileError}</p>
              ) : !profile ? (
                <p className="text-sm text-slate-500">
                  Không có thông tin hồ sơ.
                </p>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-cyan-500/10 border border-cyan-400 flex items-center justify-center text-xl md:text-2xl font-semibold text-cyan-600">
                        {(profile.username || profile.email || 'U')
                          .trim()
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Thông tin tài khoản
                        </p>
                        <p className="mt-1 text-xl md:text-2xl font-semibold">
                          {profile.username || 'Chưa có tên'}
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div className="app-soft-card px-4 py-3">
                          <p className="text-xs text-slate-500 mb-1">Email</p>
                          <p className="font-medium">{profile.email}</p>
                        </div>
                        <div className="app-soft-card px-4 py-3">
                          <p className="text-xs text-slate-500 mb-1">
                            Số điện thoại
                          </p>
                          <p className="font-medium">
                            {profile.phone || 'Chưa cập nhật'}
                          </p>
                        </div>
                      </div>

                      {profileMessage && (
                        <p className="text-xs text-emerald-600">
                          {profileMessage}
                        </p>
                      )}
                    </div>

                    <div className="w-full md:w-56 space-y-2 text-sm">
                      <div className="app-soft-card px-4 py-3">
                        <p className="text-xs text-slate-500 mb-1">
                          Tổng số đặt phòng
                        </p>
                        <p className="font-semibold">{totalBookings}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="app-soft-card px-3 py-2">
                          <p className="text-[11px] text-slate-500 mb-1">
                            Đã hoàn tất
                          </p>
                          <p className="font-semibold text-emerald-600">
                            {completedBookings}
                          </p>
                        </div>
                        <div className="app-soft-card px-3 py-2">
                          <p className="text-[11px] text-slate-500 mb-1">
                            Sắp diễn ra
                          </p>
                          <p className="font-semibold text-sky-600">
                            {upcomingBookings}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={openEditModal}
                      className="px-5 py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-sm font-semibold text-black"
                    >
                      Thay đổi thông tin
                    </button>
                    <button
                      type="button"
                      onClick={openPasswordModal}
                      className="px-5 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-800"
                    >
                      Đổi mật khẩu
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          {/* BOOKINGS TAB */}
          {activeTab === 'bookings' && (
            <section className="grid md:grid-cols-[1.5fr_1.2fr] gap-6">
              <div className="app-card p-4 md:p-5 shadow-sm">
                <h2 className="text-lg font-semibold mb-3">Lịch sử đặt phòng</h2>
                {bookingsLoading ? (
                  <p className="text-sm text-slate-500">
                    Đang tải danh sách đặt phòng...
                  </p>
                ) : bookingsError ? (
                  <p className="text-sm text-red-600">{bookingsError}</p>
                ) : bookings.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Bạn chưa có đơn đặt phòng nào.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                    {bookings.map((b) => {
                      const isActive = b.booking_id === selectedBookingId
                      const statusLabel = readableBookingStatus(b.status)
                      let badgeClass =
                        'bg-slate-200 text-slate-700 border-slate-300'
                      if (b.status === 'pending')
                        badgeClass = 'bg-cyan-100 text-cyan-700 border-cyan-200'
                      if (b.status === 'confirmed')
                        badgeClass = 'bg-sky-100 text-sky-700 border-sky-200'
                      if (b.status === 'completed')
                        badgeClass =
                          'bg-emerald-100 text-emerald-700 border-emerald-200'
                      if (b.status === 'cancelled')
                        badgeClass = 'bg-red-100 text-red-700 border-red-200'

                      return (
                        <button
                          key={b.booking_id}
                          type="button"
                          onClick={() => setSelectedBookingId(b.booking_id)}
                          className={`w-full text-left rounded-lg border px-3 py-2 text-sm flex items-start gap-3 ${
                            isActive
                              ? 'border-cyan-400 bg-cyan-50'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <p className="font-medium text-slate-900">
                                {b.Room?.name ||
                                  `Phòng #${b.Room?.room_number || 'N/A'}`}
                              </p>
                              <span
                                className={
                                  'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ' +
                                  badgeClass
                                }
                              >
                                {statusLabel}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Mã booking: {b.booking_id}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {formatDate(b.check_in)} →{' '}
                              {formatDate(b.check_out)} ·{' '}
                              <span className="text-cyan-600">
                                {calcNights(b)} đêm
                              </span>
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="app-card p-4 md:p-5 shadow-sm">
                <h2 className="text-lg font-semibold mb-3">Chi tiết đơn</h2>
                {!selectedBooking ? (
                  <p className="text-sm text-slate-500">
                    Chọn một đơn ở bên trái để xem chi tiết.
                  </p>
                ) : (
                  <>
                    <div className="space-y-1 text-sm">
                      <p className="flex justify-between">
                        <span className="text-slate-600">Mã booking</span>
                        <span className="font-medium">
                          {selectedBooking.booking_id}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-600">Phòng</span>
                        <span className="font-medium">
                          {selectedBooking.Room?.name ||
                            `Phòng #${
                              selectedBooking.Room?.room_number || 'N/A'
                            }`}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-600">Check-in</span>
                        <span>{formatDate(selectedBooking.check_in)}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-600">Check-out</span>
                        <span>{formatDate(selectedBooking.check_out)}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-600">Số đêm</span>
                        <span>{calcNights(selectedBooking)}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-600">Giá / đêm</span>
                        <span>
                          {formatCurrency(
                            selectedBooking.Room?.price || 0
                          )}
                        </span>
                      </p>
                      <p className="flex justify-between font-semibold pt-1">
                        <span>Tạm tính</span>
                        <span className="text-cyan-600">
                          {formatCurrency(
                            calcNights(selectedBooking) *
                              (selectedBooking.Room?.price || 0)
                          )}
                        </span>
                      </p>
                    </div>

                    <div className="border-t border-slate-200 my-3" />

                    <div className="space-y-1 text-sm">
                      <p className="flex justify-between">
                        <span className="text-slate-600">Trạng thái đơn</span>
                        <span className="font-medium">
                          {readableBookingStatus(selectedBooking.status)}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-600">Phương thức</span>
                        <span className="font-medium">
                          {readablePaymentMethod(selectedBooking.Payment)}
                        </span>
                      </p>
                    </div>

                    {bookingActionMessage && (
                      <p className="text-xs text-cyan-600 mt-1">
                        {bookingActionMessage}
                      </p>
                    )}

                    {canCancelBooking(selectedBooking) && (
                      <button
                        type="button"
                        onClick={() =>
                          handleCancelBooking(selectedBooking)
                        }
                        className="mt-3 w-full px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-xs font-semibold text-white"
                      >
                        Hủy đơn đặt phòng
                      </button>
                    )}
                  </>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* MODAL EDIT PROFILE */}
      {showEditModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 p-5">
            <h2 className="text-lg font-semibold mb-4">
              Thay đổi thông tin
            </h2>

            <form onSubmit={handleSubmitEditProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>

              {editError && (
                <p className="text-xs text-red-600">{editError}</p>
              )}

              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={editSubmitting}
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-xs font-semibold text-black"
                >
                  {editSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHANGE PASSWORD */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 p-5">
            <h2 className="text-lg font-semibold mb-4">Đổi mật khẩu</h2>

            <form
              onSubmit={handleSubmitChangePassword}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {passwordError && (
                <p className="text-xs text-red-600">{passwordError}</p>
              )}
              {passwordMessage && (
                <p className="text-xs text-emerald-600">
                  {passwordMessage}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={passwordSubmitting}
                  onClick={closePasswordModal}
                  className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="px-5 py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-xs font-semibold text-black"
                >
                  {passwordSubmitting ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
