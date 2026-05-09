import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";

export default function Login() {
  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleKakaoLogin = () => {
    window.location.href = '/api/auth/kakao';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 font-sans">
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Wrench className="w-8 h-8" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight">드림모터스</CardTitle>
            <CardDescription className="text-base">예약을 위해 로그인이 필요합니다</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full h-14 text-base font-medium"
            onClick={handleGoogleLogin}
            data-testid="button-login-google"
          >
            Google로 로그인
          </Button>
          <Button
            className="w-full h-14 text-base font-medium bg-[#FEE500] hover:bg-[#FEE500]/90 text-black border-[#FEE500]"
            onClick={handleKakaoLogin}
            data-testid="button-login-kakao"
          >
            카카오로 로그인
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
