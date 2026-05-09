import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Wrench, Settings, ShieldCheck, MapPin, Clock, Phone,
  ArrowRight, Battery, Wind, Zap, Droplets, CircleDot, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const PHOTOS = [
  { url: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80", caption: "엔진룸 정밀 진단" },
  { url: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80", caption: "서스펜션 및 브레이크 점검" },
  { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80", caption: "최신 진단 장비 활용" },
  { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80", caption: "숙련된 기술진" },
  { url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80", caption: "고급 합성유 교환" },
  { url: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80", caption: "안전하고 깨끗한 작업 환경" },
];

const SERVICES = [
  { icon: Settings,    title: "엔진 오일 교환",   desc: "차량에 맞는 최적의 합성유로 부드러운 주행감을 되찾아드립니다." },
  { icon: CircleDot,   title: "타이어 교환",      desc: "편마모 점검, 휠 밸런스, 위치 교환으로 안전한 제동을 보장합니다." },
  { icon: ShieldCheck, title: "브레이크 점검",    desc: "생명과 직결되는 브레이크 패드, 디스크를 꼼꼼히 체크합니다." },
  { icon: Battery,     title: "배터리 교체",      desc: "시동 불량의 원인, 노후 배터리를 신속하고 안전하게 교체합니다." },
  { icon: Wind,        title: "에어컨 / 히터",    desc: "쾌적한 실내를 위한 필터 교체 및 냉매 가스 충전 서비스." },
  { icon: Wrench,      title: "종합 정밀 진단",   desc: "장거리 주행 전 차량 전반을 최신 장비로 정밀 진단합니다." },
  { icon: Droplets,    title: "냉각수 교환",      desc: "엔진 과열 방지를 위한 냉각수 상태 점검 및 교환." },
  { icon: Zap,         title: "전기 / 전장",      desc: "배선 점검, ECU 진단, 각종 전장 부품 수리 전문 서비스." },
];

const STATS = [
  { value: "15+", label: "년의 정비 경력" },
  { value: "1만+", label: "누적 정비 대수" },
  { value: "100%", label: "정품 부품 사용" },
  { value: "4.9", label: "고객 만족 평점" },
];

const REVIEWS = [
  { name: "김민준", rating: 5, text: "친절하고 빠르게 처리해주셨어요. 설명도 자세히 해줘서 신뢰가 갑니다." },
  { name: "이수연", rating: 5, text: "다른 곳보다 합리적인 가격에 꼼꼼하게 정비해 주셔서 만족합니다." },
  { name: "박지훈", rating: 5, text: "예약하고 방문했는데 대기 없이 바로 정비 받았어요. 다음에도 꼭 올게요!" },
];

export default function Home() {
  return (
    <div className="flex flex-col bg-white text-gray-900 font-sans">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-28 md:py-36">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600&q=60)", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-700/80 to-indigo-900/90" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-3xl mx-auto space-y-7">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-white/90 text-sm font-medium backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4" />충청북도 진천군 1등 정비소
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
              내 차를 맡기는<br />
              <span className="text-blue-200">가장 믿음직한 선택</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-blue-100 leading-relaxed">
              과잉 정비 없이 정직하게, 숙련된 전문가의 손길로.<br />드림모터스는 고객님의 안전한 주행만을 생각합니다.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild size="lg" className="h-13 px-8 bg-white text-blue-700 hover:bg-blue-50 font-bold text-base shadow-xl" data-testid="button-hero-reserve">
                <Link href="/reservation">예약하기 <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-13 px-8 border-white/40 text-white hover:bg-white/10 font-semibold text-base backdrop-blur-sm" data-testid="button-hero-call">
                <a href="tel:010-1234-5678"><Phone className="mr-2 w-4 h-4" />010-1234-5678</a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
        {/* wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 20C1200 60 800 0 600 20C400 40 200 10 0 20L0 60Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-14 bg-white">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {STATS.map((s) => (
              <motion.div key={s.label} variants={fadeUp} className="text-center p-6 rounded-2xl bg-blue-50 border border-blue-100">
                <div className="text-3xl md:text-4xl font-extrabold text-blue-600">{s.value}</div>
                <div className="mt-1 text-sm text-gray-500 font-medium">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">서비스</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900" data-testid="text-services-title">전문 정비 서비스</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">수년간의 노하우와 최신 장비로 모든 차량의 문제를 정확하게 진단하고 해결합니다.</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map((svc, i) => (
              <motion.div key={i} variants={fadeUp}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
                data-testid={`card-service-${i}`}>
                <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                  <svc.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{svc.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{svc.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Photos ── */}
      <section id="photos" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">갤러리</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900">정비 현장</h2>
            <p className="mt-3 text-gray-500">전문 장비와 숙련된 손길로 진행되는 드림모터스의 정비 모습입니다.</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PHOTOS.map((p, i) => (
              <motion.div key={i} variants={fadeUp}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md cursor-pointer"
                data-testid={`photo-${i}`}>
                <img src={p.url} alt={p.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-white text-sm font-semibold">{p.caption}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">고객 후기</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900">고객님들의 이야기</h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {REVIEWS.map((r, i) => (
              <motion.div key={i} variants={fadeUp} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{r.text}"</p>
                <p className="font-semibold text-gray-800 text-sm">{r.name}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Location & Map ── */}
      <section id="location" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">오시는 길</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900" data-testid="text-location-title">위치 및 영업시간</h2>
          </motion.div>
          <div className="grid lg:grid-cols-2 gap-10 items-start max-w-6xl mx-auto">
            {/* Info */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-5">
              {[
                { icon: MapPin, title: "주소", content: "충청북도 진천군 진천읍 문화로 200-8\n드림모터스" },
                { icon: Clock,  title: "영업시간", content: "평일: 09:00 – 19:00\n토요일: 09:00 – 17:00\n일요일 및 공휴일: 휴무" },
                { icon: Phone,  title: "전화", content: "010-1234-5678" },
              ].map(({ icon: Icon, title, content }) => (
                <motion.div key={title} variants={fadeUp} className="flex gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{title}</p>
                    <p className="text-gray-800 font-medium whitespace-pre-line text-sm leading-relaxed">{content}</p>
                  </div>
                </motion.div>
              ))}
              <motion.div variants={fadeUp}>
                <Button asChild size="lg" className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold">
                  <Link href="/reservation">지금 예약하기 <ArrowRight className="ml-2 w-4 h-4" /></Link>
                </Button>
              </motion.div>
            </motion.div>
            {/* Google Maps */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="w-full h-[420px] rounded-2xl overflow-hidden shadow-lg border border-slate-100">
              <iframe
                title="드림모터스 위치"
                src="https://maps.google.com/maps?q=충청북도+진천군+진천읍+문화로+200-8&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                data-testid="map-iframe"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-2xl mx-auto space-y-6">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold text-white">지금 바로 예약하세요</motion.h2>
            <motion.p variants={fadeUp} className="text-blue-100 text-lg">전문 기술진이 빠르고 정직하게 처리해 드립니다.</motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="h-13 px-8 bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-xl">
                <Link href="/reservation">예약하기</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-13 px-8 border-white/40 text-white hover:bg-white/10 font-semibold backdrop-blur-sm">
                <a href="tel:010-1234-5678"><Phone className="mr-2 w-4 h-4" />전화 상담</a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
