import { useLocation } from "wouter";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { setDemoUser } from "@/hooks/useAuth";

export default function Login() {
  const [, setLocation] = useLocation();

  const loginAsCustomer = () => {
    setDemoUser({ id: 1, name: "홍길동", email: "demo@dreammotors.kr", profile_image: null, is_admin: false });
    setLocation("/");
  };

  const loginAsAdmin = () => {
    setDemoUser({ id: 99, name: "관리자", email: "admin@dreammotors.kr", profile_image: null, is_admin: true });
    setLocation("/admin");
  };

  const handleGoogle = () => { window.location.href = '/api/auth/google'; };
  const handleKakao  = () => { window.location.href = '/api/auth/kakao'; };

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
            <CardDescription className="text-base">로그인 후 예약을 이용하실 수 있습니다</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-4">
          {/* Demo buttons */}
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 space-y-3">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide text-center">데모 체험</p>
            <Button
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              onClick={loginAsCustomer}
              data-testid="button-demo-customer"
            >
              고객으로 체험하기
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold"
              onClick={loginAsAdmin}
              data-testid="button-demo-admin"
            >
              관리자로 체험하기
            </Button>
          </div>

          <div className="relative flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 shrink-0">또는 소셜 로그인</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <Button
            variant="outline"
            className="w-full h-12 text-sm font-medium border-slate-200"
            onClick={handleGoogle}
            data-testid="button-login-google"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4 mr-2" alt="Google" />
            Google로 로그인
          </Button>
          <Button
            className="w-full h-12 text-sm font-medium bg-[#FEE500] hover:bg-[#fada00] text-black border-0"
            onClick={handleKakao}
            data-testid="button-login-kakao"
          >
            카카오로 로그인
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
