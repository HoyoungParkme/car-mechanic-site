import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Clock, CalendarCheck, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { getDemoUser } from "@/hooks/useAuth";

const SERVICES = [
  "엔진오일 교환", "타이어 교환", "브레이크 점검",
  "배터리 교체", "에어컨 점검", "종합 정밀진단", "기타",
];
const TIME_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

export default function Reservation() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ name: "", phone: "", date: "", time: "", serviceType: "", vehicleModel: "", vehicleNumber: "", notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSelect = (name: string, value: string) =>
    setForm(prev => ({ ...prev, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const user = getDemoUser();
    if (user) {
      await new Promise(r => setTimeout(r, 1000));
      setIsSuccess(true);
      setIsSubmitting(false);
      return;
    }
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ date: form.date, time_slot: form.time, service_type: form.serviceType, vehicle_model: form.vehicleModel, vehicle_number: form.vehicleNumber, notes: form.notes }),
      });
      if (res.status === 401) { setLocation('/login'); return; }
      if (res.ok) setIsSuccess(true);
    } catch { /* ignore */ } finally { setIsSubmitting(false); }
  };

  if (isSuccess) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 py-20 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <Card className="border-0 shadow-2xl ring-1 ring-slate-200">
          <CardContent className="pt-12 pb-12 flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold">예약이 접수되었습니다</h2>
            <p className="text-gray-500">확인 후 기재하신 연락처로 안내 문자를 드립니다.</p>
            <div className="w-full mt-2 p-4 bg-slate-50 rounded-xl text-left text-sm space-y-1">
              <p><span className="text-gray-400">정비 항목:</span> <span className="font-medium">{form.serviceType}</span></p>
              <p><span className="text-gray-400">예약 일시:</span> <span className="font-medium">{form.date} {form.time}</span></p>
              <p><span className="text-gray-400">차량:</span> <span className="font-medium">{form.vehicleModel} {form.vehicleNumber}</span></p>
            </div>
            <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-semibold mt-2" onClick={() => setLocation("/")}>홈으로 돌아가기</Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  return (
    <div className="flex-1 bg-slate-50 py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="grid lg:grid-cols-5 gap-8 lg:gap-12">

          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">정비 예약</h1>
              <p className="mt-2 text-gray-500 text-lg">전문 기술진이 꼼꼼하게 진단해 드립니다.</p>
            </div>
            <Card className="border-0 shadow-md ring-1 ring-slate-100 bg-white">
              <CardContent className="p-6 space-y-5">
                {[
                  { icon: MapPin, title: "주소", content: "충청북도 진천군 진천읍\n문화로 200-8 드림모터스" },
                  { icon: Clock, title: "영업시간", content: "평일 09:00–19:00\n토요일 09:00–17:00\n일요일 및 공휴일 휴무" },
                  { icon: Phone, title: "전화", content: "010-1234-5678" },
                ].map(({ icon: Icon, title, content }) => (
                  <div key={title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{title}</p>
                      <p className="text-gray-800 text-sm font-medium whitespace-pre-line">{content}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right */}
          <div className="lg:col-span-3">
            <Card className="border-0 shadow-xl ring-1 ring-slate-100 bg-white">
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">이름</label>
                      <Input name="name" required placeholder="홍길동" className="h-11 bg-slate-50 border-slate-200" value={form.name} onChange={handleChange} data-testid="input-name" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">연락처</label>
                      <Input name="phone" required placeholder="010-0000-0000" className="h-11 bg-slate-50 border-slate-200" value={form.phone} onChange={handleChange} data-testid="input-phone" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">예약 일자</label>
                      <Input type="date" name="date" required className="h-11 bg-slate-50 border-slate-200" value={form.date} onChange={handleChange} data-testid="input-date" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">예약 시간</label>
                      <Select required onValueChange={v => handleSelect('time', v)} value={form.time}>
                        <SelectTrigger className="h-11 bg-slate-50 border-slate-200" data-testid="select-time">
                          <SelectValue placeholder="시간 선택" />
                        </SelectTrigger>
                        <SelectContent>{TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">정비 항목</label>
                    <Select required onValueChange={v => handleSelect('serviceType', v)} value={form.serviceType}>
                      <SelectTrigger className="h-11 bg-slate-50 border-slate-200" data-testid="select-service">
                        <SelectValue placeholder="어떤 정비가 필요하신가요?" />
                      </SelectTrigger>
                      <SelectContent>{SERVICES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">차량 모델</label>
                      <Input name="vehicleModel" required placeholder="예: 그랜저 IG" className="h-11 bg-slate-50 border-slate-200" value={form.vehicleModel} onChange={handleChange} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">차량 번호</label>
                      <Input name="vehicleNumber" required placeholder="예: 12가 3456" className="h-11 bg-slate-50 border-slate-200" value={form.vehicleNumber} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">요청 사항</label>
                    <Textarea name="notes" placeholder="이상 증상이나 특별히 점검이 필요한 부분을 적어주세요." className="min-h-[100px] resize-none bg-slate-50 border-slate-200" value={form.notes} onChange={handleChange} />
                  </div>
                  <Button type="submit" size="lg" className="w-full h-13 text-base font-bold bg-blue-600 hover:bg-blue-700" disabled={isSubmitting} data-testid="button-submit-reservation">
                    {isSubmitting ? "처리 중..." : <><CalendarCheck className="mr-2 w-5 h-5" />예약 신청하기</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
