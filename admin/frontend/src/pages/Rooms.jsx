// src/pages/Rooms.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAppData } from "../context/AppDataContext";
import { get, patch, put, post, del } from "../api/api";

const ROOM_TYPE_OPTIONS = ["Standard", "VIP", "Suite"];
const ROOM_AMENITY_OPTIONS = [
  "WiFi",
  "TV",
  "Điều hòa",
  "Bồn tắm",
  "Két sắt",
  "Nước uống",
  "Máy sấy tóc",
  "Tủ lạnh",
  "Bàn + ghế",
  "Ấm đun nước",
  "Khăn tắm",
  "Dịch vụ phòng",
];

function normalizeAmenities(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function AmenitiesMultiSelect({ label, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const selectedAmenities = normalizeAmenities(value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = ROOM_AMENITY_OPTIONS.filter((option) =>
    option.toLowerCase().includes(query.trim().toLowerCase())
  );

  const toggleAmenity = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      onChange(selectedAmenities.filter((item) => item !== amenity));
      return;
    }

    onChange([...selectedAmenities, amenity]);
  };

  const removeAmenity = (amenity) => {
    onChange(selectedAmenities.filter((item) => item !== amenity));
  };

  return (
    <label>
      {label}
      <div ref={containerRef} style={{ position: "relative", marginTop: 6 }}>
        <button
          type="button"
          className="input"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            minHeight: 46,
            height: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            flexWrap: "wrap",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
            {selectedAmenities.length ? (
              selectedAmenities.map((amenity) => (
                <span
                  key={amenity}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "#e0f2fe",
                    color: "#075985",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {amenity}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeAmenity(amenity);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        removeAmenity(amenity);
                      }
                    }}
                    style={{ cursor: "pointer", lineHeight: 1 }}
                  >
                    ×
                  </span>
                </span>
              ))
            ) : (
              <span style={{ color: "#6b7280" }}>Chọn tiện nghi cho phòng</span>
            )}
          </span>
          <span style={{ color: "#64748b", fontSize: 18 }}>{isOpen ? "▴" : "▾"}</span>
        </button>

        {isOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              right: 0,
              background: "#fff",
              border: "1px solid #cbd5e1",
              borderRadius: 12,
              boxShadow: "0 18px 40px rgba(15, 23, 42, 0.14)",
              zIndex: 20,
              overflow: "hidden",
            }}
          >
            <div style={{ padding: 10, borderBottom: "1px solid #e2e8f0" }}>
              <input
                className="input"
                placeholder="Tìm tiện nghi..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div style={{ maxHeight: 220, overflowY: "auto", padding: 6 }}>
              {filteredOptions.length ? (
                filteredOptions.map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      style={{
                        width: "100%",
                        border: "none",
                        background: isSelected ? "#eff6ff" : "transparent",
                        color: "#0f172a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      <span>{amenity}</span>
                      <span style={{ color: isSelected ? "#2563eb" : "transparent", fontWeight: 700 }}>
                        ✓
                      </span>
                    </button>
                  );
                })
              ) : (
                <div style={{ padding: 12, color: "#64748b" }}>Không tìm thấy tiện nghi phù hợp.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </label>
  );
}

