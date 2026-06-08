import { motion, type Variants } from "framer-motion";
import { Link } from "wouter";
import { ShieldCheck, MapPin, Clock, Phone, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SHOP, SERVICES, PHOTOS, STATS, REVIEWS } from "@/data/shop";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const stagger: Variants = { visible: { transition: { staggerChildren: 0.1 } } };

export default function Home() {
  return (
    <div className="flex flex-col bg-white text-gray-900 font-sans">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#111111] py-28 md:py-36">
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=60)", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-zinc-900/80 to-[#111111]" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-3xl mx-auto space-y-7">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-white/90 text-sm font-medium backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4" />{SHOP.tagline}
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
              내 차를 맡기는<br />
              <span className="text-blue-200">가장 믿음직한 선택</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-blue-100 leading-relaxed">
              과잉 정비 없이 정직하게, 숙련된 전문가의 손길로.<br />{SHOP.name}는 고객님의 안전한 주행만을 생각합니다.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild size="lg" className="h-13 px-8 bg-white text-blue-700 hover:bg-blue-50 font-bold text-base shadow-xl" data-testid="button-hero-reserve">
                <a href={SHOP.phoneTel}><Phone className="mr-2 w-4 h-4" />전화로 예약하기</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-13 px-8 border-white/40 text-white hover:bg-white/10 font-semibold text-base backdrop-blur-sm">
                <Link href="/reservation">예약 안내 보기 <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
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
            {SERVICES.map((svc, i) => {
              const Icon = svc.icon;
              return (
                <motion.div key={i} variants={fadeUp}
                  className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
                  data-testid={`card-service-${i}`}>
                  <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{svc.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{svc.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Photos ── */}
      <section id="photos" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">갤러리</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900">정비 현장</h2>
            <p className="mt-3 text-gray-500">전문 장비와 숙련된 손길로 진행되는 {SHOP.name}의 정비 모습입니다.</p>
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
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-5">
              {[
                { icon: MapPin, title: "주소", content: SHOP.address },
                { icon: Clock, title: "영업시간", content: `평일: ${SHOP.weekdayHours}\n토요일: ${SHOP.saturdayHours}\n${SHOP.holidayNote}` },
                { icon: Phone, title: "전화", content: SHOP.phone },
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
                  <a href={SHOP.phoneTel}><Phone className="mr-2 w-4 h-4" />지금 전화 예약하기</a>
                </Button>
              </motion.div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="w-full h-[420px] rounded-2xl overflow-hidden shadow-lg border border-slate-100">
              <iframe
                title={`${SHOP.name} 위치`}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(SHOP.address)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
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
      <section className="py-20 bg-gradient-to-r from-zinc-900 to-gray-900">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-2xl mx-auto space-y-6">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold text-white">지금 바로 예약하세요</motion.h2>
            <motion.p variants={fadeUp} className="text-blue-100 text-lg">전문 기술진이 빠르고 정직하게 처리해 드립니다.</motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="h-13 px-8 bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-xl">
                <a href={SHOP.phoneTel}><Phone className="mr-2 w-4 h-4" />{SHOP.phone}</a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
