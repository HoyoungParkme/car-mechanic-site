import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SHOP, LOGO_URL } from "@/data/shop";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  // GitHub Pages 서브경로 대응: BASE_URL을 anchor link 앞에 붙여 홈으로 정확히 이동.
  // dev/도메인 연결 시 BASE_URL='/'이므로 자연스럽게 '/#services' 형태로 동작.
  const HOME_BASE = import.meta.env.BASE_URL;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white text-gray-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            aria-label={SHOP.name}
            data-testid="logo-button"
          >
            <img src={LOGO_URL} alt={SHOP.name} className="h-12 w-auto object-contain" />
          </button>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">홈</Link>
            <a href={`${HOME_BASE}#services`} className="hover:text-blue-600 transition-colors">서비스</a>
            <a href={`${HOME_BASE}#photos`} className="hover:text-blue-600 transition-colors">사진</a>
            <a href={`${HOME_BASE}#location`} className="hover:text-blue-600 transition-colors">오시는길</a>
            <Link href="/reservation" className="hover:text-blue-600 transition-colors font-semibold text-blue-600">예약 안내</Link>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm">
              <a href={SHOP.phoneTel} data-testid="button-nav-call">전화 예약</a>
            </Button>
            <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-3 text-sm font-medium text-gray-600">
            <Link href="/" onClick={() => setMobileOpen(false)} className="py-2">홈</Link>
            <a href={`${HOME_BASE}#services`} onClick={() => setMobileOpen(false)} className="py-2">서비스</a>
            <a href={`${HOME_BASE}#photos`} onClick={() => setMobileOpen(false)} className="py-2">사진</a>
            <a href={`${HOME_BASE}#location`} onClick={() => setMobileOpen(false)} className="py-2">오시는길</a>
            <Link href="/reservation" onClick={() => setMobileOpen(false)} className="py-2 text-blue-600 font-semibold">예약 안내</Link>
          </div>
        )}
      </nav>

      <main className="flex-1 flex flex-col">{children}</main>

      <footer className="bg-gray-900 text-white pt-14 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-10 pb-10 border-b border-white/10">
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-3 inline-block">
                <img src={LOGO_URL} alt={SHOP.name} className="h-16 w-auto object-contain" />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                타협하지 않는 품질과 정직한 진단.<br />고객님의 안전한 주행을 책임집니다.
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <h4 className="font-semibold text-gray-300 mb-3">바로가기</h4>
              <Link href="/" className="block text-gray-400 hover:text-white transition-colors">홈</Link>
              <Link href="/reservation" className="block text-gray-400 hover:text-white transition-colors">예약 안내</Link>
              <a href={SHOP.phoneTel} className="block text-gray-400 hover:text-white transition-colors">전화 걸기</a>
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <h4 className="font-semibold text-gray-300 mb-3">연락처</h4>
              <p>{SHOP.address}</p>
              <p className="text-white font-bold text-base">{SHOP.phone}</p>
              <p>평일 {SHOP.weekdayHours} | 토요일 {SHOP.saturdayHours}</p>
              <p>{SHOP.holidayNote}</p>
            </div>
          </div>
          <p className="text-center text-gray-500 text-xs mt-8">© {new Date().getFullYear()} {SHOP.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