function AmenitiesPreview({ amenities }) {
  const normalizedAmenities = normalizeAmenities(amenities);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isTooltipVisible) {
      return;
    }

    const updateTooltipPosition = () => {
      if (!containerRef.current) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const tooltipWidth = 320;
      const horizontalPadding = 8;
      const maxLeft = window.innerWidth - tooltipWidth - horizontalPadding;
      const left = Math.min(Math.max(rect.left, horizontalPadding), Math.max(maxLeft, horizontalPadding));

      setTooltipPosition({
        left,
        top: rect.bottom + 10,
      });
    };

    updateTooltipPosition();
    window.addEventListener("scroll", updateTooltipPosition, true);
    window.addEventListener("resize", updateTooltipPosition);

    return () => {
      window.removeEventListener("scroll", updateTooltipPosition, true);
      window.removeEventListener("resize", updateTooltipPosition);
    };
  }, [isTooltipVisible]);

  if (!normalizedAmenities.length) {
    return <span style={{ color: "#94a3b8" }}>Chưa có</span>;
  }

  const visibleAmenities = normalizedAmenities.slice(0, 3);
  const remainingCount = normalizedAmenities.length - visibleAmenities.length;

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", display: "inline-flex", maxWidth: "100%" }}
      onMouseEnter={() => setIsTooltipVisible(true)}
      onMouseLeave={() => setIsTooltipVisible(false)}
      onFocus={() => setIsTooltipVisible(true)}
      onBlur={() => setIsTooltipVisible(false)}
    >
      <div
        tabIndex={0}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          cursor: normalizedAmenities.length > 3 ? "help" : "default",
          outline: "none",
        }}
      >
        {visibleAmenities.map((amenity) => (
          <span
            key={amenity}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "4px 8px",
              borderRadius: 999,
              background: "#f1f5f9",
              color: "#334155",
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {amenity}
          </span>
        ))}
        {remainingCount > 0 && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "4px 8px",
              borderRadius: 999,
              background: "#dbeafe",
              color: "#1d4ed8",
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            +{remainingCount}
          </span>
        )}
      </div>

      {isTooltipVisible && normalizedAmenities.length > 0 && typeof document !== "undefined"
        ? createPortal(
            <div
              role="tooltip"
              style={{
                position: "fixed",
                left: tooltipPosition.left,
                top: tooltipPosition.top,
                minWidth: 220,
                maxWidth: 320,
                padding: 12,
                borderRadius: 12,
                background: "#ffffff",
                color: "#0f172a",
                border: "1px solid #e2e8f0",
                boxShadow: "0 16px 36px rgba(15, 23, 42, 0.18)",
                zIndex: 9999,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -6,
                  left: 18,
                  width: 12,
                  height: 12,
                  background: "#ffffff",
                  borderLeft: "1px solid #e2e8f0",
                  borderTop: "1px solid #e2e8f0",
                  transform: "rotate(45deg)",
                }}
              />
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "#1e3a8a" }}>
                Toàn bộ tiện nghi
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {normalizedAmenities.map((amenity) => (
                  <span
                    key={amenity}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "4px 8px",
                      borderRadius: 999,
                      background: "#eff6ff",
                      color: "#1e3a8a",
                      border: "1px solid #bfdbfe",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

export default function Rooms() {
  const { rooms, refreshData } = useAppData();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    type: "Standard",
    price: "",
    capacity: 2,
    status: "available",
    description: "",
    amenities: [],
    imageFile: null,
  });

  // Availability Check
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [availableIds, setAvailableIds] = useState(null); // null = not checking

  // Edit Modal
  const [editingRoom, setEditingRoom] = useState(null);
  const [editForm, setEditForm] = useState({
    // name, type, price, ...
    amenities: [],
    image: null,
    imageFile: null,   // file mới upload
  });


  const checkAvailability = async () => {
    if (!fromDate || !toDate) return alert("Chọn ngày bắt đầu và kết thúc");
    const res = await get(`/admin/rooms/available?from=${fromDate}&to=${toDate}`);
    if (res) {
      setAvailableIds(res.map(r => r.room_id));
    }
  };

  const clearAvailability = () => {
    setFromDate("");
    setToDate("");
    setAvailableIds(null);
  };

  const handleToggle = async (id) => {
    try {
      await patch(`/admin/rooms/${id}/toggle`);
      refreshData();
    } catch (e) {
      alert("Lỗi khi đổi trạng thái");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa phòng này?")) return;
    try {
      await del(`/admin/rooms/${id}`);
      refreshData();
    } catch (e) {
      alert("Lỗi khi xóa phòng");
    }
  };

  const startEdit = (room) => {
    setEditingRoom(room);
    setEditForm({
      ...room,
      amenities: normalizeAmenities(room.amenities),
      imageFile: null,
    });
  };

  const saveEdit = async () => {
    try {
      const formData = new FormData();
      formData.append("room_number", editForm.name);
      formData.append("type", editForm.type);
      formData.append("price", editForm.price);
      formData.append("capacity", editForm.capacity || "");
      formData.append("description", editForm.description || "");
      formData.append("status", editForm.status || "");
      formData.append("amenities", JSON.stringify(normalizeAmenities(editForm.amenities)));

      if (editForm.imageFile) {
        formData.append("image", editForm.imageFile);
      }

      await put(`/admin/rooms/${editingRoom.id}`, formData);

      setEditingRoom(null);
      refreshData();
    } catch (e) {
      alert("Lỗi cập nhật");
    }
  };

  const createRoom = async () => {
    try {
      if (!createForm.name || !createForm.type || !createForm.price) {
        alert("Vui lòng nhập tên phòng, loại phòng và giá.");
        return;
      }

      const formData = new FormData();
      formData.append("room_number", createForm.name);
      formData.append("type", createForm.type);
      formData.append("price", createForm.price);
      formData.append("capacity", createForm.capacity || 2);
      formData.append("description", createForm.description || "");
      formData.append("status", createForm.status || "available");
      formData.append("amenities", JSON.stringify(normalizeAmenities(createForm.amenities)));

      if (createForm.imageFile) {
        formData.append("image", createForm.imageFile);
      }

      await post("/admin/rooms", formData);
      setCreatingRoom(false);
      setCreateForm({
        name: "",
        type: "Standard",
        price: "",
        capacity: 2,
        status: "available",
        description: "",
        amenities: [],
        imageFile: null,
      });
      refreshData();
    } catch (e) {
      alert("Lỗi khi thêm phòng");
    }
  };


  const list = useMemo(() => {
    return rooms.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (availableIds !== null && !availableIds.includes(r.id)) return false;
      return true;
    });
  }, [rooms, q, statusFilter, availableIds]);

  return (
    <div>
      <h1 className="page-title">Quản lý phòng</h1>

      {/* Filters & Availability */}
      <div className="card" style={{ marginBottom: 12, padding: 12 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input className="input" placeholder="Tìm tên phòng..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">-- Tất cả trạng thái --</option>
            <option value="available">Available</option>
            <option value="booked">Booked</option>
            <option value="maintenance">Maintenance</option>
          </select>

          <div style={{ display: "flex", gap: 8, alignItems: "center", borderLeft: "1px solid #eee", paddingLeft: 12 }}>
            <span>Check trống:</span>
            <input type="date" className="input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            <span>-</span>
            <input type="date" className="input" value={toDate} onChange={e => setToDate(e.target.value)} />
            <button className="btn-accept" onClick={checkAvailability}>Check</button>
            {availableIds !== null && <button className="btn-outline" onClick={clearAvailability}>X</button>}
          </div>

          <div style={{ marginLeft: "auto" }}>
             <div style={{ display: "flex", gap: 8 }}>
               <button className="btn-accept" onClick={() => setCreatingRoom(true)}>Thêm phòng</button>
               <button className="btn-accept" onClick={refreshData}>Refresh</button>
             </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <table className="table">
          <thead><tr><th>Mã</th><th>Tên</th><th>Loại</th><th>Giá</th><th>Sức chứa</th><th>Tiện nghi</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td>#{r.id}</td>
                <td>{r.name}</td>
                <td>{r.type}</td>
                <td>{r.price.toLocaleString("vi-VN")}₫</td>
                <td>{r.capacity}</td>
                <td style={{ minWidth: 220, maxWidth: 280 }}>
                  <AmenitiesPreview amenities={r.amenities} />
                </td>
                <td>
                  <span style={{
                    fontWeight: 700,
                    color: r.status === "available" ? "#10b981" : (r.status === "booked" ? "#facc15" : "#ef4444")
                  }}>
                    {r.status === "booked"
                      ? "Booked"
                      : r.status === "available"
                      ? "Available"
                      : r.status === "maintenance"
                      ? "Maintenance"
                      : r.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-outline" onClick={() => handleToggle(r.id)}>
                      {r.status === "available" ? "Khóa" : "Mở"}
                    </button>
                    <button className="btn-outline" onClick={() => startEdit(r)}>Sửa</button>
                    <button className="btn-outline" style={{ color: "red", borderColor: "red" }} onClick={() => handleDelete(r.id)}>Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingRoom && (
        <div className="modal-overlay">
          <div className="modal text-black">
            <h2>Sửa phòng {editingRoom.name}</h2>
            <div className="room-form-grid">
              <div style={{ display: "grid", gap: 12 }}>
                <label>Ảnh phòng
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      setEditForm((prev) => ({
                        ...prev,
                        imageFile: file,
                      }));
                    }}
                  />
                </label>

                {(editForm.image || editForm.imageFile) && (
                  <div>
                    <p>Preview:</p>
                    <img
                      src={
                        editForm.imageFile
                          ? URL.createObjectURL(editForm.imageFile)
                          : editForm.image?.startsWith("http")
                          ? editForm.image
                          : (import.meta.env.VITE_API_BASE_URL || "http://localhost:4001/api").replace(/\/api$/, "") +
                            editForm.image
                      }
                      alt="Room"
                      style={{ width: 200, height: 120, objectFit: "cover", borderRadius: 8 }}
                    />
                  </div>
                )}

                <label>Tên phòng <input className="input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></label>
                <label>Loại
                  <select className="input" value={editForm.type || "Standard"} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
                    {ROOM_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label>Giá <input type="number" className="input" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} /></label>
                <label>Sức chứa <input type="number" className="input" value={editForm.capacity} onChange={e => setEditForm({...editForm, capacity: e.target.value})} /></label>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <AmenitiesMultiSelect
                  label="Tiện nghi"
                  value={editForm.amenities}
                  onChange={(amenities) => setEditForm({ ...editForm, amenities })}
                />
                <label>Mô tả <textarea className="input" value={editForm.description || ""} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></label>
                <label>Trạng thái
                  <select className="input" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                    <option value="available">Available</option>
                    <option value="booked">Booked</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </label>
              </div>
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn-outline" onClick={() => setEditingRoom(null)}>Hủy</button>
              <button className="btn-accept" onClick={saveEdit}>Lưu</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {creatingRoom && (
        <div className="modal-overlay">
          <div className="modal text-black">
            <h2>Thêm phòng mới</h2>
            <div className="room-form-grid">
              <div style={{ display: "grid", gap: 12 }}>
                <label>Ảnh phòng
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0] || null;
                      setCreateForm((prev) => ({ ...prev, imageFile: file }));
                    }}
                  />
                </label>

                {createForm.imageFile && (
                  <div>
                    <p>Preview:</p>
                    <img
                      src={URL.createObjectURL(createForm.imageFile)}
                      alt="Room preview"
                      style={{ width: 200, height: 120, objectFit: "cover", borderRadius: 8 }}
                    />
                  </div>
                )}

                <label>Tên phòng <input className="input" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} /></label>
                <label>Loại
                  <select className="input" value={createForm.type} onChange={e => setCreateForm({ ...createForm, type: e.target.value })}>
                    {ROOM_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label>Giá <input type="number" className="input" value={createForm.price} onChange={e => setCreateForm({ ...createForm, price: e.target.value })} /></label>
                <label>Sức chứa <input type="number" className="input" value={createForm.capacity} onChange={e => setCreateForm({ ...createForm, capacity: e.target.value })} /></label>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <AmenitiesMultiSelect
                  label="Tiện nghi"
                  value={createForm.amenities}
                  onChange={(amenities) => setCreateForm({ ...createForm, amenities })}
                />
                <label>Mô tả <textarea className="input" value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} /></label>
                <label>Trạng thái
                  <select className="input" value={createForm.status} onChange={e => setCreateForm({ ...createForm, status: e.target.value })}>
                    <option value="available">Available</option>
                    <option value="booked">Booked</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </label>
              </div>
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn-outline" onClick={() => setCreatingRoom(false)}>Hủy</button>
              <button className="btn-accept" onClick={createRoom}>Thêm</button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justifyContent: center; z-index: 1000; }
        .modal { background: white; padding: 20px; border-radius: 8px; width: 920px; max-width: 95%; max-height: 90vh; overflow: auto; }
        .room-form-grid { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: start; }
        @media (max-width: 900px) {
          .room-form-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
