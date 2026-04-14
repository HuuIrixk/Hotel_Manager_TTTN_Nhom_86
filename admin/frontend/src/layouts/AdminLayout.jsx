import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import Dashboard from "../pages/Dashboard";
import Rooms from "../pages/Rooms";
import Bookings from "../pages/Bookings";
import Users from "../pages/Users";
import Reports from "../pages/Reports";
import KnowledgeBase from "../pages/KnowledgeBase";
import Contact from "../pages/contact";
import ReviewsManagement from "../pages/ReviewsManagement";

export default function AdminLayout() {
  const [page, setPage] = useState("dashboard");

  const render = {
    dashboard: <Dashboard />,
    rooms: <Rooms />,
    bookings: <Bookings />,
    users: <Users />,
    reports: <Reports />,
    contact: <Contact />,
    reviews: <ReviewsManagement />,
    knowledge: <KnowledgeBase />,
  };

  return (
    <div className="admin-wrapper">
      <Sidebar page={page} setPage={setPage} />

      <div className="admin-content">
        <Topbar />
        <main className="admin-main fade-in">{render[page]}</main>
      </div>
    </div>
  );
}
