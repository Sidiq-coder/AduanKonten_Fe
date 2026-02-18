import { useState } from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { toast } from "sonner@2.0.3";
import { Eye, EyeOff } from "lucide-react";
import { authService } from "../lib/auth";
export function SettingsPage() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("Semua field harus diisi");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Password baru dan konfirmasi tidak cocok");
            return;
        }
        if (newPassword.length < 8) {
            toast.error("Password minimal 8 karakter");
            return;
        }
        
        setIsChangingPassword(true);
        try {
            const response = await authService.changePassword({
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: confirmPassword
            });
            
            toast.success("Password berhasil diubah. Silakan login kembali.");
            
            // Clear form
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            
            // Logout dan redirect ke login setelah 2 detik
            setTimeout(async () => {
                await authService.logout();
                window.location.href = '/login';
            }, 2000);
        } catch (error) {
            console.error('Change password error:', error);
            const errorMessage = error.response?.data?.message 
                || error.response?.data?.errors?.current_password?.[0]
                || "Gagal mengubah password";
            toast.error(errorMessage);
        } finally {
            setIsChangingPassword(false);
        }
    };
    return (<div className="p-8 max-w-[1400px]">
      <div className="mb-8">
        <h1 className="text-foreground mb-2">Pengaturan</h1>
        <p className="text-muted-foreground">Ubah password akun Anda</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Ubah password akun Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Password Saat Ini</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan password saat ini"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Password Baru</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Konfirmasi password baru"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
          <Alert>
            <AlertDescription className="text-sm">
              Password harus minimal 8 karakter dan mengandung kombinasi huruf dan angka untuk keamanan yang lebih baik.
            </AlertDescription>
          </Alert>
          <Button
            onClick={handleChangePassword}
            disabled={isChangingPassword}
            className="bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChangingPassword ? "Mengubah..." : "Ubah Password"}
          </Button>
        </CardContent>
      </Card>
    </div>);
}
