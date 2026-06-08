/**
 * 드림모터스 정적 데이터 — 단일 출처(Single Source of Truth).
 *
 * 점주가 직접 수정하는 곳. 이 파일만 고치면 사이트 전체에 반영된다.
 * (Sprint 7 / REQ-04 시나리오 X — 백엔드 없는 정적 사이트)
 */
import {
  Battery,
  CircleDot,
  Droplets,
  Settings,
  ShieldCheck,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

// ── 매장 정보 ─────────────────────────────────────────────────────────────
export const SHOP = {
  name: "드림모터스",
  tagline: "충청북도 진천군 1등 정비소",
  address: "충청북도 진천군 진천읍 문화로 200-8",
  phone: "010-3090-6998",          // 화면 표시용 (하이픈 포함)
  phoneTel: "tel:+821030906998",   // tel: 링크용 (E.164 — 모바일 호환성 최고)
  weekdayHours: "09:00 - 19:00",
  saturdayHours: "09:00 - 17:00",
  holidayNote: "일요일 및 공휴일 휴무",
  directions: "진천 나들목에서 5분, 진천 문화체육센터 맞은편",
} as const;

// ── 서비스(전문 정비) ─────────────────────────────────────────────────────
export interface ServiceItem {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const SERVICES: ServiceItem[] = [
  { icon: Settings,    title: "엔진 오일 교환",   description: "차량에 맞는 최적의 합성유로 부드러운 주행감을 되찾아드립니다." },
  { icon: CircleDot,   title: "타이어 교환",      description: "편마모 점검, 휠 밸런스, 위치 교환으로 안전한 제동을 보장합니다." },
  { icon: ShieldCheck, title: "브레이크 점검",    description: "생명과 직결되는 브레이크 패드·디스크를 꼼꼼히 체크합니다." },
  { icon: Battery,     title: "배터리 교체",      description: "시동 불량의 원인, 노후 배터리를 신속·안전하게 교체합니다." },
  { icon: Wind,        title: "에어컨 / 히터",    description: "쾌적한 실내를 위한 필터 교체 및 냉매 가스 충전 서비스." },
  { icon: Wrench,      title: "종합 정밀 진단",   description: "장거리 주행 전 차량 전반을 최신 장비로 정밀 진단합니다." },
  { icon: Droplets,    title: "냉각수 교환",      description: "엔진 과열 방지를 위한 냉각수 상태 점검·교환." },
  { icon: Zap,         title: "전기 / 전장",      description: "배선 점검, ECU 진단, 각종 전장 부품 수리 전문 서비스." },
];

// ── 갤러리 사진 ──────────────────────────────────────────────────────────
export interface PhotoItem {
  url: string;
  caption: string;
}

export const PHOTOS: PhotoItem[] = [
  { url: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80", caption: "엔진룸 정밀 진단" },
  { url: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80", caption: "서스펜션·브레이크 점검" },
  { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80", caption: "최신 진단 장비" },
  { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80", caption: "숙련된 기술진" },
  { url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80", caption: "고급 합성유 교환" },
  { url: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80", caption: "안전·청결한 작업 환경" },
];

// ── 회사 신뢰도(통계) ─────────────────────────────────────────────────────
export const STATS = [
  { value: "15+", label: "년의 정비 경력" },
  { value: "1만+", label: "누적 정비 대수" },
  { value: "100%", label: "정품 부품 사용" },
  { value: "4.9", label: "고객 만족 평점" },
] as const;

// ── 고객 후기 ─────────────────────────────────────────────────────────────
export const REVIEWS = [
  { name: "김민준", rating: 5, text: "친절하고 빠르게 처리해주셨어요. 설명도 자세히 해줘서 신뢰가 갑니다." },
  { name: "이수연", rating: 5, text: "다른 곳보다 합리적인 가격에 꼼꼼하게 정비해 주셔서 만족합니다." },
  { name: "박지훈", rating: 5, text: "예약하고 방문했는데 대기 없이 바로 정비 받았어요. 다음에도 꼭 올게요!" },
] as const;
