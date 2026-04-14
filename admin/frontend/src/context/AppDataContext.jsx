// src/context/AppDataContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { get, put } from "../api/api";

const AppDataContext = createContext();
export const useAppData = () => useContext(AppDataContext);

export function AppDataProvider({ children }) {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rData, bData, uData] = await Promise.all([
        get("/admin/rooms", []),
        get("/admin/bookings", []),
        get("/admin/users", [])
      ]);

      // Map Rooms
      const mappedRooms = (Array.isArray(rData) ? rData : []).map(r => ({
        id: r.room_id,
        name: r.room_number,
        price: Number(r.price),
        status: r.status === "occupied" ? "booked" : r.status,
        type: r.type,
        capacity: r.capacity,
        description: r.description || "",
        image: r.image_url || null,
        amenities: Array.isArray(r.amenities) ? r.amenities : [],
      }));
      setRooms(mappedRooms);

      // Map Bookings
      const rawBookings = Array.isArray(bData) ? bData : [];
      const latestBookings = new Map();

      rawBookings.forEach((b) => {
        const current = latestBookings.get(b.booking_id);
        const currentPaymentId = Number(current?.Payment?.payment_id || 0);
        const nextPaymentId = Number(b?.Payment?.payment_id || 0);

        if (!current || nextPaymentId >= currentPaymentId) {
          latestBookings.set(b.booking_id, b);
        }
      });

      const mappedBookings = Array.from(latestBookings.values()).map((b) => {
        const checkIn = b.check_in ? b.check_in.split("T")[0] : "";
        const checkOut = b.check_out ? b.check_out.split("T")[0] : "";

        const checkInDate = checkIn ? new Date(checkIn) : null;
        const checkOutDate = checkOut ? new Date(checkOut) : null;
        const nights =
          checkInDate && checkOutDate
            ? Math.max(
                0,
                (checkOutDate.getTime() - checkInDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 0;

        const paidByPayment =
          b.Payment && b.Payment.status === "success"
            ? Number(b.Payment.amount)
            : 0;

        const fallbackByRoomPrice =
          Number(b.Room?.price || 0) * (Number.isFinite(nights) ? nights : 0);

        const total = paidByPayment || fallbackByRoomPrice || 0;

        return {
          id: b.booking_id,
          customerName: b.User ? b.User.username : "Unknown",
          customerPhone: b.User ? b.User.phone : "",
          roomId: b.room_id,
          createdAt: b.created_at || null,
          checkIn,
          checkOut,
          note: b.note || "",
          status: b.status === "approved" ? "confirmed" : b.status,
          total,
          Payment: b.Payment,
        };
      });
      setBookings(mappedBookings);

      // Map Users
      const mappedUsers = (Array.isArray(uData) ? uData : []).map(u => ({
        id: u.user_id,
        username: u.username,
        displayName: u.username, // Use username as display name for now
        role: u.role,
        email: u.email,
        phone: u.phone || "",
        active: true // Default to active as DB doesn't have active field yet
      }));
      setUsers(mappedUsers);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cập nhật 1 phòng theo ID (chỉ update local state để UI phản hồi nhanh, thực tế nên gọi API put)
  function updateRoom(id, newData) {
    setRooms((old) => old.map((r) => (r.id === id ? { ...r, ...newData } : r)));
  }

  // Khóa/Mở user
  function toggleUserActive(userId) {
    setUsers((old) =>
      old.map((u) => (u.id === userId ? { ...u, active: !u.active } : u))
    );
  }

  // Cập nhật role cho user
  async function changeUserRole(userId, newRole) {
    const previousUsers = users;

    // Optimistic update for fast UI feedback
    setUsers((old) =>
      old.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );

    try {
      await put(`/admin/users/${userId}`, { role: newRole });
      return { ok: true };
    } catch (err) {
      setUsers(previousUsers);
      return { ok: false, message: err?.response?.data?.error || "Không cập nhật được role" };
    }
  }

  // Approve booking
  async function approveBooking(id) {
    const previous = bookings;
    setBookings((old) =>
      old.map((b) => (b.id === id ? { ...b, status: "confirmed" } : b))
    );
    try {
      await put(`/admin/bookings/${id}/confirm`, {});
      const b = bookings.find((x) => x.id === id);
      if (b) updateRoom(b.roomId, { status: "booked" });
    } catch (err) {
      console.error("approveBooking failed", err);
      setBookings(previous);
      alert("Duyệt đơn thất bại: " + (err?.response?.data?.error || err.message));
    }
  }

  // Reject booking
  async function rejectBooking(id) {
    const previous = bookings;
    setBookings((old) =>
      old.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
    );
    try {
      await put(`/admin/bookings/${id}/cancel`, {});
      const b = bookings.find((x) => x.id === id);
      if (b) updateRoom(b.roomId, { status: "available" });
    } catch (err) {
      console.error("rejectBooking failed", err);
      setBookings(previous);
      alert("Hủy đơn thất bại: " + (err?.response?.data?.error || err.message));
    }
  }

  // Tạo booking (mock)
  function createBooking(data) {
    const id = Math.max(0, ...bookings.map((b) => b.id)) + 1;
    const newBooking = { id, ...data, status: "pending" };
    setBookings((old) => [newBooking, ...old]);
    return newBooking;
  }

  // Thống kê doanh thu
  function getRevenue(from, to) {
    const f = from ? new Date(from) : null;
    const t = to ? new Date(to) : null;

    const filtered = bookings.filter((b) => {
      const dateStr = b.checkIn || b.check_in;
      if (!dateStr) return false;

      if (!(b.status === "confirmed" || b.status === "completed")) {
        return false;
      }

      const ci = new Date(dateStr);
      if (f && ci < f) return false;
      if (t && ci > t) return false;
      return true;
    });

    const total = filtered.reduce((sum, b) => {
      const price = Number(b.total_price) || Number(b.total) || (b.Payment ? Number(b.Payment.amount) : 0) || 0;
      return sum + price;
    }, 0);
    return { total, filtered };
  }

  return (
    <AppDataContext.Provider
      value={{
        rooms,
        bookings,
        users,
        loading,
        refreshData: fetchData,
        updateRoom,
        approveBooking,
        rejectBooking,
        createBooking,
        toggleUserActive,
        changeUserRole,
        getRevenue,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

