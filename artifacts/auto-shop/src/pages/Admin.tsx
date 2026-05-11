import { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Wrench, CalendarCheck, Image, Star, MapPin, Pencil, Trash2, Plus, Check,
  AlertTriangle, Clock, CheckCircle2, XCircle, MessageSquare, CreditCard,
  RefreshCw, X, Search, Table2, Calendar, ChevronLeft, ChevronRight,
  ArrowUpDown, Filter
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

/* ── Constants ──────────────────────────────────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string; dot: string; badge: string }> = {
  pending:   { label: "대기중",  dot: "bg-amber-400",  badge: "bg-amber-50 text-amber-700 ring-amber-200" },
  confirmed: { label: "확정",    dot: "bg-blue-500",   badge: "bg-blue-50 text-blue-700 ring-blue-200" },
  rejected:  { label: "반려",    dot: "bg-red-500",    badge: "bg-red-50 text-red-600 ring-red-200" },
  cancelled: { label: "취소",    dot: "bg-gray-300",   badge: "bg-gray-50 text-gray-500 ring-gray-200" },
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/* ── Reject Modal ───────────────────────────────────────────────────────────── */
function RejectModal({ name, onConfirm, onClose }: { name: string; onConfirm: (r: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">예약 반려</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          <span className="font-semibold text-gray-800">{name}</span> 님의 예약 반려 사유를 입력하세요.
        </p>
        <Textarea placeholder="예: 해당 시간대 이미 마감" className="resize-none min-h-[90px] bg-slate-50 text-sm mb-4"
          value={reason} onChange={e => setReason(e.target.value)} autoFocus />
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

/* ── Toggle Switch ──────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange, disabled, color = "blue" }: { checked: boolean; onChange: () => void; disabled?: boolean; color?: string }) {
  const colorMap: Record<string, string> = {
    green: "bg-green-500", blue: "bg-blue-500", purple: "bg-purple-500", yellow: "bg-yellow-400",
  };
  return (
    <button type="button" disabled={disabled}
      onClick={e => { e.stopPropagation(); onChange(); }}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-40 ${checked ? colorMap[color] : "bg-gray-200"}`}>
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

/* ── ERP Table View ─────────────────────────────────────────────────────────── */
function TableView({ reservations, conflictIds, onUpdate, onReject }: {
  reservations: Reservation[];
  conflictIds: Set<number>;
  onUpdate: (id: number, u: Partial<Reservation>) => Promise<void>;
  onReject: (r: Reservation) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState<{ col: string; asc: boolean }>({ col: "date", asc: false });
  const [busy, setBusy] = useState<string | null>(null);

  const act = useCallback(async (id: number, key: string, updates: Partial<Reservation>) => {
    setBusy(`${id}-${key}`);
    await onUpdate(id, updates);
    setBusy(null);
  }, [onUpdate]);

  const filtered = useMemo(() => {
    let list = reservations;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        (r.user_name ?? "").toLowerCase().includes(q) ||
        r.service_type.toLowerCase().includes(q) ||
        (r.vehicle_model ?? "").toLowerCase().includes(q) ||
        (r.vehicle_number ?? "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      if (statusFilter === "completed") list = list.filter(r => r.is_completed);
      else if (statusFilter === "paid") list = list.filter(r => r.is_paid);
      else if (statusFilter === "conflict") list = list.filter(r => conflictIds.has(r.id));
      else list = list.filter(r => r.status === statusFilter);
    }
    const { col, asc } = sort;
    list = [...list].sort((a, b) => {
      let av: string | boolean = "", bv: string | boolean = "";
      if (col === "date") { av = `${a.date} ${a.time_slot}`; bv = `${b.date} ${b.time_slot}`; }
      else if (col === "name") { av = a.user_name ?? ""; bv = b.user_name ?? ""; }
      else if (col === "service") { av = a.service_type; bv = b.service_type; }
      else if (col === "status") { av = a.status; bv = b.status; }
      if (av < bv) return asc ? -1 : 1;
      if (av > bv) return asc ? 1 : -1;
      return 0;
    });
    return list;
  }, [reservations, search, statusFilter, sort, conflictIds]);

  const toggleSort = (col: string) =>
    setSort(s => s.col === col ? { col, asc: !s.asc } : { col, asc: true });

  const Th = ({ col, children }: { col: string; children: React.ReactNode }) => (
    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-gray-800 group"
      onClick={() => toggleSort(col)}>
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown className={`w-3 h-3 opacity-30 group-hover:opacity-70 ${sort.col === col ? "opacity-70 text-blue-500" : ""}`} />
      </span>
    </th>
  );

  const FILTERS = [
    { key: "all", label: "전체" },
    { key: "pending", label: "대기" },
    { key: "confirmed", label: "확정" },
    { key: "completed", label: "완료" },
    { key: "paid", label: "결제" },
    { key: "rejected", label: "반려" },
    ...(conflictIds.size > 0 ? [{ key: "conflict", label: "⚠️ 중복" }] : []),
  ];

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="고객명·차량·서비스 검색"
            className="w-full pl-8 pr-3 h-8 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={`px-2.5 h-8 rounded-lg text-xs font-semibold border transition-all ${statusFilter === f.key ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-slate-200 hover:border-slate-300"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-gray-400 font-medium">{filtered.length}건</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <Th col="date">일시</Th>
                <Th col="name">고객</Th>
                <Th col="service">서비스</Th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">차량</th>
                <Th col="status">상태</Th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">완료</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">결제</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">카톡</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400 text-sm">
                  <CalendarCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />조건에 맞는 예약이 없습니다.
                </td></tr>
              ) : filtered.map(r => {
                const cfg = STATUS_CFG[r.status] ?? STATUS_CFG.cancelled;
                const isConflict = conflictIds.has(r.id);
                const isB = (k: string) => busy === `${r.id}-${k}`;
                return (
                  <tr key={r.id} className={`group hover:bg-slate-50/80 transition-colors ${isConflict ? "bg-amber-50/40" : ""}`}>
                    {/* Date/Time */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {isConflict && <span title="시간 중복"><AlertTriangle className="w-3 h-3 text-amber-500 inline mr-1" /></span>}
                      <span className="font-mono text-xs text-gray-700 font-medium">{r.date}</span>
                      <span className="ml-1.5 text-xs text-gray-400">{r.time_slot}</span>
                    </td>
                    {/* Customer */}
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-gray-800 text-sm leading-tight">{r.user_name ?? "—"}</div>
                      {r.user_email && <div className="text-xs text-gray-400 truncate max-w-[140px]">{r.user_email}</div>}
                    </td>
                    {/* Service */}
                    <td className="px-3 py-2.5">
                      <span className="text-gray-700 text-sm">{r.service_type}</span>
                      {r.notes && <div className="text-xs text-gray-400 truncate max-w-[160px] mt-0.5" title={r.notes}>{r.notes}</div>}
                    </td>
                    {/* Vehicle */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="text-xs text-gray-700 font-medium">{r.vehicle_model ?? "—"}</div>
                      <div className="text-xs text-gray-400">{r.vehicle_number}</div>
                    </td>
                    {/* Status */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ring-1 ${cfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                        </span>
                      </div>
                      {r.rejection_reason && (
                        <div className="text-xs text-red-400 mt-0.5 truncate max-w-[120px]" title={r.rejection_reason}>↳ {r.rejection_reason}</div>
                      )}
                    </td>
                    {/* Complete toggle */}
                    <td className="px-3 py-2.5 text-center">
                      <Toggle checked={r.is_completed} color="green"
                        disabled={r.status === "rejected" || r.status === "cancelled" || isB("complete")}
                        onChange={() => act(r.id, "complete", { is_completed: !r.is_completed })} />
                    </td>
                    {/* Paid toggle */}
                    <td className="px-3 py-2.5 text-center">
                      <Toggle checked={r.is_paid} color="purple"
                        disabled={r.status === "rejected" || r.status === "cancelled" || isB("paid")}
                        onChange={() => act(r.id, "paid", { is_paid: !r.is_paid })} />
                    </td>
                    {/* Kakao */}
                    <td className="px-3 py-2.5 text-center">
                      {r.kakao_notified ? (
                        <span className="inline-flex items-center gap-0.5 text-yellow-600 text-xs font-semibold">
                          <MessageSquare className="w-3.5 h-3.5" />발송
                        </span>
                      ) : (
                        <button onClick={() => act(r.id, "kakao", { kakao_notified: true })}
                          disabled={isB("kakao") || r.status === "rejected"}
                          className="text-xs text-gray-400 hover:text-yellow-600 disabled:opacity-30 font-medium transition-colors">
                          {isB("kakao") ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "발송"}
                        </button>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {r.status === "pending" && (
                          <button onClick={() => act(r.id, "confirm", { status: "confirmed" })} disabled={isB("confirm")}
                            className="h-7 px-2 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                            {isB("confirm") ? "…" : "확정"}
                          </button>
                        )}
                        {(r.status === "pending" || r.status === "confirmed") && (
                          <button onClick={() => onReject(r)}
                            className="h-7 px-2 rounded-md bg-red-50 text-red-500 text-xs font-semibold hover:bg-red-100 border border-red-200 transition-colors">
                            반려
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kakao note */}
      <p className="text-xs text-gray-400 flex items-center gap-1">
        <MessageSquare className="w-3 h-3" />카카오 알림톡 실제 발송은 카카오 비즈메시지 API 연동 후 활성화됩니다.
      </p>
    </div>
  );
}

/* ── Calendar View ──────────────────────────────────────────────────────────── */
function CalendarView({ reservations, conflictIds, onUpdate, onReject }: {
  reservations: Reservation[];
  conflictIds: Set<number>;
  onUpdate: (id: number, u: Partial<Reservation>) => Promise<void>;
  onReject: (r: Reservation) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (id: number, key: string, updates: Partial<Reservation>) => {
    setBusy(`${id}-${key}`);
    await onUpdate(id, updates);
    setBusy(null);
  };

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const pad = (n: number) => String(n).padStart(2, "0");
  const byDate = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    reservations.forEach(r => {
      if (!map.has(r.date)) map.set(r.date, []);
      map.get(r.date)!.push(r);
    });
    return map;
  }, [reservations]);

  const selectedReservations = selectedDate ? (byDate.get(selectedDate) ?? []) : [];
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  return (
    <div className="grid lg:grid-cols-5 gap-4">
      {/* Calendar */}
      <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
          <button onClick={prevMonth} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <span className="font-bold text-gray-800 text-base">{year}년 {month + 1}월</span>
          <button onClick={nextMonth} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={`py-2 text-center text-xs font-semibold ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"}`}>{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} className="border-r border-b border-slate-50 min-h-[80px]" />;
            const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
            const dayRsvs = byDate.get(dateStr) ?? [];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasConflict = dayRsvs.some(r => conflictIds.has(r.id));
            const dow = (idx % 7);

            return (
              <div key={idx}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`border-r border-b border-slate-100 min-h-[80px] p-1.5 cursor-pointer transition-all select-none
                  ${isSelected ? "bg-blue-50 ring-2 ring-inset ring-blue-400" : "hover:bg-slate-50"}
                  ${isToday ? "bg-blue-50/50" : ""}`}>
                <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full
                  ${isToday ? "bg-blue-600 text-white" : dow === 0 ? "text-red-400" : dow === 6 ? "text-blue-500" : "text-gray-700"}`}>
                  {day}
                </div>
                {hasConflict && <div className="mb-0.5"><span className="text-amber-500 text-[9px] font-bold">⚠️ 중복</span></div>}
                <div className="space-y-0.5">
                  {dayRsvs.slice(0, 3).map(r => {
                    const cfg = STATUS_CFG[r.status] ?? STATUS_CFG.cancelled;
                    return (
                      <div key={r.id} className={`text-[10px] font-semibold px-1 py-0.5 rounded truncate ring-1 ${cfg.badge}`}>
                        {r.time_slot} {r.user_name ?? "고객"}
                      </div>
                    );
                  })}
                  {dayRsvs.length > 3 && <div className="text-[9px] text-gray-400 pl-1">+{dayRsvs.length - 3}건 더</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-3">
          {Object.entries(STATUS_CFG).map(([, cfg]) => (
            <span key={cfg.label} className="flex items-center gap-1 text-xs text-gray-500">
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />{cfg.label}
            </span>
          ))}
        </div>
      </div>

      {/* Side panel */}
      <div className="lg:col-span-2">
        <AnimatePresence mode="wait">
          {selectedDate ? (
            <motion.div key={selectedDate} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{selectedDate}</p>
                  <p className="text-xs text-gray-400">{selectedReservations.length}건의 예약</p>
                </div>
                <button onClick={() => setSelectedDate(null)} className="p-1 hover:bg-slate-200 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="p-3 space-y-2 max-h-[560px] overflow-y-auto">
                {selectedReservations.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">예약이 없습니다.</p>
                ) : selectedReservations.sort((a, b) => a.time_slot.localeCompare(b.time_slot)).map(r => {
                  const cfg = STATUS_CFG[r.status] ?? STATUS_CFG.cancelled;
                  const isConflict = conflictIds.has(r.id);
                  const isB = (k: string) => busy === `${r.id}-${k}`;
                  return (
                    <div key={r.id} className={`rounded-xl border p-3 space-y-2 ${isConflict ? "border-amber-300 bg-amber-50/30" : "border-slate-100 bg-white"}`}>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-gray-900 text-sm">{r.time_slot}</span>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ring-1 ${cfg.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                            </span>
                            {isConflict && <span className="text-[10px] text-amber-600 font-semibold">⚠️ 중복</span>}
                          </div>
                          <p className="font-semibold text-gray-800 text-sm">{r.user_name ?? "고객"}</p>
                          <p className="text-xs text-gray-400">{r.service_type} · {r.vehicle_model} {r.vehicle_number}</p>
                          {r.notes && <p className="text-xs text-gray-500 mt-0.5 bg-slate-50 rounded px-2 py-1">{r.notes}</p>}
                          {r.rejection_reason && <p className="text-xs text-red-400 mt-0.5">반려: {r.rejection_reason}</p>}
                        </div>
                      </div>
                      {/* Toggles row */}
                      <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
                        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                          <Toggle checked={r.is_completed} color="green"
                            disabled={r.status === "rejected" || isB("complete")}
                            onChange={() => act(r.id, "complete", { is_completed: !r.is_completed })} />
                          완료
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                          <Toggle checked={r.is_paid} color="purple"
                            disabled={r.status === "rejected" || isB("paid")}
                            onChange={() => act(r.id, "paid", { is_paid: !r.is_paid })} />
                          결제
                        </label>
                        {!r.kakao_notified && r.status !== "rejected" && (
                          <button onClick={() => act(r.id, "kakao", { kakao_notified: true })} disabled={isB("kakao")}
                            className="ml-auto flex items-center gap-1 text-[11px] text-yellow-600 hover:text-yellow-700 font-semibold disabled:opacity-40">
                            <MessageSquare className="w-3 h-3" />카톡 발송
                          </button>
                        )}
                        {r.kakao_notified && (
                          <span className="ml-auto text-[11px] text-yellow-500 font-semibold flex items-center gap-1"><MessageSquare className="w-3 h-3" />발송됨</span>
                        )}
                      </div>
                      {/* Actions */}
                      {(r.status === "pending" || r.status === "confirmed") && (
                        <div className="flex gap-1.5 pt-1">
                          {r.status === "pending" && (
                            <button onClick={() => act(r.id, "confirm", { status: "confirmed" })} disabled={isB("confirm")}
                              className="flex-1 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                              {isB("confirm") ? "처리중…" : "확정"}
                            </button>
                          )}
                          <button onClick={() => onReject(r)}
                            className="flex-1 h-7 rounded-lg bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 border border-red-200 transition-colors">
                            반려
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 text-center">
              <Calendar className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm font-medium text-gray-400">날짜를 클릭하면</p>
              <p className="text-sm text-gray-300">해당일 예약이 표시됩니다</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Reservations Tab ───────────────────────────────────────────────────────── */
function ReservationsTab() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"table" | "calendar">("table");
  const [rejectTarget, setRejectTarget] = useState<Reservation | null>(null);

  const { data: reservations = [], isLoading, refetch, isFetching } = useQuery<Reservation[]>({
    queryKey: ["admin-reservations"],
    queryFn: async () => {
      const res = await fetch("/api/reservations", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 60_000,
  });

  const conflictIds = useMemo(() => {
    const groups = new Map<string, number[]>();
    reservations.filter(r => r.status !== "rejected" && r.status !== "cancelled")
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

  const updateReservation = useCallback(async (id: number, updates: Partial<Reservation>) => {
    await fetch(`/api/reservations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updates),
    });
    queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
  }, [queryClient]);

  const handleReject = useCallback(async (reason: string) => {
    if (!rejectTarget) return;
    await updateReservation(rejectTarget.id, { status: "rejected", rejection_reason: reason });
    setRejectTarget(null);
  }, [rejectTarget, updateReservation]);

  const STAT_ITEMS = [
    { label: "전체", value: stats.total, cls: "text-gray-700 bg-gray-50" },
    { label: "대기", value: stats.pending, cls: "text-amber-700 bg-amber-50" },
    { label: "확정", value: stats.confirmed, cls: "text-blue-700 bg-blue-50" },
    { label: "완료", value: stats.completed, cls: "text-green-700 bg-green-50" },
    { label: "결제", value: stats.paid, cls: "text-purple-700 bg-purple-50" },
    ...(stats.conflict > 0 ? [{ label: "⚠️ 중복", value: stats.conflict, cls: "text-amber-700 bg-amber-50 ring-1 ring-amber-300" }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Top bar: stats + view toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {STAT_ITEMS.map(s => (
            <div key={s.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${s.cls}`}>
              <span className="text-base font-extrabold leading-none">{s.value}</span>
              <span className="text-xs font-medium opacity-70">{s.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <button onClick={() => refetch()} className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-slate-200 text-xs text-gray-500 hover:text-gray-700 hover:border-slate-300 transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />새로고침
          </button>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button onClick={() => setView("table")}
              className={`h-8 px-3 flex items-center gap-1.5 text-xs font-semibold transition-colors ${view === "table" ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-slate-50"}`}>
              <Table2 className="w-3.5 h-3.5" />표
            </button>
            <button onClick={() => setView("calendar")}
              className={`h-8 px-3 flex items-center gap-1.5 text-xs font-semibold transition-colors border-l border-slate-200 ${view === "calendar" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 hover:bg-slate-50"}`}>
              <Calendar className="w-3.5 h-3.5" />달력
            </button>
          </div>
        </div>
      </div>

      {/* Conflict alert */}
      {stats.conflict > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-sm font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {stats.conflict}건 시간대 중복 — 확인 후 반려 처리 권장
        </div>
      )}

      {/* Main content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" /><span className="text-sm">불러오는 중...</span>
        </div>
      ) : view === "table" ? (
        <TableView reservations={reservations} conflictIds={conflictIds} onUpdate={updateReservation} onReject={setRejectTarget} />
      ) : (
        <CalendarView reservations={reservations} conflictIds={conflictIds} onUpdate={updateReservation} onReject={setRejectTarget} />
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal name={rejectTarget.user_name ?? "고객"} onConfirm={handleReject} onClose={() => setRejectTarget(null)} />
      )}
    </div>
  );
}

/* ── Demo data for other tabs ───────────────────────────────────────────────── */
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

function PhotosTab() {
  const [photos, setPhotos] = useState(DEMO_PHOTOS);
  const [newUrl, setNewUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [adding, setAdding] = useState(false);
  const add = () => {
    if (!newUrl.trim()) return;
    setPhotos(p => [...p, { id: Date.now(), url: newUrl.trim(), caption: newCaption.trim() }]);
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

function ExpertiseTab() {
  const [items, setItems] = useState(DEMO_EXPERTISE);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState({ title: "", description: "" });
  const startEdit = (item: typeof items[0]) => { setEditing(item.id); setDraft({ title: item.title, description: item.description ?? "" }); };
  const save = () => { if (editing === null) return; setItems(p => p.map(i => i.id === editing ? { ...i, ...draft } : i)); setEditing(null); };
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
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400" onClick={() => setItems(p => p.filter(i => i.id !== item.id))}><Trash2 className="w-3.5 h-3.5" /></Button>
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
    setInfo(p => ({ ...p, [k]: e.target.value }));
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <Card className="border-0 shadow-sm ring-1 ring-slate-100">
      <CardHeader><CardTitle className="text-lg">매장 정보</CardTitle></CardHeader>
      <CardContent className="space-y-4 max-w-xl">
        {([{ key: "address", label: "주소" }, { key: "phone", label: "전화번호" }, { key: "weekday_hours", label: "평일 영업시간" }, { key: "saturday_hours", label: "토요일 영업시간" }] as { key: keyof typeof info; label: string }[]).map(({ key, label }) => (
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

  if (!user) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 py-20 px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto"><Wrench className="w-8 h-8 text-blue-600" /></div>
        <h2 className="text-xl font-bold">로그인이 필요합니다</h2>
        <p className="text-gray-500 text-sm">관리자 패널에 접근하려면 먼저 로그인해주세요.</p>
        <Button className="bg-blue-600 hover:bg-blue-700 font-semibold" onClick={() => setLocation("/login")}>로그인하기</Button>
      </div>
    </div>
  );

  if (!isAdmin) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 py-20 px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto"><Wrench className="w-8 h-8 text-red-500" /></div>
        <h2 className="text-xl font-bold">접근 권한 없음</h2>
        <p className="text-gray-500 text-sm">관리자 계정으로 로그인해야 합니다.</p>
        <Button variant="outline" onClick={() => setLocation("/login")}>관리자로 로그인</Button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-4">
          <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight">관리자 패널</h1>
            <p className="text-xs text-gray-400">{user.name} 님 · 드림모터스</p>
          </div>
        </motion.div>

        <Tabs defaultValue="reservations">
          <TabsList className="grid grid-cols-4 w-full max-w-md mb-5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <TabsTrigger value="reservations" className="text-xs sm:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg">
              <CalendarCheck className="w-3.5 h-3.5 mr-1 hidden sm:inline" />예약
            </TabsTrigger>
            <TabsTrigger value="photos" className="text-xs sm:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg">
              <Image className="w-3.5 h-3.5 mr-1 hidden sm:inline" />사진
            </TabsTrigger>
            <TabsTrigger value="expertise" className="text-xs sm:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg">
              <Star className="w-3.5 h-3.5 mr-1 hidden sm:inline" />기술
            </TabsTrigger>
            <TabsTrigger value="shopinfo" className="text-xs sm:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg">
              <MapPin className="w-3.5 h-3.5 mr-1 hidden sm:inline" />매장
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
