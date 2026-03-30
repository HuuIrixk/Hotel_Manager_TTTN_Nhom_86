import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword } from '@/api/authApi'
import '@/styles/auth.css'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.includes('@')) {
      setError('Email không hợp lệ')
      return
    }

    try {
      setLoading(true)
      setError('')
      const res = await forgotPassword(email)
      
      const url = new URL(res.resetUrl)
      const token = url.searchParams.get('token')

      navigate('/otp', { state: { email, token } })
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="auth-container"
      style={{ backgroundImage: `url('/images/bg-login.jpg')` }}
    >
      <div className="auth-overlay" />
      <div className="auth-box">
        <div className="title relative flex items-center justify-center w-full">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-0 p-2 mb-3 rounded-full border border-gray-200 text-gray-600 hover:text-black hover:border-gray-400 transition"
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="auth-title">Quên mật khẩu</h1>
        </div>

        <p className="text-gray-500 text-center mb-6 text-sm">
          Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className={`auth-submit ${loading ? 'auth-submit-disabled' : ''}`}
          >
            {loading ? 'Đang xử lý...' : 'Tiếp tục'}
          </button>
        </form>

        <div className="auth-subtext">
          Quay lại{' '}
          <Link to="/login" className="auth-link">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}
