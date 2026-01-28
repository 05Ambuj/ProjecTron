import { Outlet } from "react-router-dom";
import TopBar from "../components/layout/Topbar";
import AppSidebar from "../components/layout/AppSidebar";

export default function AdminLayout() {

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main content wrapper */}
      <div className="ml-16 flex flex-col min-h-screen">
        <TopBar />

        <main className="flex-1 px-8 py-3">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
