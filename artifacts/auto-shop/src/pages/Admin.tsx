import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, CalendarCheck, Image, Star, MapPin, Pencil, Trash2, Plus, Check } from "lucide-react";
import { motion } from "framer-motion";

/* ─── Demo Data ─── */
const DEMO_RESERVATIONS = [
  { id: 1, user_name: "김민준", user_email: "kim@example.com", date: "2026-05-12", time_slot: "10:00", service_type: "엔진오일 교환", vehicle_model: "쏘나타", vehicle_number: "12가 3456", status: "confirmed" },
  { id: 2, user_name: "이수연", user_email: "lee@example.com", date: "2026-05-13", time_slot: "14:00", service_type: "타이어 교환", vehicle_model: "그랜저 IG", vehicle_number: "78나 9012", status: "pending" },
  { id: 3, user_name: "박지훈", user_email: "park@example.com", date: "2026-05-14", time_slot: "11:00", service_type: "브레이크 점검", vehicle_model: "아반떼 CN7", vehicle_number: "34다 5678", status: "pending" },
  { id: 4, user_name: "최유진", user_email: "choi@example.com", date: "2026-05-15", time_slot: "15:00", service_type: "배터리 교체", vehicle_model: "K5", vehicle_number: "56라 7890", status: "cancelled" },
  { id: 5, user_name: "정호성", user_email: "jung@example.com", date: "2026-05-16", time_slot: "09:00", service_type: "종합 정밀진단", vehicle_model: "팰리세이드", vehicle_number: "90마 1234", status: "confirmed" },
];
const DEMO_PHOTOS = [
  { id: 1, url: "https://images.unsplash.com/photo-1617886903355-9354bb57751f?w=400&q=80", caption: "엔진룸 정밀 진단" },
  { id: 2, url: "https://images.unsplash.com/photo-1632823471565-1ecdf5c6da2f?w=400&q=80", caption: "서스펜션 점검" },
  { id: 3, url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&q=80", caption: "최신 진단 장비" },
  { id: 4, url: "https://images.unsplash.com/photo-1504222490345-c075b7b408c8?w=400&q=80", caption: "숙련된 기술진" },
  { id: 5, url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80", caption: "고급 합성유 교환" },
  { id: 6, url: "https://images.unsplash.com/photo-1636040758814-ed6a8acada34?w=400&q=80", caption: "깨끗한 작업 환경" },
];
const DEMO_EXPERTISE = [
  { id: 1, title: "엔진 전문 정비", description: "최신 진단 장비를 이용한 정밀 엔진 점검 및 수리", icon_name: "Settings" },
  { id: 2, title: "타이어 & 얼라이먼트", description: "국내외 유명 브랜드 타이어 취급 및 정밀 휠 얼라이먼트", icon_name: "CircleDot" },
  { id: 3, title: "브레이크 시스템", description: "브레이크 패드, 디스크, 캘리퍼 전문 교환 및 점검", icon_name: "ShieldCheck" },
  { id: 4, title: "에어컨 / 냉난방", description: "에어컨 가스 충전, 냉매 교환, 히터 점검 서비스", icon_name: "Wind" },
  { id: 5, title: "오일 & 소모품", description: "엔진오일, 미션오일, 냉각수 등 모든 소모품 교환", icon_name: "Droplets" },
  { id: 6, title: "전기 / 전장 시스템", description: "배터리 교환, ECU 점검, 전기 배선 수리 전문", icon_name: "Zap" },
];
const DEMO_SHOP_INFO = { address: "충청북도 진천군 진천읍 문화로 200-8", phone: "010-1234-5678", weekday_hours: "09:00 - 19:00", saturday_hours: "09:00 - 17:00", directions: "진천 나들목에서 5분, 진천 문화체육센터 맞은편" };

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:   { label: "대기중", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  confirmed: { label: "확정됨", cls: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "취소됨", cls: "bg-red-100 text-red-700 border-red-200" },
};

/* ─── Sub-components ─── */
function ReservationsTab() {
  const [items, setItems] = useState(DEMO_RESERVATIONS);
  const cycle = (id: number) =>
    setItems(prev => prev.map(r => r.id === id
      ? { ...r, status: r.status === "pending" ? "confirmed" : r.status === "confirmed" ? "cancelled" : "pending" }
      : r));

  return (
    <Card className="border-0 shadow-sm ring-1 ring-slate-100">
      <CardHeader><CardTitle className="text-lg">예약 관리 ({items.length}건)</CardTitle></CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{["고객명", "일시", "서비스", "차량", "상태", "변경"].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map(r => {
                const s = STATUS_MAP[r.status] ?? { label: r.status, cls: "bg-gray-100 text-gray-600" };
                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{r.user_name}</td>
                    <td className="px-4 py-3 text-gray-500">{r.date} {r.time_slot}</td>
                    <td className="px-4 py-3 text-gray-700">{r.service_type}</td>
                    <td className="px-4 py-3 text-gray-500">{r.vehicle_model}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${s.cls}`}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => cycle(r.id)} className="text-blue-600 hover:text-blue-700 h-7 px-2 text-xs">
                        상태 변경
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function PhotosTab() {
  const [photos, setPhotos] = useState(DEMO_PHOTOS);
  const [newUrl, setNewUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [adding, setAdding] = useState(false);

  const add = () => {
    if (!newUrl.trim()) return;
    setPhotos(prev => [...prev, { id: Date.now(), url: newUrl.trim(), caption: newCaption.trim() }]);
    setNewUrl(""); setNewCaption(""); setAdding(false);
  };
  const del = (id: number) => setPhotos(prev => prev.filter(p => p.id !== id));

  return (
    <Card className="border-0 shadow-sm ring-1 ring-slate-100">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">사진 관리 ({photos.length}장)</CardTitle>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 gap-1" onClick={() => setAdding(!adding)}>
          <Plus className="w-3.5 h-3.5" />사진 추가
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {adding && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
            <Input placeholder="이미지 URL" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="bg-white" />
            <Input placeholder="캡션 (선택)" value={newCaption} onChange={e => setNewCaption(e.target.value)} className="bg-white" />
            <div className="flex gap-2">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={add}><Check className="w-4 h-4 mr-1" />저장</Button>
              <Button size="sm" variant="outline" onClick={() => setAdding(false)}>취소</Button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {photos.map(p => (
            <div key={p.id} className="group relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm border border-slate-100">
              <img src={p.url} alt={p.caption} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                <p className="text-white text-xs text-center font-medium">{p.caption}</p>
                <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => del(p.id)}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" />삭제
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ExpertiseTab() {
  const [items, setItems] = useState(DEMO_EXPERTISE);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState({ title: "", description: "" });

  const startEdit = (item: typeof items[0]) => { setEditing(item.id); setDraft({ title: item.title, description: item.description ?? "" }); };
  const save = () => {
    if (editing === null) return;
    setItems(prev => prev.map(i => i.id === editing ? { ...i, ...draft } : i));
    setEditing(null);
  };
  const del = (id: number) => setItems(prev => prev.filter(i => i.id !== id));

  return (
    <Card className="border-0 shadow-sm ring-1 ring-slate-100">
      <CardHeader><CardTitle className="text-lg">전문기술 관리</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            {editing === item.id ? (
              <div className="space-y-2">
                <Input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} className="bg-white font-semibold" />
                <Textarea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} className="bg-white resize-none text-sm" rows={2} />
                <div className="flex gap-2">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-7 text-xs" onClick={save}><Check className="w-3.5 h-3.5 mr-1" />저장</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditing(null)}>취소</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{item.description}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-500" onClick={() => startEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400" onClick={() => del(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ShopInfoTab() {
  const [info, setInfo] = useState(DEMO_SHOP_INFO);
  const [saved, setSaved] = useState(false);
  const handle = (k: keyof typeof info) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setInfo(prev => ({ ...prev, [k]: e.target.value }));
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <Card className="border-0 shadow-sm ring-1 ring-slate-100">
      <CardHeader><CardTitle className="text-lg">매장 정보</CardTitle></CardHeader>
      <CardContent className="space-y-4 max-w-xl">
        {([
          { key: "address", label: "주소" },
          { key: "phone", label: "전화번호" },
          { key: "weekday_hours", label: "평일 영업시간" },
          { key: "saturday_hours", label: "토요일 영업시간" },
        ] as { key: keyof typeof info; label: string }[]).map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
            <Input value={info[key]} onChange={handle(key)} className="bg-slate-50" />
          </div>
        ))}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">찾아오는 길</label>
          <Textarea value={info.directions} onChange={handle("directions")} className="bg-slate-50 resize-none" rows={3} />
        </div>
        <Button className={`w-full h-11 font-semibold transition-all ${saved ? "bg-green-500 hover:bg-green-600" : "bg-blue-600 hover:bg-blue-700"}`} onClick={save} data-testid="button-save-shopinfo">
          {saved ? <><Check className="w-4 h-4 mr-2" />저장되었습니다</> : "저장하기"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─── Main ─── */
export default function Admin() {
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 py-20 px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto"><Wrench className="w-8 h-8 text-blue-600" /></div>
          <h2 className="text-xl font-bold">로그인이 필요합니다</h2>
          <p className="text-gray-500 text-sm">관리자 패널에 접근하려면 먼저 로그인해주세요.</p>
          <Button className="bg-blue-600 hover:bg-blue-700 font-semibold" onClick={() => setLocation("/login")}>로그인하기</Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 py-20 px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto"><Wrench className="w-8 h-8 text-red-500" /></div>
          <h2 className="text-xl font-bold">접근 권한 없음</h2>
          <p className="text-gray-500 text-sm">관리자 계정으로 로그인해야 합니다.</p>
          <Button variant="outline" onClick={() => setLocation("/login")}>관리자로 로그인</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">관리자 패널</h1>
            <p className="text-sm text-gray-400">{user.name} 님으로 접속 중</p>
          </div>
        </motion.div>

        <Tabs defaultValue="reservations">
          <TabsList className="grid grid-cols-4 w-full max-w-lg mb-6 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <TabsTrigger value="reservations" className="text-xs sm:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg">
              <CalendarCheck className="w-4 h-4 mr-1.5 hidden sm:inline" />예약
            </TabsTrigger>
            <TabsTrigger value="photos" className="text-xs sm:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg">
              <Image className="w-4 h-4 mr-1.5 hidden sm:inline" />사진
            </TabsTrigger>
            <TabsTrigger value="expertise" className="text-xs sm:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg">
              <Star className="w-4 h-4 mr-1.5 hidden sm:inline" />기술
            </TabsTrigger>
            <TabsTrigger value="shopinfo" className="text-xs sm:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg">
              <MapPin className="w-4 h-4 mr-1.5 hidden sm:inline" />매장
            </TabsTrigger>
          </TabsList>
          <TabsContent value="reservations"><ReservationsTab /></TabsContent>
          <TabsContent value="photos"><PhotosTab /></TabsContent>
          <TabsContent value="expertise"><ExpertiseTab /></TabsContent>
          <TabsContent value="shopinfo"><ShopInfoTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
