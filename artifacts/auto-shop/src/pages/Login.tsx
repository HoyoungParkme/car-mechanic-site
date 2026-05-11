import { useState } from "react";
import { useLocation } from "wouter";
import { Wrench, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  const [, setLocation] = useLocation();
  const [showAdmin, setShowAdmin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        window.location.href = "/admin";
      } else {
        const data = await res.json();
        setError(data.detail || "로그인에 실패했습니다.");
      }
    } catch {
      setError("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 ring-1 ring-slate-200">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
              <Wrench className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold">드림모터스</CardTitle>
            <CardDescription className="text-base">소셜 계정으로 간편하게 로그인하세요</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-4">
          {/* Google */}
          <Button
            variant="outline"
            className="w-full h-12 text-sm font-medium border-slate-200 hover:bg-slate-50"
            onClick={() => { window.location.href = "/api/auth/google"; }}
            data-testid="button-login-google"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4 mr-2.5" alt="Google" />
            Google로 로그인
          </Button>

          {/* Kakao */}
          <Button
            className="w-full h-12 text-sm font-medium bg-[#FEE500] hover:bg-[#fada00] text-black border-0"
            onClick={() => { window.location.href = "/api/auth/kakao"; }}
            data-testid="button-login-kakao"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.73 1.67 5.14 4.2 6.53l-.87 3.22a.3.3 0 0 0 .44.34L9.6 18.6A11.1 11.1 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z" />
            </svg>
            카카오로 로그인
          </Button>

          {/* Naver */}
          <Button
            className="w-full h-12 text-sm font-medium bg-[#03C75A] hover:bg-[#02b050] text-white border-0"
            onClick={() => { window.location.href = "/api/auth/naver"; }}
            data-testid="button-login-naver"
          >
            <span className="mr-2 font-extrabold text-base leading-none">N</span>
            네이버로 로그인
          </Button>

          {/* Admin login toggle */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdmin(!showAdmin)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors py-2"
            >
              <Lock className="w-3 h-3" />
              관리자 로그인
              {showAdmin ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showAdmin && (
              <form onSubmit={handleAdminLogin} className="mt-2 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <Input
                  placeholder="아이디"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="h-10 bg-white text-sm"
                  required
                  data-testid="input-admin-username"
                />
                <Input
                  type="password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-10 bg-white text-sm"
                  required
                  data-testid="input-admin-password"
                />
                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                <Button
                  type="submit"
                  className="w-full h-10 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold"
                  disabled={loading}
                  data-testid="button-admin-login"
                >
                  {loading ? "로그인 중..." : "관리자 로그인"}
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
