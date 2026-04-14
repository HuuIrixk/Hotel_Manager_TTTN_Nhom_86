import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthProvider'

export default function Header() {
  const { user, logout } = useAuth() || {}
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const isHotelPage = location.pathname.startsWith('/hotels')
  const isRoomDetailPage = location.pathname.startsWith('/rooms')
  const isBookingPage = location.pathname.startsWith('/booking')
  const isUserPage = location.pathname.startsWith('/user')
  const isPaymentPage = location.pathname.startsWith('/payment')
  const isCartPage = location.pathname.startsWith('/cart')

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80)
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const headerClass =
    isHotelPage ||
    isRoomDetailPage ||
    isBookingPage ||
    isUserPage ||
    isPaymentPage ||
    isCartPage
      ? 'bg-black/80 backdrop-blur-md shadow-md py-3'
      : scrolled
      ? 'bg-black/70 backdrop-blur-md shadow-md py-3'
      : 'bg-black/70 backdrop-blur-md shadow-md py-4'

  return (
    <header
      style={{ position: 'fixed', top: 0, left: 0, right: 0 }}
      className={`z-[9999] transition-all duration-300 ${headerClass} text-white`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between ">
        <div className="flex items-center gap-2">
          <span className="text-2xl"></span>
          <Link
            to="/"
            className="text-xl font-semibold tracking-wide text-cyan-400 hover:text-cyan-300 transition"
          >
            VAA Hotel
          </Link>
        </div>

        <nav className="hidden md:flex gap-8 text-sm font-medium">
          <Link to="/" className="hover:text-cyan-400 transition">
            Trang chủ
          </Link>
          <Link to="/services" className="hover:text-cyan-400 transition">
            Dịch vụ
          </Link>
          <Link to="/search" className="hover:text-cyan-400 transition">
            Tìm phòng
          </Link>
          <Link to="/reviews" className="hover:text-cyan-400 transition">
            Đánh giá
          </Link>
          <Link to="/about" className="hover:text-cyan-400 transition">
            Giới thiệu
          </Link>
          <Link to="/contact" className="hover:text-cyan-400 transition">
            Liên hệ
          </Link>
          <Link
            to="/cart"
            className="hover:text-cyan-400 transition inline-flex items-center gap-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M2.25 3a.75.75 0 000 1.5h1.386c.17 0 .318.114.361.278l2.558 9.594a2.25 2.25 0 002.173 1.668h7.884a2.25 2.25 0 002.173-1.668l1.302-4.883A1.875 1.875 0 0018.279 7.5H6.598l-.387-1.451A1.875 1.875 0 004.636 4.5H2.25zm6.75 15a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm7.5 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
            </svg>
            Giỏ hàng
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link
                to="/user"
                className="text-sm text-gray-100 hover:text-cyan-400 transition"
              >
                Xin chào, {user.username || user.email}
              </Link>
              <button
                onClick={logout}
                className="px-4 py-1.5 text-sm rounded-full border border-cyan-400 hover:bg-cyan-400 hover:text-black transition-colors"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm hover:text-cyan-400 transition">
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="text-sm px-4 py-1.5 rounded-full bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-full border border-white/30"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-black/85 backdrop-blur-lg px-6 pb-6 border-t border-gray-700">
          <ul className="flex flex-col gap-3 text-gray-200 mt-3">
            <Link
              to="/"
              className="hover:text-cyan-400 transition"
              onClick={() => setMenuOpen(false)}
            >
              Trang chủ
            </Link>
            <Link
              to="/services"
              className="hover:text-cyan-400 transition"
              onClick={() => setMenuOpen(false)}
            >
              Dịch vụ
            </Link>
            <Link
              to="/search"
              className="hover:text-cyan-400 transition"
              onClick={() => setMenuOpen(false)}
            >
              Tìm phòng
            </Link>
            <Link
              to="/reviews"
              className="hover:text-cyan-400 transition"
              onClick={() => setMenuOpen(false)}
            >
              Đánh giá
            </Link>
            <Link
              to="/contact"
              className="hover:text-cyan-400 transition"
              onClick={() => setMenuOpen(false)}
            >
              Liên hệ
            </Link>
            <Link
              to="/cart"
              className="hover:text-cyan-400 transition"
              onClick={() => setMenuOpen(false)}
            >
              Giỏ hàng
            </Link>
            <Link
              to="/about"
              className="hover:text-cyan-400 transition"
              onClick={() => setMenuOpen(false)}
            >
              Giới thiệu
            </Link>
            <div className="mt-3 border-t border-gray-700 pt-3">
              {user ? (
                <>
                  <Link
                    to="/user"
                    onClick={() => setMenuOpen(false)}
                    className="block text-sm mb-2 text-cyan-300 hover:text-cyan-200 transition"
                  >
                    Đang đăng nhập: {user.username || user.email}
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                      setMenuOpen(false)
                    }}
                    className="w-full py-2 rounded-lg border-2 border-black bg-cyan-400 text-black text-sm font-semibold hover:bg-cyan-300 transition"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full py-2 rounded-lg bg-cyan-400 text-black text-sm font-medium text-center hover:bg-cyan-300 transition"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full border border-cyan-400 text-cyan-400 text-sm font-medium py-2 rounded-lg hover:bg-cyan-500 hover:text-black transition text-center mt-2"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </ul>
        </div>
      )}
    </header>
  )
}
