import { useAuth, clearDemoUser } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Wrench, User, LogOut, ShieldCheck, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    clearDemoUser();
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setLocation('/');
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white text-gray-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-xl text-gray-900 hover:text-blue-600 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span data-testid="text-logo">드림모터스</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">홈</Link>
            <a href="/#services" className="hover:text-blue-600 transition-colors">서비스</a>
            <a href="/#photos" className="hover:text-blue-600 transition-colors">사진</a>
            <a href="/#location" className="hover:text-blue-600 transition-colors">오시는길</a>
            <Link href="/reservation" className="hover:text-blue-600 transition-colors font-semibold text-blue-600">예약</Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 rounded-full px-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium hidden sm:block">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer flex items-center">
                        <ShieldCheck className="mr-2 h-4 w-4 text-blue-600" />관리자 패널
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer focus:text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="ghost" size="sm" className="hidden md:flex text-gray-600">
                <Link href="/login" data-testid="link-nav-login">로그인</Link>
              </Button>
            )}
            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm">
              <Link href="/reservation" data-testid="button-nav-reserve">예약하기</Link>
            </Button>
            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-3 text-sm font-medium text-gray-600">
            <Link href="/" onClick={() => setMobileOpen(false)} className="py-2">홈</Link>
            <a href="/#services" onClick={() => setMobileOpen(false)} className="py-2">서비스</a>
            <a href="/#photos" onClick={() => setMobileOpen(false)} className="py-2">사진</a>
            <a href="/#location" onClick={() => setMobileOpen(false)} className="py-2">오시는길</a>
            {!user && <Link href="/login" onClick={() => setMobileOpen(false)} className="py-2 text-blue-600 font-semibold">로그인</Link>}
          </div>
        )}
      </nav>

      <main className="flex-1 flex flex-col">{children}</main>

      <footer className="bg-gray-900 text-white pt-14 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-10 pb-10 border-b border-white/10">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xl font-extrabold">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-white" />
                </div>
                드림모터스
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                타협하지 않는 품질과 정직한 진단.<br />고객님의 안전한 주행을 책임집니다.
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <h4 className="font-semibold text-gray-300 mb-3">바로가기</h4>
              <Link href="/" className="block text-gray-400 hover:text-white transition-colors">홈</Link>
              <Link href="/reservation" className="block text-gray-400 hover:text-white transition-colors">예약하기</Link>
              {isAdmin && <Link href="/admin" className="block text-gray-400 hover:text-white transition-colors">관리자</Link>}
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <h4 className="font-semibold text-gray-300 mb-3">연락처</h4>
              <p>충청북도 진천군 진천읍 문화로 200-8</p>
              <p className="text-white font-bold text-base">010-1234-5678</p>
              <p>평일 09:00–19:00 | 토요일 09:00–17:00</p>
              <p>일요일 및 공휴일 휴무</p>
            </div>
          </div>
          <p className="text-center text-gray-500 text-xs mt-8">© {new Date().getFullYear()} Dream Motors. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
