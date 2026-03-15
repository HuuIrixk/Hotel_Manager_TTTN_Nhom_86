export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white/90 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold mb-4">Về chúng tôi</h3>
            <p className="text-sm text-white/70">
              VAA Hotel - Khách sạn 5 sao tiêu chuẩn quốc tế tại trung tâm Sài Gòn.
            </p>
          </div>

          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold mb-4">Liên hệ</h3>
            <ul className="text-sm text-white/70 space-y-2">
              <li>18A, Cộng Hòa, Quận Tân Bình, TP.HCM</li>
              <li>Tel: (84-28) 3822 8888</li>
              <li>Email: nhom86@vaa.com</li>
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold mb-4">Theo dõi</h3>
            <div className="flex justify-center md:justify-start gap-4">
              <a href="#" className="text-white/70 hover:text-white">Facebook</a>
              <a href="#" className="text-white/70 hover:text-white">Instagram</a>
              <a href="#" className="text-white/70 hover:text-white">Twitter</a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-white/50">
          © 2026 VAA Hotel. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
