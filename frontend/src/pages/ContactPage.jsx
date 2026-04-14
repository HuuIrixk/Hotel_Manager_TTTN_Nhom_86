import { useState, useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Header from '@/layouts/Header'
import Footer from '@/layouts/Footer'
import api from '@/api/apiClient'

import { PhoneIcon } from "@heroicons/react/outline"
import { MailIcon } from "@heroicons/react/outline"
import { LocationMarkerIcon } from "@heroicons/react/outline"

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message)
      return alert('Vui lòng điền đầy đủ thông tin liên hệ!')
    setSubmitting(true)
    try {
      await api.post('/contact', { name: form.name, email: form.email, message: form.message })
      setSuccess(true)
      setForm({ name: '', email: '', message: '' })
    } catch (err) {
      alert('Gửi tin nhắn thất bại. Vui lòng thử lại sau.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    document.title = "Liên hệ | VAA Hotel";
  }, []);

  return (
    <div className="relative min-h-screen bg-[url('https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center text-white">
      <div className='layout-container'>
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

        <Header />

        {/* Hero */}
        <section className="relative z-10 text-center pt-32 pb-16 px-6">
          <h1
            className="text-5xl font-[Playfair_Display] text-cyan-400 font-bold drop-shadow-[0_2px_10px_rgba(34,211,238,0.6)]"
            data-aos="fade-down"
          >
            Liên hệ với chúng tôi
          </h1>
          <p
            className="max-w-2xl mx-auto text-gray-300 text-lg mt-4"
            data-aos="fade-up"
          >
            Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7.
            Hãy để <strong>VAA Hotel</strong> đồng hành cùng trải nghiệm của bạn!
          </p>
        </section>

        {/* Thông tin liên hệ */}
        <section className="relative z-10 container mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div
            className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-cyan-400/20 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
            data-aos="fade-right"
          >
            <div className="text-4xl mb-3">
              <LocationMarkerIcon className="w-10 h-10 text-cyan-400 mx-auto" />
            </div>
            <h3 className="text-cyan-400 font-semibold text-lg mb-2">Địa chỉ</h3>
            <a href="https://maps.app.goo.gl/tZLz5JU828HM6a189" target="_blank" rel="noopener noreferrer" className="hover:underline">
              18A Cộng Hòa, Phường 4, Quận Tân Bình, TP. Hồ Chí Minh
            </a>
          </div>

          <div
            className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-cyan-400/20 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
            data-aos="fade-up"
          >
            <div className="text-4xl mb-3">
              <PhoneIcon className="w-10 h-10 text-cyan-400 mx-auto" />
            </div>
            <h3 className="text-cyan-400 font-semibold text-lg mb-2">Hotline</h3>
              <a href="tel:+84909888777" className="hover:underline">
                (+84) 909 888 777
              </a>
            <p className="text-gray-400 text-xs mt-1">Hoạt động 24/7</p>
          </div>

          <div
            className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-cyan-400/20 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
            data-aos="fade-left"
          >
            <div className="text-4xl mb-3"><MailIcon className="w-10 h-10 text-cyan-400 mx-auto" /></div>
            <h3 className="text-cyan-400 font-semibold text-lg mb-2">Email</h3>
            <a href="mailto:nhom86@vaa.com" className="hover:underline">
              nhom86@vaa.com
            </a>
            <p className="text-gray-400 text-xs mt-1">Phản hồi trong vòng 24h</p>
          </div>
        </section>

        {/* Form liên hệ */}
        <section
          className="relative z-10 container mx-auto px-6 py-16 max-w-2xl text-center"
          data-aos="zoom-in"
        >
          <h2 className="text-3xl font-[Playfair_Display] text-cyan-400 mb-8">
            Gửi tin nhắn cho chúng tôi
          </h2>

          {success ? (
            <div className="p-6 bg-green-500/20 border border-green-400 rounded-xl text-green-300 mb-8">
              Cảm ơn bạn! Tin nhắn của bạn đã được gửi thành công.
              Chúng tôi sẽ liên hệ sớm nhất.
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div>
              <label className="block text-sm mb-1 text-gray-300">Họ và tên</label>
              <input
                type="text"
                className="w-full p-3 rounded-lg bg-white/10 border border-cyan-400/20 focus:border-cyan-400 focus:ring-cyan-400 text-white outline-none"
                placeholder="Nhập họ tên của bạn..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-gray-300">Email</label>
              <input
                type="email"
                className="w-full p-3 rounded-lg bg-white/10 border border-cyan-400/20 focus:border-cyan-400 focus:ring-cyan-400 text-white outline-none"
                placeholder="Địa chỉ email của bạn..."
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-gray-300">Nội dung</label>
              <textarea
                rows={5}
                className="w-full p-3 rounded-lg bg-white/10 border border-cyan-400/20 focus:border-cyan-400 focus:ring-cyan-400 text-white outline-none"
                placeholder="Nhập nội dung tin nhắn..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>

            <div className="text-center pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-10 py-3 bg-gradient-to-r from-cyan-400 to-cyan-500 text-black font-semibold rounded-lg hover:scale-105 hover:shadow-[0_0_25px_rgba(34,211,238,0.6)] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Đang gửi...' : 'Gửi tin nhắn'}
              </button>
            </div>
          </form>
        </section>

        {/* Google Map */}
        <section className="relative z-10 px-6 pt-16 pb-16">
            <div className="container mx-auto flex flex-col md:flex-row gap-6 items-stretch">
              <div
                className="relative z-10 w-full h-[500px] "
                data-aos="fade-up"
              >
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d4490.689721690829!2d106.6518413!3d10.8000211!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3175292976c117ad%3A0x5b3f38b21051f84!2zSOG7jWMgVmnhu4duIEjDoG5nIEtow7RuZyBWaeG7h3QgTmFtIENTMg!5e1!3m2!1svi!2s!4v1763408998010!5m2!1svi!2s"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.2)]"
                  aria-label="Bản đồ vị trí khách sạn VAA Hotel"
                ></iframe>
              </div>
            </div>
          </section>

        <Footer />
      </div>
    </div>
  )
}
