import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Header from '@/layouts/Header'
import Footer from '@/layouts/Footer'

const SERVICES = [
  {
    title: 'Spa & Massage',
    desc: 'Thư giãn với liệu trình chăm sóc cơ thể chuyên sâu, sử dụng tinh dầu thiên nhiên và không gian yên tĩnh tuyệt đối.',
    image:
      './images/spa-massage.jpg',
  },
  {
    title: 'Nhà hàng & Ẩm thực',
    desc: 'Thưởng thức tinh hoa ẩm thực Á – Âu trong không gian sang trọng, được phục vụ bởi đầu bếp đạt chuẩn 5 sao.',
    image:
      './images/restaurant-cuisine.jpg',
  },
  {
    title: 'Hồ bơi & Quầy bar',
    desc: 'Tận hưởng làn nước mát lạnh cùng quầy bar phục vụ cocktail, đồ uống cao cấp và khung cảnh thành phố lung linh.',
    image:
      './images/pool-bar.jpg',
  },
  {
    title: 'Phòng Gym hiện đại',
    desc: 'Phòng tập được trang bị đầy đủ thiết bị cao cấp, giúp bạn duy trì sức khỏe và thể lực dù đang đi nghỉ dưỡng.',
    image:
      './images/gym-equipment.jpg',
  },
  {
    title: 'Dịch vụ đưa đón cao cấp',
    desc: 'Xe limousine sang trọng cùng tài xế chuyên nghiệp sẵn sàng phục vụ bạn từ sân bay đến khách sạn và ngược lại.',
    image:
      './images/luxury-transport.jpg',
  },
  {
    title: 'Tiệc & Hội nghị',
    desc: 'Không gian rộng rãi, trang bị âm thanh – ánh sáng hiện đại, phù hợp cho sự kiện, hội thảo và lễ cưới sang trọng.',
    image:
      './images/events-conferences.jpg',
  },
]

export default function ServicesPage() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = "Dịch vụ | VAA Hotel";
  }, []);

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
  }, [])

  return (
    <div className="relative min-h-screen bg-[url('frontend/public/images/pool-bar.jpg')] bg-cover bg-center text-white">
      {/* Overlay mờ */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"></div>

      <Header />

      {/* Hero Section */}
      <section
        className="relative z-10 text-center pt-32 pb-20 px-6"
        data-aos="fade-down"
      >
        <h1 className="text-5xl md:text-6xl font-[Playfair_Display] font-bold text-cyan-400 drop-shadow-[0_2px_10px_rgba(34,211,238,0.6)]">
          Dịch vụ đẳng cấp
        </h1>
        <p className="max-w-2xl mx-auto mt-6 text-gray-300 text-lg leading-relaxed">
          Trải nghiệm sự khác biệt từ chất lượng phục vụ, tận hưởng từng khoảnh khắc
          sang trọng và đẳng cấp tại{' '}
          <span className="text-cyan-400 font-semibold">
            VAA Hotel
          </span>
          .
        </p>
      </section>

      {/* Grid dịch vụ */}
      <section className="relative z-10 container mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 pb-20">
        {SERVICES.map((s, i) => (
          <div
            key={i}
            data-aos="fade-up"
            data-aos-delay={i * 100}
            className="group bg-white/10 backdrop-blur-md border border-cyan-400/20 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.15)] hover:shadow-[0_0_35px_rgba(34,211,238,0.3)] transition-all duration-500"
          >
            <div className="h-60 overflow-hidden">
              <img
                src={s.image}
                alt={s.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-semibold text-cyan-400 mb-3">
                {s.title}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* CTA cuối trang */}
      <section
        className="relative z-10 bg-gradient-to-r from-cyan-500/10 to-cyan-500/10 backdrop-blur-md text-center py-20 border-t border-cyan-400/30"
        data-aos="fade-up"
      >
        <h2 className="text-3xl md:text-4xl font-[Playfair_Display] text-cyan-400 mb-6">
          Liên hệ ngay để trải nghiệm dịch vụ 5 sao
        </h2>
        <button
          onClick={() => navigate('/contact')}
          className="px-10 py-3 bg-gradient-to-r from-cyan-400 to-cyan-500 text-black font-semibold rounded-lg hover:scale-105 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all duration-300"
        >
          Đặt dịch vụ ngay
        </button>
      </section>

      <Footer />
    </div>
  )
}
