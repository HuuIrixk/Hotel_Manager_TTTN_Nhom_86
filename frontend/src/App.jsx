// src/App.jsx
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { ThemeProvider } from '@/features/theme/ThemeProvider'

import HomePage from '@/pages/HomePage'
import RoomDetailPage from '@/pages/RoomDetailPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import SearchPage from '@/pages/SearchPage'
import CartPage from '@/pages/CartPage'
import PaymentPage from '@/pages/PaymentPage'
import ServicesPage from '@/pages/ServicesPage'
import ReviewsPage from '@/pages/ReviewsPage'
import RoomsInfoPage from '@/pages/RoomsInfoPage'
import BookingPage from '@/pages/BookingPage'
import ContactPage from '@/pages/ContactPage'
import AboutPage from '@/pages/AboutPage'
import NotFoundPage from '@/pages/NotFoundPage'
import BookingResultPage from '@/pages/BookingResultPage'
import UserPage from '@/pages/UserPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import OtpPage from '@/pages/OtpPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import ChatWidget from '@/features/chat/ChatWidget'

import ScrollToTop from '@/components/ScrollToTop'

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/rooms/:id" element={<RoomDetailPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/otp" element={<OtpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/about" element={<AboutPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/booking-result" element={<BookingResultPage />} />
        <Route path="/user" element={<UserPage />} />

        <Route path="/services" element={<ServicesPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/rooms-info" element={<RoomsInfoPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/contact" element={<ContactPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ChatWidget />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}
