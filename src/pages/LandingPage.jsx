import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { UnilaLogo } from "../components/UnilaLogo";

const NAV_ITEMS = [
  { path: "/", label: "Beranda" },
  { path: "/kirim-laporan", label: "Kirim Laporan" },
  { path: "/cek-status", label: "Cek Status" },
];

export function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path));
  const getNavButtonClass = (path) => {
    const base = "rounded-lg h-9 px-3 sm:px-4 transition-all text-xs sm:text-sm ";
    const state = isActive(path)
      ? "bg-[#003D82] text-white hover:bg-[#002E5B]"
      : "text-[#2D3748] hover:bg-gray-100";
    return base + state;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white border-b-2 border-[#003D82] sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <UnilaLogo size={40} />
              <div>
                <h2 className="text-[#003D82] text-sm sm:text-base">Sistem Aduan Konten</h2>
                <p className="text-xs text-[#2D3748]">Universitas Lampung</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              {NAV_ITEMS.map((item) => (
                <Button
                  key={item.path}
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(item.path)}
                  className={getNavButtonClass(item.path)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gradient-to-r from-[#003D82] to-[#002855] text-white py-8 border-t-2 border-[#003D82]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UnilaLogo size={36} />
                <div>
                  <h4 className="text-white text-sm">Aduan Konten</h4>
                  <p className="text-xs text-white/70">Universitas Lampung</p>
                </div>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Platform resmi untuk melaporkan konten bermasalah di lingkungan Universitas Lampung
              </p>
            </div>

            <div>
              <h5 className="text-white mb-3 text-sm">Kontak</h5>
              <div className="space-y-1.5 text-xs text-white/70">
                <p>Email: aduan@unila.ac.id</p>
                <p>Telepon: (0721) 123456</p>
                <p>Jl. Prof. Dr. Ir. Sumantri Brojonegoro No.1</p>
                <p>Bandar Lampung, 35141</p>
              </div>
            </div>

            <div>
              <h5 className="text-white mb-3 text-sm">Jam Operasional</h5>
              <div className="space-y-1.5 text-xs text-white/70">
                <p>Senin - Jumat: 08:00 - 16:00 WIB</p>
                <p>Sabtu: 08:00 - 12:00 WIB</p>
                <p>Minggu & Libur: Tutup</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 mt-6 pt-6 text-center text-xs text-white/70">
            <p>&copy; 2025 Universitas Lampung. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
