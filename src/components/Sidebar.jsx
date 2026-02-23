import { Home, Ticket, LogOut, Settings, ChevronDown, Users, ClipboardList } from "lucide-react";
import { UnilaLogo } from "./UnilaLogo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "./ui/dropdown-menu";
export function Sidebar({ currentPage, onNavigate, onLogout }) {
  return (<div className="w-[260px] min-h-screen sticky top-0 self-start bg-gradient-to-b from-[#003D82] to-[#002E5B] text-white flex flex-col shadow-xl flex-shrink-0">
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-12 h-12 bg-white/90 rounded-lg flex items-center justify-center p-1.5">
          <UnilaLogo size={48}/>
        </div>
        <div className="flex flex-col">
          <span className="text-sm">Universitas Lampung</span>
          <span className="text-xs text-white/70">Aduan Konten</span>
        </div>
      </div>
      
      <div className="p-5">
        <p className="text-xs text-white/60 mb-4 uppercase tracking-wider">Menu</p>
        
        <nav className="space-y-2">
          <button onClick={() => onNavigate("dashboard")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === "dashboard"
            ? "bg-white text-primary shadow-sm"
            : "text-white/90 hover:bg-white/15"}`}>
            <Home size={20}/>
            <span className="text-sm">Dashboard</span>
          </button>
          
          <button onClick={() => onNavigate("tickets")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === "tickets" || currentPage === "ticket-detail"
            ? "bg-white text-primary shadow-sm"
            : "text-white/90 hover:bg-white/15"}`}>
            <Ticket size={20}/>
            <span className="text-sm">Tiket</span>
          </button>

          <button onClick={() => onNavigate("create-ticket")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === "create-ticket"
            ? "bg-white text-primary shadow-sm"
            : "text-white/90 hover:bg-white/15"}`}>
            <Ticket size={20}/>
            <span className="text-sm">Buat Tiket</span>
          </button>

          <button onClick={() => onNavigate("assignments")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === "assignments"
            ? "bg-white text-primary shadow-sm"
            : "text-white/90 hover:bg-white/15"}`}>
            <ClipboardList size={20}/>
            <span className="text-sm">Penugasan</span>
          </button>

          <button onClick={() => onNavigate("manage-admins")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === "manage-admins"
            ? "bg-white text-primary shadow-sm"
            : "text-white/90 hover:bg-white/15"}`}>
            <Users size={20}/>
            <span className="text-sm">Manajemen Admin</span>
          </button>
          
        </nav>
      </div>
      
      <div className="mt-auto p-5">
        {onLogout && (<DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-sm">SA</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm">Super Admin</p>
                </div>
                <ChevronDown size={16} className="text-white/70"/>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56 bg-white border border-gray-200 shadow-lg mb-2 ml-5">
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-[#003D82] flex items-center justify-center">
                    <span className="text-white">SA</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">Super Admin</p>
                    <p className="text-xs text-gray-500">admin@aduankonten.com</p>
                  </div>
                </div>
              </div>
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 cursor-pointer" onClick={() => onNavigate("settings")}>
                <Settings size={16} className="text-gray-600"/>
                <span className="text-sm">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 cursor-pointer text-red-600 focus:text-red-600" onClick={onLogout}>
                <LogOut size={16}/>
                <span className="text-sm">Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>)}
      </div>
    </div>);
}
