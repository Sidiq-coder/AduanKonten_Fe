import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { UnilaLogo } from "./UnilaLogo";
import { useAuth } from "../contexts/AuthContext";
export function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const validateForm = () => {
        const newErrors = {};
        if (!email.trim()) {
          newErrors.email = "Email wajib diisi";
        }
        if (!password.trim()) {
            newErrors.password = "Password wajib diisi";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleLogin = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Mohon lengkapi form dengan benar", {
                icon: <AlertCircle size={20} className="text-red-500"/>,
            });
            return;
        }
        setIsLoading(true);
        try {
            await login({ email, password });
            toast.success("Login berhasil!", {
                description: "Selamat datang kembali",
                icon: <CheckCircle2 size={20} className="text-green-500"/>,
            });
            // Redirect based on user role (handled by AuthContext)
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const roleDestinations = {
              super_admin: '/admin',
              admin: '/admin',
              admin_fakultas: '/fakultas',
              admin_unit: '/fakultas',
              fakultas: '/fakultas',
            };
            const destination = roleDestinations[user.role] || '/tickets';
            navigate(destination);
        }
        catch (error) {
            toast.error("Login gagal", {
                description: error.message || "Email atau password salah",
                icon: <AlertCircle size={20} className="text-red-500"/>,
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleInputChange = (field, value) => {
        if (field === "email") {
          setEmail(value);
        }
        else {
            setPassword(value);
        }
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };
    return (<div className="min-h-screen bg-gradient-to-br from-[#F8F9FE] via-[#F0F4FF] to-[#E8EEFF] flex items-center justify-center p-6">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#E0E7FF] rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#DDD6FE] rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <Button onClick={() => navigate('/')} variant="ghost" className="mb-6 text-muted-foreground hover:text-foreground hover:bg-white/50 rounded-xl">
          <ArrowLeft size={18} className="mr-2"/>
          Kembali ke Beranda
        </Button>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-gray-100/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-[#003D82] px-8 py-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg p-2">
                <UnilaLogo size={64}/>
              </div>
              <h1 className="text-white mb-2">Login Admin</h1>
              <p className="text-white/80 text-sm">Universitas Lampung - Aduan Konten</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground flex items-center gap-2">
                <User size={16} className="text-primary"/>
                Email
              </Label>
              <div className="relative">
                <Input id="email" type="email" placeholder="Masukkan email admin" value={email} onChange={(e) => handleInputChange("email", e.target.value)} className={`bg-[#F9FAFB] border-gray-200 rounded-xl h-12 pl-4 pr-4 focus:bg-white transition-colors ${errors.email ? "border-red-500 focus:ring-red-500" : ""}`} disabled={isLoading}/>
              </div>
              {errors.email && (<p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={12}/>
                  {errors.email}
                </p>)}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground flex items-center gap-2">
                <Lock size={16} className="text-primary"/>
                Password
              </Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Masukkan password" value={password} onChange={(e) => handleInputChange("password", e.target.value)} className={`bg-[#F9FAFB] border-gray-200 rounded-xl h-12 pl-4 pr-12 focus:bg-white transition-colors ${errors.password ? "border-[#F472B6] focus:ring-[#F472B6]" : ""}`} disabled={isLoading}/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors" disabled={isLoading}>
                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
              {errors.password && (<p className="text-xs text-[#F472B6] flex items-center gap-1 mt-1">
                  <AlertCircle size={12}/>
                  {errors.password}
                </p>)}
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-primary to-[#003D82] hover:from-[#003D82] hover:to-[#002855] text-white h-12 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? (<>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Memproses...
                </>) : (<>
                  <Shield size={18} className="mr-2"/>
                  Masuk
                </>)}
            </Button>
          </form>
        </div>
      </div>
    </div>);
}

export default LoginPage;
