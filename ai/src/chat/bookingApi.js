// ai/src/chat/bookingApi.js
import { env } from '../config/env.js';

const BASE_URL = env.backendUrl || 'http://localhost:4000';

const ROOM_TYPE_MAP = {
  suite: 'Suite',
  vip: 'VIP',
  standard: 'Standard',
};

function normalizeType(type) {
  if (!type) return null;
  return ROOM_TYPE_MAP[type.toLowerCase()] || type;
}

export async function searchRoomsAPI(filters) {
  const params = new URLSearchParams();

  if (filters.type) params.set('type', normalizeType(filters.type));
  if (filters.capacity) params.set('capacity', String(filters.capacity));
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
  if (filters.checkIn) params.set('checkIn', filters.checkIn);
  if (filters.checkOut) params.set('checkOut', filters.checkOut);

  const res = await fetch(`${BASE_URL}/api/rooms/search?${params.toString()}`);

  if (!res.ok) {
    throw new Error(`searchRoomsAPI error: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

//Lấy info phòng theo số phòng
export async function getRoomInfoByNumber(roomNumber) {
  const res = await fetch(`${BASE_URL}/api/rooms/by-number/${roomNumber}`);

  if (res.status === 404) {
    return { exists: false };
  }

  if (!res.ok) {
    throw new Error(`getRoomInfoByNumber error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data; // { exists, room_id, room_number, ... }
}
