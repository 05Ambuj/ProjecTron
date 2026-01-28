import { Outlet } from "react-router-dom";
import AppSidebar from "../components/layout/AppSidebar";
import TopBar from "../components/layout/Topbar";

export default function AppLayout() {
  return (
     <div className="relative flex min-h-screen bg-neutral-100">
       {/* Hover zone */}
       <div className="group fixed inset-y-0 left-0 z-40 w-64">
         <AppSidebar />
       </div>
 
       {/* Main content */}
      <div
        className="
          flex flex-col flex-1 min-w-0
          ml-16 group-hover:ml-64
          transition-[margin] duration-300 ease-out
        "
      >
         <TopBar />
        <main className="flex-1 p-6 overflow-x-hidden min-w-0">
           <Outlet />
         </main>
       </div>
     </div>
   );
 }
 