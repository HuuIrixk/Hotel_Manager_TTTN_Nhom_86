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
        status: r.status,
        type: r.type,
        capacity: r.capacity,
        description: r.description || "",
        image: r.image_url || null,
        amenities: Array.isArray(r.amenities) ? r.amenities : [],
      }));
      setRooms(mappedRooms);

      // Map Bookings
      const mappedBookings = (Array.isArray(bData) ? bData : []).map((b) => {
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
          checkIn,
          checkOut,
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
  function approveBooking(id) {
    setBookings((old) =>
      old.map((b) => (b.id === id ? { ...b, status: "confirmed" } : b))
    );
    // Logic update room status nên được xử lý ở backend khi confirm booking
    const b = bookings.find((x) => x.id === id);
    if (b) updateRoom(b.roomId, { status: "occupied" });
  }

  // Reject booking
  function rejectBooking(id) {
    setBookings((old) =>
      old.map((b) => (b.id === id ? { ...b, status: "rejected" } : b))
    );
    const b = bookings.find((x) => x.id === id);
    if (b) updateRoom(b.roomId, { status: "available" });
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
      // Backend trả về check_in, check_out (snake_case) hoặc checkIn (camelCase) tùy model
      // Cần kiểm tra kỹ response thực tế. Tạm thời assume backend trả về đúng format hoặc map lại.
      // Dựa vào code cũ: checkIn
      const dateStr = b.checkIn || b.check_in;
      if (!dateStr) return false;

      if (!(b.status === "confirmed" || b.status === "completed")) {
        return false;
      }

      if (b.Payment && b.Payment.status !== "success") {
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

