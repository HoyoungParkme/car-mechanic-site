import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Wrench, Eye, EyeOff, Phone, CheckCircle2, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";

type Tab = "login" | "signup";

/* ── Small PassModal (PASS 인증 안내) ─────────────────────────────────────── */
function PassInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">PASS 인증 안내</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3 text-sm text-gray-600">
          <p>PASS(패스)는 이동통신사(SKT·KT·LG U+)가 제공하는 모바일 본인인증 서비스입니다.</p>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-xs space-y-1">
            <p className="font-semibold">도입을 위해 필요한 절차:</p>
            <p>1. 이통사 PASS API 제휴 신청 (사업자 등록 필요)</p>
            <p>2. PASS SDK/API 연동 개발</p>
            <p>3. 관리자에게 발급된 키 설정</p>
          </div>
          <p className="text-xs text-gray-400">현재는 SMS 인증번호로 전화번호 인증이 가능합니다.</p>
        </div>
        <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700" onClick={onClose}>확인</Button>
      </div>
    </div>
  );
}

/* ── Login Tab ────────────────────────────────────────────────────────────── */
function LoginPanel({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        queryClient.invalidateQueries({ queryKey: ["me"] });
        window.location.href = data.is_admin ? "/admin" : "/";
      } else {
        const data = await res.json();
        setError(data.detail || "로그인에 실패했습니다.");
      }
    } catch {
      setError("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Social */}
      <Button variant="outline" className="w-full h-11 text-sm font-medium border-slate-200"
        onClick={() => { window.location.href = "/api/auth/google"; }}>
        <img src="https://www.google.com/favicon.ico" className="w-4 h-4 mr-2.5" alt="Google" />
        Google로 로그인
      </Button>
      <Button className="w-full h-11 text-sm font-medium bg-[#FEE500] hover:bg-[#fada00] text-black border-0"
        onClick={() => { window.location.href = "/api/auth/kakao"; }}>
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.73 1.67 5.14 4.2 6.53l-.87 3.22a.3.3 0 0 0 .44.34L9.6 18.6A11.1 11.1 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z" />
        </svg>
        카카오로 로그인
      </Button>
      <Button className="w-full h-11 text-sm font-medium bg-[#03C75A] hover:bg-[#02b050] text-white border-0"
        onClick={() => { window.location.href = "/api/auth/naver"; }}>
        <span className="mr-2 font-extrabold text-base leading-none">N</span>
        네이버로 로그인
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 font-medium">또는</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* ID/PW form */}
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <Input placeholder="아이디" value={username} onChange={e => setUsername(e.target.value)}
          className="h-11 bg-slate-50 border-slate-200" required />
        <div className="relative">
          <Input type={showPw ? "text" : "password"} placeholder="비밀번호"
            value={password} onChange={e => setPassword(e.target.value)}
            className="h-11 bg-slate-50 border-slate-200 pr-10" required />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        <Button type="submit" className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-semibold"
          disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </Button>
      </form>
    </div>
  );
}

