import { useState, useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Header from '@/layouts/Header'
import Footer from '@/layouts/Footer'
import { useAuth } from '@/features/auth/AuthProvider'

const DEFAULT_REVIEWS = [
  {
    name: 'Nguyễn Minh Khang',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    rating: 5,
    comment:
      'Dịch vụ cực kỳ tuyệt vời! Nhân viên thân thiện, đồ ăn ngon và không gian sang trọng. Mình sẽ quay lại lần nữa!',
    date: '02/03/2026',
  },
  {
    name: 'Trần Thảo Vy',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: 4,
    comment:
      'Khách sạn sạch sẽ, view hồ bơi đẹp. Mình thích cách decor ở đây, vừa hiện đại vừa tinh tế.',
    date: '26/02/2026',
  },
  {
    name: 'Lê Quốc Anh',
    avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
    rating: 5,
    comment:
      'Không gian yên tĩnh, chất lượng phục vụ tuyệt hảo. Mình ấn tượng với bữa sáng tự chọn phong phú.',
    date: '10/01/2026',
  },
]

export default function Reviews() {
  const { user } = useAuth() || {}
  const [reviews, setReviews] = useState(DEFAULT_REVIEWS)
  const [newReview, setNewReview] = useState({ name: '', comment: '', rating: 5 })
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    document.title = "Đánh giá | VAA Hotel";
  }, []);

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!user) {
      setAuthError('Vui lòng đăng nhập để tiếp tục.')
      return
    }
    setAuthError('')
    if (!newReview.name || !newReview.comment) return alert('Vui lòng nhập đầy đủ thông tin!')
    setReviews([{ ...newReview, date: new Date().toLocaleDateString(), avatar: 'https://randomuser.me/api/portraits/men/10.jpg' }, ...reviews])
    setNewReview({ name: '', comment: '', rating: 5 })
  }

  return (
    <div className="relative min-h-screen bg-[url('frontend/public/images/danh-gia.jpg')] bg-cover bg-center text-white">
      {/* Overlay sang trọng */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      {/* Header giống Home */}
      <Header />

      {/* Hero */}
      <section className="relative z-10 text-center pt-32 pb-20 px-6">
        <h1
          className="text-5xl font-[Playfair_Display] font-bold text-cyan-400 drop-shadow-[0_2px_10px_rgba(34,211,238,0.6)]"
          data-aos="fade-down"
        >
          Đánh giá từ khách hàng
        </h1>
        <p
          className="max-w-2xl mx-auto text-gray-300 text-lg mt-4"
          data-aos="fade-up"
        >
          Cảm nhận chân thật từ những vị khách đã trải nghiệm tại{' '}
          <span className="text-cyan-400 font-semibold">VAA Hotel</span>.
        </p>
      </section>

      {/* Danh sách đánh giá */}
      <section className="relative z-10 container mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((r, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-lg border border-cyan-400/20 rounded-2xl p-6 shadow-[0_0_25px_rgba(34,211,238,0.15)] hover:shadow-[0_0_35px_rgba(34,211,238,0.25)] transition-all duration-300"
              data-aos="fade-up"
              data-aos-delay={i * 100}
            >
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={r.avatar}
                  alt={r.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400"
                />
                <div>
                  <h3 className="text-cyan-400 font-semibold">{r.name}</h3>
                  <p className="text-xs text-gray-400">{r.date}</p>
                </div>
              </div>
              <div className="flex mb-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <svg
                    key={index}
                    className={`w-5 h-5 ${
                      index < r.rating ? 'text-cyan-400' : 'text-gray-500'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.173c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.176 0l-3.38 2.455c-.785.57-1.84-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.06 9.397c-.783-.57-.38-1.81.588-1.81h4.173a1 1 0 00.95-.69l1.286-3.97z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-300 text-sm italic leading-relaxed">{r.comment}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Form gửi đánh giá */}
      <section
        className="relative z-10 bg-gradient-to-r from-cyan-500/10 to-cyan-500/10 backdrop-blur-md py-20 border-t border-cyan-400/30"
        data-aos="fade-up"
      >
        <div className="container mx-auto px-6 text-center max-w-xl">
          <h2 className="text-3xl font-[Playfair_Display] text-cyan-400 mb-6">
            Chia sẻ trải nghiệm của bạn
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div>
              <label className="block text-sm mb-1 text-gray-300">Họ và tên</label>
              <input
                type="text"
                className="w-full p-3 rounded-lg bg-white/10 border border-cyan-400/20 focus:border-cyan-400 focus:ring-cyan-400 text-white outline-none"
                placeholder="Nhập tên của bạn..."
                value={newReview.name}
                onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-300">Đánh giá</label>
              <select
                className="w-full p-3 rounded-lg bg-white/10 border border-cyan-400/20 focus:border-cyan-400 focus:ring-cyan-400 text-white outline-none"
                value={newReview.rating}
                onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n} className="text-black">
                    {n} sao
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-300">Nhận xét</label>
              <textarea
                rows={4}
                className="w-full p-3 rounded-lg bg-white/10 border border-cyan-400/20 focus:border-cyan-400 focus:ring-cyan-400 text-white outline-none"
                placeholder="Chia sẻ cảm nhận của bạn..."
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              />
            </div>
            {authError && (
              <p className="text-red-400 text-sm text-center -mt-2">{authError}</p>
            )}
            <div className="text-center pt-4">
              <button
                type="submit"
                className="px-10 py-3 bg-gradient-to-r from-cyan-400 to-cyan-500 text-black font-semibold rounded-lg hover:scale-105 hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-all duration-300"
              >
                Gửi đánh giá
              </button>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  )
}
