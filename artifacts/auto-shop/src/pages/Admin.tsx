import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Wrench, CalendarCheck, Image, Star, MapPin, Pencil, Trash2, Plus, Check,
  AlertTriangle, Clock, CheckCircle2, XCircle, MessageSquare, CreditCard,
  RefreshCw, ChevronDown, ChevronUp, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface Reservation {
  id: number;
  user_id: number;
  user_name: string | null;
  user_email: string | null;
  date: string;
  time_slot: string;
  service_type: string;
  vehicle_model: string | null;
  vehicle_number: string | null;
  notes: string | null;
  status: string;
  rejection_reason: string | null;
  is_completed: boolean;
  is_paid: boolean;
  kakao_notified: boolean;
  created_at: string;
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:   { label: "대기중",  cls: "bg-amber-100 text-amber-700 border-amber-200" },
  confirmed: { label: "확정됨",  cls: "bg-blue-100 text-blue-700 border-blue-200" },
  rejected:  { label: "반려됨",  cls: "bg-red-100 text-red-600 border-red-200" },
  cancelled: { label: "취소됨",  cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, cls: "bg-gray-100 text-gray-500" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>{cfg.label}</span>;
}

/* ── Stat Card ──────────────────────────────────────────────────────────────── */
function StatCard({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: React.ElementType }) {
  return (
    <Card className={`border-0 shadow-sm ring-1 ring-slate-100 ${color}`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-extrabold leading-none">{value}</p>
          <p className="text-xs font-medium mt-0.5 opacity-70">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Reject Modal ───────────────────────────────────────────────────────────── */
function RejectModal({ name, onConfirm, onClose }: { name: string; onConfirm: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-900">예약 반려</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4"><span className="font-semibold text-gray-800">{name}</span> 님의 예약을 반려합니다. 반려 사유를 입력해주세요.</p>
        <Textarea
          placeholder="예: 해당 시간대 이미 마감, 해당 서비스 임시 중단 등"
          className="resize-none min-h-[100px] bg-slate-50 text-sm mb-4"
          value={reason}
          onChange={e => setReason(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2">
          <Button className="flex-1 bg-red-500 hover:bg-red-600 font-semibold" onClick={() => onConfirm(reason)} disabled={!reason.trim()}>
            <XCircle className="w-4 h-4 mr-1.5" />반려 확정
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>취소</Button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Reservation Card ───────────────────────────────────────────────────────── */
function ReservationCard({ r, isConflict, onUpdate }: { r: Reservation; isConflict: boolean; onUpdate: (id: number, updates: Partial<Reservation>) => Promise<void> }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (key: string, updates: Partial<Reservation>) => {
    setBusy(key);
    await onUpdate(r.id, updates);
    setBusy(null);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isConflict ? "border-amber-300 ring-1 ring-amber-300" : "border-slate-100"}`}
    >
      {isConflict && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-amber-700 text-xs font-semibold">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          시간대 중복 — 같은 날짜·시간에 다른 예약이 존재합니다
        </div>
      )}

      {/* Main row */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900">{r.user_name ?? "고객"}</span>
            <StatusBadge status={r.status} />
            {r.is_completed && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200"><CheckCircle2 className="w-3 h-3" />완료</span>}
            {r.is_paid && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200"><CreditCard className="w-3 h-3" />결제완료</span>}
            {r.kakao_notified && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200"><MessageSquare className="w-3 h-3" />카톡발송</span>}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{r.date} {r.time_slot}</span>
            <span>{r.service_type}</span>
            {r.vehicle_model && <span>{r.vehicle_model} {r.vehicle_number}</span>}
          </div>
          {r.rejection_reason && (
            <p className="mt-1 text-xs text-red-500 font-medium">반려 사유: {r.rejection_reason}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {r.status === "pending" && (
            <>
              <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-xs font-semibold px-3" onClick={() => act("confirm", { status: "confirmed" })} disabled={busy === "confirm"}>
                {busy === "confirm" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />확정</>}
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs font-semibold px-3 border-red-200 text-red-500 hover:bg-red-50" onClick={() => setRejectModal(true)}>
                <XCircle className="w-3.5 h-3.5 mr-1" />반려
              </Button>
            </>
          )}
          {r.status === "confirmed" && !r.is_completed && (
            <Button size="sm" variant="outline" className="h-8 text-xs font-semibold px-3 border-red-200 text-red-400 hover:bg-red-50" onClick={() => setRejectModal(true)}>
              <XCircle className="w-3.5 h-3.5 mr-1" />반려
            </Button>
          )}

          {(r.status === "confirmed" || r.status === "pending") && !r.kakao_notified && (
            <Button size="sm" className="h-8 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-xs font-semibold px-3" onClick={() => act("kakao", { kakao_notified: true })} disabled={busy === "kakao"}>
              {busy === "kakao" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><MessageSquare className="w-3.5 h-3.5 mr-1" />카톡 발송</>}
            </Button>
          )}

          <button onClick={() => setExpanded(v => !v)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-gray-400">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded: toggles + detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div key="expanded" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} style={{ overflow: "hidden" }}>
            <div className="border-t border-slate-100 px-4 py-4 space-y-4">
              {r.notes && (
                <div className="p-3 bg-slate-50 rounded-xl text-sm text-gray-600">
                  <span className="font-semibold text-gray-400 text-xs uppercase tracking-wide mr-2">요청사항</span>{r.notes}
                </div>
              )}
              {r.user_email && (
                <p className="text-xs text-gray-400">이메일: {r.user_email}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {/* Complete toggle */}
                <button
                  onClick={() => act("complete", { is_completed: !r.is_completed })}
                  disabled={busy === "complete" || r.status === "rejected" || r.status === "cancelled"}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all disabled:opacity-40 ${r.is_completed ? "bg-green-600 text-white border-green-600 hover:bg-green-700" : "bg-white text-gray-600 border-slate-200 hover:border-green-400 hover:text-green-600"}`}
                >
                  {busy === "complete" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {r.is_completed ? "정비 완료됨" : "정비 완료 처리"}
                </button>

                {/* Paid toggle */}
                <button
                  onClick={() => act("paid", { is_paid: !r.is_paid })}
                  disabled={busy === "paid" || r.status === "rejected" || r.status === "cancelled"}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all disabled:opacity-40 ${r.is_paid ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700" : "bg-white text-gray-600 border-slate-200 hover:border-purple-400 hover:text-purple-600"}`}
                >
                  {busy === "paid" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  {r.is_paid ? "결제 완료됨" : "결제 완료 처리"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject modal */}
      {rejectModal && (
        <RejectModal
          name={r.user_name ?? "고객"}
          onConfirm={async (reason) => { setRejectModal(false); await act("reject", { status: "rejected", rejection_reason: reason }); }}
          onClose={() => setRejectModal(false)}
        />
      )}
    </motion.div>
  );
}

/* ── Reservations Tab ───────────────────────────────────────────────────────── */
function ReservationsTab() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  const { data: reservations = [], isLoading, refetch } = useQuery<Reservation[]>({
    queryKey: ["admin-reservations"],
    queryFn: async () => {
      const res = await fetch("/api/reservations", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const conflictIds = useMemo(() => {
    const groups = new Map<string, number[]>();
    reservations
      .filter(r => r.status !== "rejected" && r.status !== "cancelled")
      .forEach(r => {
        const key = `${r.date}|${r.time_slot}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(r.id);
      });
    const ids = new Set<number>();
    groups.forEach(arr => { if (arr.length > 1) arr.forEach(id => ids.add(id)); });
    return ids;
  }, [reservations]);

  const stats = useMemo(() => ({
    total: reservations.length,
    pending: reservations.filter(r => r.status === "pending").length,
    confirmed: reservations.filter(r => r.status === "confirmed").length,
    completed: reservations.filter(r => r.is_completed).length,
    paid: reservations.filter(r => r.is_paid).length,
    conflict: conflictIds.size,
  }), [reservations, conflictIds]);

  const filtered = useMemo(() => {
    switch (filter) {
      case "pending":   return reservations.filter(r => r.status === "pending");
      case "confirmed": return reservations.filter(r => r.status === "confirmed");
      case "completed": return reservations.filter(r => r.is_completed);
      case "paid":      return reservations.filter(r => r.is_paid);
      case "rejected":  return reservations.filter(r => r.status === "rejected" || r.status === "cancelled");
      case "conflict":  return reservations.filter(r => conflictIds.has(r.id));
      default:          return reservations;
    }
  }, [reservations, filter, conflictIds]);

  const updateReservation = async (id: number, updates: Partial<Reservation>) => {
    await fetch(`/api/reservations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updates),
    });
    queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
  };

  const FILTERS = [
    { key: "all",       label: "전체",     count: stats.total },
    { key: "pending",   label: "대기중",   count: stats.pending },
    { key: "confirmed", label: "확정",     count: stats.confirmed },
    { key: "completed", label: "완료",     count: stats.completed },
    { key: "paid",      label: "결제완료", count: stats.paid },
    { key: "rejected",  label: "반려/취소",count: reservations.filter(r => r.status === "rejected" || r.status === "cancelled").length },
    ...(stats.conflict > 0 ? [{ key: "conflict", label: "⚠️ 중복", count: stats.conflict }] : []),
  ];

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="전체 예약" value={stats.total} color="text-gray-700" icon={CalendarCheck} />
        <StatCard label="대기중" value={stats.pending} color="text-amber-700" icon={Clock} />
        <StatCard label="확정" value={stats.confirmed} color="text-blue-700" icon={CheckCircle2} />
        <StatCard label="정비 완료" value={stats.completed} color="text-green-700" icon={CheckCircle2} />
        <StatCard label="결제 완료" value={stats.paid} color="text-purple-700" icon={CreditCard} />
      </div>

      {stats.conflict > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-sm font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {stats.conflict}건의 예약이 같은 날짜·시간에 겹칩니다. 확인 후 반려 처리해주세요.
        </div>
      )}

      {/* Kakao info */}
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-xs">
        <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />
        <strong>카카오 알림톡:</strong> 현재는 발송 기록만 저장됩니다. 실제 카톡 발송은 카카오 비즈메시지 API 설정이 필요합니다.
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all ${filter === f.key ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-slate-200 hover:border-blue-300"}`}
          >
            {f.label} <span className={`ml-1 text-xs ${filter === f.key ? "opacity-75" : "text-gray-400"}`}>{f.count}</span>
          </button>
        ))}
        <button onClick={() => refetch()} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-gray-400 hover:text-gray-600 border border-slate-200 hover:border-slate-300 transition-all">
          <RefreshCw className="w-3.5 h-3.5" />새로고침
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" /><span>불러오는 중...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CalendarCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">해당 조건의 예약이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <ReservationCard key={r.id} r={r} isConflict={conflictIds.has(r.id)} onUpdate={updateReservation} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Demo data for non-reservation tabs ─────────────────────────────────────── */
const DEMO_PHOTOS = [
  { id: 1, url: "https://images.unsplash.com/photo-1617886903355-9354bb57751f?w=400&q=80", caption: "엔진룸 정밀 진단" },
  { id: 2, url: "https://images.unsplash.com/photo-1632823471565-1ecdf5c6da2f?w=400&q=80", caption: "서스펜션 점검" },
  { id: 3, url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&q=80", caption: "최신 진단 장비" },
  { id: 4, url: "https://images.unsplash.com/photo-1504222490345-c075b7b408c8?w=400&q=80", caption: "숙련된 기술진" },
  { id: 5, url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80", caption: "고급 합성유 교환" },
  { id: 6, url: "https://images.unsplash.com/photo-1636040758814-ed6a8acada34?w=400&q=80", caption: "깨끗한 작업 환경" },
];
const DEMO_EXPERTISE = [
  { id: 1, title: "엔진 전문 정비", description: "최신 진단 장비를 이용한 정밀 엔진 점검 및 수리" },
  { id: 2, title: "타이어 & 얼라이먼트", description: "국내외 유명 브랜드 타이어 취급 및 정밀 휠 얼라이먼트" },
  { id: 3, title: "브레이크 시스템", description: "브레이크 패드, 디스크, 캘리퍼 전문 교환 및 점검" },
  { id: 4, title: "에어컨 / 냉난방", description: "에어컨 가스 충전, 냉매 교환, 히터 점검 서비스" },
  { id: 5, title: "오일 & 소모품", description: "엔진오일, 미션오일, 냉각수 등 모든 소모품 교환" },
  { id: 6, title: "전기 / 전장 시스템", description: "배터리 교환, ECU 점검, 전기 배선 수리 전문" },
];
const DEMO_SHOP_INFO = {
  address: "충청북도 진천군 진천읍 문화로 200-8",
  phone: "010-3090-6998",
  weekday_hours: "09:00 - 19:00",
  saturday_hours: "09:00 - 17:00",
  directions: "진천 나들목에서 5분, 진천 문화체육센터 맞은편",
};

/* ── Photos Tab ─────────────────────────────────────────────────────────────── */
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
                <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => setPhotos(prev => prev.filter(x => x.id !== p.id))}>
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

/* ── Expertise Tab ──────────────────────────────────────────────────────────── */
function ExpertiseTab() {
  const [items, setItems] = useState(DEMO_EXPERTISE);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState({ title: "", description: "" });
  const startEdit = (item: typeof items[0]) => { setEditing(item.id); setDraft({ title: item.title, description: item.description ?? "" }); };
  const save = () => { if (editing === null) return; setItems(prev => prev.map(i => i.id === editing ? { ...i, ...draft } : i)); setEditing(null); };
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
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400" onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ── Shop Info Tab ──────────────────────────────────────────────────────────── */
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
        {([ { key: "address", label: "주소" }, { key: "phone", label: "전화번호" }, { key: "weekday_hours", label: "평일 영업시간" }, { key: "saturday_hours", label: "토요일 영업시간" } ] as { key: keyof typeof info; label: string }[]).map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
            <Input value={info[key]} onChange={handle(key)} className="bg-slate-50" />
          </div>
        ))}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">찾아오는 길</label>
          <Textarea value={info.directions} onChange={handle("directions")} className="bg-slate-50 resize-none" rows={3} />
        </div>
        <Button className={`w-full h-11 font-semibold transition-all ${saved ? "bg-green-500 hover:bg-green-600" : "bg-blue-600 hover:bg-blue-700"}`} onClick={save}>
          {saved ? <><Check className="w-4 h-4 mr-2" />저장되었습니다</> : "저장하기"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ── Main ───────────────────────────────────────────────────────────────────── */
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