/* ── Signup Tab ──────────────────────────────────────────────────────────── */
function SignupPanel({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({ name: "", username: "", password: "", confirm: "", phone: "" });
  const [otp, setOtp] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    setFieldError(p => ({ ...p, [k]: "" }));
  };

  const validateFields = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "이름을 입력해주세요.";
    if (form.username.length < 3) errs.username = "아이디는 3자 이상이어야 합니다.";
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) errs.username = "아이디는 영문·숫자·밑줄만 사용 가능합니다.";
    if (form.password.length < 6) errs.password = "비밀번호는 6자 이상이어야 합니다.";
    if (form.password !== form.confirm) errs.confirm = "비밀번호가 일치하지 않습니다.";
    if (!phoneVerified) errs.phone = "전화번호 인증을 완료해주세요.";
    setFieldError(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSendOtp = async () => {
    if (!form.phone.trim()) { setFieldError(p => ({ ...p, phone: "전화번호를 입력해주세요." })); return; }
    setOtpLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "발송 실패");
      setOtpSent(true);
      setDevOtp(data.dev_otp ?? null);
      if (data.dev_otp) setOtp(data.dev_otp);
      setTimeout(() => otpRef.current?.focus(), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "인증번호 발송 실패");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { setError("6자리 인증번호를 입력해주세요."); return; }
    setVerifyLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, otp_code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "인증 실패");
      setPhoneVerified(true);
      setDevOtp(null);
      setFieldError(p => ({ ...p, phone: "" }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "인증번호 확인 실패");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFields()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: form.name, username: form.username, password: form.password, phone: form.phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "가입 실패");
      queryClient.invalidateQueries({ queryKey: ["me"] });
      window.location.href = "/";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "가입 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showPassModal && <PassInfoModal onClose={() => setShowPassModal(false)} />}

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {/* Name */}
        <div>
          <Input placeholder="이름 (실명)" value={form.name} onChange={set("name")}
            className={`h-11 bg-slate-50 border-slate-200 ${fieldError.name ? "border-red-400" : ""}`} />
          {fieldError.name && <p className="text-xs text-red-500 mt-0.5">{fieldError.name}</p>}
        </div>

        {/* Username */}
        <div>
          <Input placeholder="아이디 (영문·숫자·밑줄, 3자 이상)" value={form.username} onChange={set("username")}
            className={`h-11 bg-slate-50 border-slate-200 ${fieldError.username ? "border-red-400" : ""}`} />
          {fieldError.username && <p className="text-xs text-red-500 mt-0.5">{fieldError.username}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="relative">
            <Input type={showPw ? "text" : "password"} placeholder="비밀번호 (6자 이상)"
              value={form.password} onChange={set("password")}
              className={`h-11 bg-slate-50 border-slate-200 pr-10 ${fieldError.password ? "border-red-400" : ""}`} />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldError.password && <p className="text-xs text-red-500 mt-0.5">{fieldError.password}</p>}
        </div>

        {/* Confirm password */}
        <div>
          <Input type="password" placeholder="비밀번호 확인"
            value={form.confirm} onChange={set("confirm")}
            className={`h-11 bg-slate-50 border-slate-200 ${fieldError.confirm ? "border-red-400" : ""}`} />
          {fieldError.confirm && <p className="text-xs text-red-500 mt-0.5">{fieldError.confirm}</p>}
        </div>

        {/* Phone + OTP */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
          <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />전화번호 인증
          </p>

          {/* PASS button */}
          <button type="button" onClick={() => setShowPassModal(true)}
            className="w-full h-10 rounded-xl border-2 border-dashed border-slate-300 text-sm font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-600 text-white text-[10px] font-black">P</span>
            PASS로 본인인증
            <Info className="w-3.5 h-3.5 opacity-50" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] text-slate-400 font-medium">또는 SMS 인증</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Phone number row */}
          <div className="flex gap-2">
            <Input placeholder="010-0000-0000" value={form.phone} onChange={set("phone")}
              disabled={phoneVerified}
              className={`flex-1 h-10 bg-white border-slate-200 text-sm ${fieldError.phone ? "border-red-400" : ""} ${phoneVerified ? "text-green-600 font-semibold" : ""}`} />
            <Button type="button" onClick={handleSendOtp} disabled={otpLoading || phoneVerified}
              className="h-10 px-3 shrink-0 bg-blue-600 hover:bg-blue-700 text-xs font-semibold whitespace-nowrap">
              {otpLoading ? "발송중..." : phoneVerified ? "완료" : otpSent ? "재발송" : "인증번호 발송"}
            </Button>
          </div>
          {fieldError.phone && <p className="text-xs text-red-500">{fieldError.phone}</p>}

          {/* OTP input */}
          {otpSent && !phoneVerified && (
            <div className="space-y-1.5">
              {devOtp && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                  <Info className="w-3 h-3 shrink-0" />
                  <span>테스트 모드: 인증번호 <strong>{devOtp}</strong>이 자동 입력되었습니다.</span>
                </div>
              )}
              <div className="flex gap-2">
                <Input ref={otpRef} placeholder="인증번호 6자리" maxLength={6}
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 h-10 bg-white border-slate-200 text-sm tracking-widest font-mono text-center" />
                <Button type="button" onClick={handleVerifyOtp} disabled={verifyLoading || otp.length !== 6}
                  className="h-10 px-3 shrink-0 bg-green-600 hover:bg-green-700 text-xs font-semibold">
                  {verifyLoading ? "확인중..." : "확인"}
                </Button>
              </div>
            </div>
          )}

          {phoneVerified && (
            <div className="flex items-center gap-1.5 text-xs text-green-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />전화번호 인증이 완료되었습니다.
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

        <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold"
          disabled={loading}>
          {loading ? "처리 중..." : "가입하기"}
        </Button>
      </form>
    </>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function Login() {
  const [tab, setTab] = useState<Tab>("login");
  const [, setLocation] = useLocation();

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 p-4 py-10">
      <Card className="w-full max-w-md shadow-xl border-0 ring-1 ring-slate-200">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
              <Wrench className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="space-y-0.5">
            <CardTitle className="text-xl font-bold">드림모터스</CardTitle>
            <CardDescription className="text-sm">충청북도 진천군 진천읍 문화로 200-8</CardDescription>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
            {(["login", "signup"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {t === "login" ? "로그인" : "회원가입"}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-3 pb-6">
          {tab === "login" ? (
            <LoginPanel onSuccess={() => setLocation("/")} />
          ) : (
            <SignupPanel onSuccess={() => setLocation("/")} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
