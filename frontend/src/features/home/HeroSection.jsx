import { useState, useEffect } from 'react'

const SLIDES = [
  {
    src: '/images/VaaHotel.jpg',
    alt: 'VAA Hotel Facade',
    title: 'VAA Hotel',
    subtitle: 'Khách sạn 5 sao tại trung tâm Sài Gòn',
  },
  {
    src: '/images/HotelLobby.jpg',
    alt: 'Hotel Lobby',
    title: 'Không Gian Sang Trọng',
    subtitle: 'Thiết kế hiện đại kết hợp nét đẹp truyền thống',
  },
  {
    src: 'images/PhongSuite.jpg',
    alt: 'Presidential Suite',
    title: 'Phòng Suite Đẳng Cấp',
    subtitle: 'Trải nghiệm nghỉ dưỡng tuyệt vời nhất',
  }
]

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % SLIDES.length)
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + SLIDES.length) % SLIDES.length)

  return (
    <section className="relative h-[600px] bg-gray-900">
      <div className="relative h-full">
        {SLIDES.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-700
              ${index === currentSlide ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
          >
            <div className="relative h-full">
              <img
                src={slide.src}
                alt={slide.alt}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white px-4 max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 [text-shadow:_2px_2px_4px_rgb(0_0_0_/_50%)]">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl [text-shadow:_1px_1px_2px_rgb(0_0_0_/_50%)]">
                  {slide.subtitle}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-10 z-30 flex justify-center space-x-3">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300
              ${index === currentSlide ? 'bg-white scale-100' : 'bg-white/50 scale-75'}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>

      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full
          bg-white/10 hover:bg-white/20 transition-all duration-300"
      >
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full
          bg-white/10 hover:bg-white/20 transition-all duration-300"
      >
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </section>
  )
}
