import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Wrench, User, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    queryClient.invalidateQueries({ queryKey: ['me'] });
    setLocation('/');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground selection:bg-primary/30">
      <nav className="sticky top-0 w-full z-50 bg-[#111827] text-white shadow-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:text-primary transition-colors">
            <Wrench className="w-6 h-6 text-primary" />
            <span data-testid="text-logo">드림모터스</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/" className="hover:text-primary transition-colors">홈</Link>
            <a href="/#services" className="hover:text-primary transition-colors">서비스</a>
            <a href="/#photos" className="hover:text-primary transition-colors">사진</a>
            <a href="/#location" className="hover:text-primary transition-colors">오시는길</a>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full border-border/20 bg-muted/10 hover:bg-muted/20">
                    <User className="h-5 w-5 text-white" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name || '고객님'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer w-full flex items-center">
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          관리자
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="outline" className="hidden md:flex border-border/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link href="/login" data-testid="link-nav-login">로그인</Link>
              </Button>
            )}
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              <Link href="/reservation" data-testid="button-nav-reserve">예약하기</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="bg-[#111827] text-white py-16 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-white/10 pb-8 mb-8">
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Wrench className="w-8 h-8 text-primary" />
              <span>드림모터스</span>
            </div>
            <div className="flex gap-6 text-sm font-medium text-white/70">
              <Link href="/" className="hover:text-primary transition-colors">홈</Link>
              <Link href="/reservation" className="hover:text-primary transition-colors">예약하기</Link>
              {isAdmin && <Link href="/admin" className="hover:text-primary transition-colors">관리자</Link>}
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-sm text-white/60">
            <div className="space-y-2 text-center md:text-left">
              <p>충청북도 진천군 진천읍 문화로 200-8 드림모터스</p>
              <p>대표전화: 010-1234-5678</p>
            </div>
            <div className="text-center md:text-right space-y-2">
              <p>평일 09:00 - 19:00 | 토요일 09:00 - 17:00</p>
              <p>일요일 및 공휴일 휴무</p>
              <p className="opacity-50 mt-4">© {new Date().getFullYear()} Dream Motors. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
