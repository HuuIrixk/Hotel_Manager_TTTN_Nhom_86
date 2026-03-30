import api from './apiClient'

export async function validateBooking(payload) {
  const res = await api.post('/bookings/validate', payload)
  return res.data
}

export async function createBooking(payload) {
  const res = await api.post('/bookings', payload)
  return res.data
}

export async function getMyBookings() {
  const res = await api.get('/bookings/my-bookings')
  return res.data
}

export async function cancelBooking(id) {
  const res = await api.put(`/bookings/${id}/cancel`)
  return res.data
}
