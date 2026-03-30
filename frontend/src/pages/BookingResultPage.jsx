// src/pages/BookingResultPage.jsx
import { useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

import Header from '@/layouts/Header';
import Footer from '@/layouts/Footer';

export default function BookingResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paymentId = searchParams.get('paymentId') || '';
  const successParam = searchParams.get('success');
  const messageCode = searchParams.get('message') || '';

  // Optional: khi redirect từ directPayment mình sẽ thêm mấy cái này
  const bookingId = searchParams.get('bookingId') || '';
  const amount = searchParams.get('amount');
  const method = searchParams.get('method') || '';

  const isSuccess = successParam === 'true';

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
    window.scrollTo(0, 0);
  }, []);

  const readableMessage = useMemo(() => {
    switch (messageCode) {
      case 'PaymentSuccess':
        return 'Thanh toán thành công.';
      case 'PaymentFailed':
        return 'Thanh toán thất bại.';
      case 'PaymentNotFound':
        return 'Không tìm thấy giao dịch thanh toán.';
      case 'InvalidSignature':
        return 'Chữ ký thanh toán không hợp lệ (Invalid Signature).';
      case 'AlreadyProcessed':
        return 'Giao dịch đã được xử lý trước đó.';
      case 'ServerError':
        return 'Lỗi hệ thống thanh toán, vui lòng thử lại sau.';
      case 'DirectPaymentSuccess':
        return 'Đã ghi nhận thanh toán trực tiếp tại khách sạn.';
      case 'DirectBookingPending':
        return 'Đơn đặt phòng đã được tạo ở trạng thái chờ. Vui lòng thanh toán trực tiếp tại khách sạn.';
      case 'RoomUnavailable':
        return 'Phòng không còn trống khi thanh toán hoàn tất. Vui lòng chọn phòng khác.';
      default:
        return messageCode || 'Không rõ trạng thái thanh toán.';
    }
  }, [messageCode]);

  const formatCurrency = (num) => {
    if (!num || Number.isNaN(Number(num))) return '';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(num));
  };

  return (
    <div className="relative min-h-screen bg-[#050816] text-white">
      <Header />

      <main className="relative z-10 pt-32 pb-24 container mx-auto px-6 flex flex-col items-center">
        <h1
          className="text-4xl md:text-5xl font-[Playfair_Display] font-bold mb-8 text-cyan-400 drop-shadow-[0_2px_10px_rgba(34,211,238,0.5)]"
          data-aos="fade-down"
        >
          Kết quả thanh toán
        </h1>

        <div
          className="w-full max-w-2xl bg-white/10 backdrop-blur-lg border border-cyan-400/20 rounded-2xl p-8 shadow-[0_0_25px_rgba(34,211,238,0.15)]"
          data-aos="fade-up"
        >
          <div className="mb-6">
            <p className="text-sm text-gray-300 mb-2">
              Mã thanh toán: <span className="font-semibold">{paymentId || 'N/A'}</span>
            </p>

            {bookingId && (
              <p className="text-sm text-gray-300 mb-1">
                Mã đặt phòng: <span className="font-semibold">{bookingId}</span>
              </p>
            )}

            {amount && (
              <p className="text-sm text-gray-300 mb-1">
                Tổng số tiền:{' '}
                <span className="font-semibold text-cyan-300">
                  {formatCurrency(amount)}
                </span>
              </p>
            )}

            {method && (
              <p className="text-sm text-gray-300">
                Phương thức:{' '}
                <span className="font-semibold">
                  {method === 'vnpay'
                    ? 'Thanh toán qua VNPay'
                    : method === 'direct'
                    ? 'Thanh toán trực tiếp tại khách sạn'
                    : method}
                </span>
              </p>
            )}
          </div>

          <div
            className={`mb-6 rounded-xl p-4 border ${
              isSuccess
                ? 'bg-emerald-500/10 border-emerald-400'
                : 'bg-red-500/10 border-red-400'
            }`}
          >
            <p className="text-lg font-semibold mb-1">
              {isSuccess ? 'Xử lý thành công' : 'Thanh toán không thành công'}
            </p>
            <p className="text-sm text-gray-100">{readableMessage}</p>
          </div>

          <div className="flex flex-col md:flex-row gap-3 justify-between">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full md:w-auto px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-medium transition"
            >
              Về trang chủ
            </button>

            <Link
              to="/user"
              className="w-full md:w-auto text-center px-6 py-3 rounded-full bg-cyan-400 hover:bg-cyan-500 text-sm font-semibold text-black transition"
            >
              Xem lịch sử đặt phòng
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
