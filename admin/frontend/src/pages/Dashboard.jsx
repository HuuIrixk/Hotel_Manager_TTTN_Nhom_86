
// Dashboard tổng quan


import React, { useMemo } from "react";
import { useAppData } from "../context/AppDataContext";

const normalizeStatus = (status) =>
  status === "approved" ? "confirmed" : String(status || "").toLowerCase();

const isAcceptedBooking = (booking) => {
  const status = normalizeStatus(booking.status);
  return status === "confirmed" || status === "completed";
};

const isRevenueBooking = (booking) => isAcceptedBooking(booking);

const REPORT_YEAR = 2026;

const getMonthsInYear = (year) => {
  const months = [];
  for (let month = 1; month <= 12; month += 1) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const label = `T${month}`;
    months.push({ key, label });
  }
  return months;
};

function BarChartCard({ chartKey, title, series, valueFormatter = (v) => v.toLocaleString("vi-VN") }) {
  const maxValue = Math.max(...series.map((item) => item.value), 0);
  const safeMax = maxValue > 0 ? maxValue : 1;

  const chartWidth = 760;
  const chartHeight = 280;
  const margin = { top: 10, right: 10, bottom: 38, left: 92 };
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;
  const colWidth = plotWidth / Math.max(series.length, 1);
  const barWidth = colWidth * 0.78;
  const gradientId = `chart-bar-gradient-${chartKey}`;

  const yTicks = [5, 4, 3, 2, 1, 0].map((step) => {
    const value = (safeMax * step) / 5;
    const y = margin.top + ((5 - step) / 5) * plotHeight;
    return { step, value, y, isBase: step === 0 };
  });

  const getBarHeight = (value) => (value / safeMax) * plotHeight;

  return (
    <div className="card chart-card">
      <div className="chart-title">{title}</div>
      <div className="chart-svg-wrap">
        <svg className="chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" role="img" aria-label={title}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#66e6ff" />
              <stop offset="100%" stopColor="#12bfe0" />
            </linearGradient>
          </defs>

          {yTicks.map((tick) => (
            <g key={tick.step}>
              <line
                x1={margin.left}
                y1={tick.y}
                x2={chartWidth - margin.right}
                y2={tick.y}
                className={`chart-grid-line ${tick.isBase ? "base" : ""}`}
              />
              <text x={margin.left - 8} y={tick.y + 3} textAnchor="end" className="chart-axis-text">
                {valueFormatter(Math.round(tick.value))}
              </text>
            </g>
          ))}

          {series.map((item, idx) => {
            const height = getBarHeight(item.value);
            const x = margin.left + idx * colWidth + (colWidth - barWidth) / 2;
            const y = margin.top + (plotHeight - height);

            return (
              <g key={item.key}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={height}
                  rx={4}
                  fill={`url(#${gradientId})`}
                >
                  <title>{`${item.label}: ${valueFormatter(item.value)}`}</title>
                </rect>
                <text
                  x={margin.left + idx * colWidth + colWidth / 2}
                  y={margin.top + plotHeight + 16}
                  textAnchor="middle"
                  className="chart-axis-text"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { rooms, bookings } = useAppData();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const occupiedRoomIds = new Set(
    bookings
      .filter((b) => {
        if (normalizeStatus(b.status) !== "confirmed") return false;

        const checkIn = b.checkIn ? new Date(b.checkIn) : null;
        const checkOut = b.checkOut ? new Date(b.checkOut) : null;
        if (!checkIn || !checkOut) return false;

        checkIn.setHours(0, 0, 0, 0);
        checkOut.setHours(0, 0, 0, 0);

        // Phòng được tính là đang sử dụng trong khoảng [checkIn, checkOut)
        return checkIn <= today && today < checkOut;
      })
      .map((b) => b.roomId)
  );

  const availableRooms = Math.max(0, rooms.length - occupiedRoomIds.size);

  const totalRevenue = useMemo(
    () =>
      bookings.reduce((sum, b) => {
        if (!isAcceptedBooking(b)) return sum;
        const amount = Number(b.total) || (b.Payment ? Number(b.Payment.amount) : 0) || 0;
        return sum + amount;
      }, 0),
    [bookings]
  );

  const monthlyData = useMemo(() => {
    const months = getMonthsInYear(REPORT_YEAR);
    const revenueMap = new Map(months.map((m) => [m.key, 0]));
    const bookingMap = new Map(months.map((m) => [m.key, 0]));

    bookings.forEach((b) => {
      const sourceDateValue = b.createdAt || b.checkIn || null;
      const sourceDate = sourceDateValue ? new Date(sourceDateValue) : null;
      if (!sourceDate || Number.isNaN(sourceDate.getTime())) return;

      if (sourceDate.getFullYear() !== REPORT_YEAR) return;

      const key = `${sourceDate.getFullYear()}-${String(sourceDate.getMonth() + 1).padStart(2, "0")}`;
      if (!bookingMap.has(key)) return;

      if (isAcceptedBooking(b)) {
        bookingMap.set(key, (bookingMap.get(key) || 0) + 1);
      }

      if (isRevenueBooking(b)) {
        const amount = Number(b.total) || (b.Payment ? Number(b.Payment.amount) : 0) || 0;
        revenueMap.set(key, (revenueMap.get(key) || 0) + amount);
      }
    });

    return {
      revenueSeries: months.map((m) => ({ key: m.key, label: m.label, value: revenueMap.get(m.key) || 0 })),
      bookingSeries: months.map((m) => ({ key: m.key, label: m.label, value: bookingMap.get(m.key) || 0 })),
    };
  }, [bookings]);

  return (
    <div>
      <h1 className="page-title">Tổng quan</h1>

      <div className="dash-grid dashboard-summary-grid">
        <div className="card">
          <div className="card-title">Tổng doanh thu</div>
          <div className="card-number">{totalRevenue.toLocaleString("vi-VN")}₫</div>
        </div>

        <div className="card">
          <div className="card-title">Tổng số phòng</div>
          <div className="card-number">{rooms.length}</div>
        </div>

        <div className="card">
          <div className="card-title">Đơn đang chờ</div>
          <div className="card-number">
            {bookings.filter((b) => b.status === "pending").length}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Phòng trống</div>
          <div className="card-number">
            {availableRooms}
          </div>
        </div>
      </div>

      <div className="charts-grid dashboard-charts-stack" style={{ marginTop: 16 }}>
        <BarChartCard
          chartKey="revenue"
          title={`Doanh thu đơn đã duyệt theo tháng (${REPORT_YEAR})`}
          series={monthlyData.revenueSeries}
          valueFormatter={(v) => `${v.toLocaleString("vi-VN")}₫`}
        />
        <BarChartCard
          chartKey="bookings"
          title={`Tổng số đơn đã duyệt theo tháng (${REPORT_YEAR})`}
          series={monthlyData.bookingSeries}
          valueFormatter={(v) => v.toLocaleString("vi-VN")}
        />
      </div>
    </div>
  );
}
