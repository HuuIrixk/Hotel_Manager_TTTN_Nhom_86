import api from './apiClient'

export async function getMyCart() {
  const res = await api.get('/cart/items')
  return res.data
}

export async function addToCart(payload) {
  const res = await api.post('/cart/items', payload)
  return res.data
}

export async function removeCartItem(id) {
  const res = await api.delete(`/cart/items/${id}`)
  return res.data
}
