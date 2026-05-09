import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Wrench,
  Car,
  Settings,
  Battery,
  ThermometerSnowflake,
  ShieldCheck,
  MapPin,
  Clock,
  Phone,
  ArrowRight,
  CheckCircle2,
  CalendarCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-xl">
            <Wrench className="w-6 h-6" />
            <span data-testid="text-logo">드림모터스</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#about" className="hover:text-primary transition-colors">소개</a>
            <a href="#services" className="hover:text-primary transition-colors">서비스</a>
            <a href="#location" className="hover:text-primary transition-colors">위치 및 시간</a>
          </div>
          <Button asChild size="sm" className="hidden md:flex">
            <a href="#contact" data-testid="button-nav-reserve">예약하기</a>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="max-w-3xl mx-auto text-center space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>강남구 테헤란로 1등 정비소</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight" data-testid="text-hero-title">
              내 차를 맡기는 <br className="hidden md:block" />
              <span className="text-primary">가장 믿음직한 선택</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed" data-testid="text-hero-subtitle">
              과잉 정비 없이 정직하게, 숙련된 전문가의 손길로. <br className="hidden md:block" />
              드림모터스는 고객님의 안전한 주행만을 생각합니다.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" className="w-full sm:w-auto text-base">
                <a href="#contact" data-testid="link-hero-reserve">
                  빠른 예약 문의 <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-base">
                <a href="tel:010-1234-5678" data-testid="link-hero-call">
                  <Phone className="mr-2 w-4 h-4" /> 전화 상담
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4" data-testid="text-services-title">전문 정비 서비스</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              수년간의 노하우와 최신 장비를 바탕으로 모든 차량의 문제점을 정확하게 진단하고 해결합니다.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { icon: Settings, title: "엔진 오일 교환", desc: "차량에 맞는 최적의 합성유로 부드러운 주행감을 되찾아드립니다." },
              { icon: Car, title: "타이어 교환 및 점검", desc: "편마모 점검, 휠 밸런스, 위치 교환으로 안전한 제동을 보장합니다." },
              { icon: ShieldCheck, title: "브레이크 시스템", desc: "생명과 직결되는 브레이크 패드, 디스크, 오일을 꼼꼼히 체크합니다." },
              { icon: Battery, title: "배터리 교체", desc: "시동 불량의 원인, 노후 배터리를 신속하고 안전하게 교체합니다." },
              { icon: ThermometerSnowflake, title: "에어컨/히터 점검", desc: "쾌적한 실내 환경을 위한 필터 교체 및 냉매 가스 충전." },
              { icon: Wrench, title: "종합 정밀 진단", desc: "장거리 주행 전, 차량의 전반적인 상태를 정밀하게 진단합니다." }
            ].map((service, idx) => (
              <motion.div
                key={idx}
                variants={fadeIn}
                className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow"
                data-testid={`card-service-${idx}`}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <service.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                <p className="text-muted-foreground">{service.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats/Trust Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold">15+</div>
              <div className="text-primary-foreground/80 text-sm">년의 정비 경력</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">10k+</div>
              <div className="text-primary-foreground/80 text-sm">누적 정비 대수</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">100%</div>
              <div className="text-primary-foreground/80 text-sm">정품 부품 사용</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">4.9</div>
              <div className="text-primary-foreground/80 text-sm">평균 고객 평점</div>
            </div>
          </div>
        </div>
      </section>

      {/* Location & Hours */}
      <section id="location" className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-bold mb-4" data-testid="text-location-title">오시는 길 및 영업시간</h2>
                <p className="text-muted-foreground">
                  접근하기 편한 강남 한복판에 위치해 있습니다. <br />
                  바쁘신 고객님들을 위해 빠르고 정확하게 정비해 드립니다.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">주소</h4>
                    <p className="text-muted-foreground">서울특별시 강남구 테헤란로 123</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">영업시간</h4>
                    <div className="text-muted-foreground space-y-1">
                      <p>평일: 09:00 - 19:00</p>
                      <p>토요일: 09:00 - 17:00</p>
                      <p className="text-destructive font-medium">일요일 및 공휴일 휴무</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">전화번호</h4>
                    <p className="text-muted-foreground text-lg font-medium text-foreground">010-1234-5678</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="h-[400px] bg-muted rounded-2xl overflow-hidden border border-border flex items-center justify-center relative"
            >
              {/* This is a placeholder for a map */}
              <div className="absolute inset-0 bg-[url('https://api.dicebear.com/7.x/shapes/svg?seed=map&backgroundColor=f8f9fa')] opacity-20 bg-cover bg-center"></div>
              <div className="relative z-10 flex flex-col items-center text-center p-6 bg-background/90 backdrop-blur-sm rounded-xl shadow-lg border border-border">
                <MapPin className="w-8 h-8 text-primary mb-2" />
                <p className="font-semibold">강남구 테헤란로 123</p>
                <p className="text-sm text-muted-foreground mt-1">네비게이션에 '드림모터스'를 검색하세요</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact / Inquiry Form */}
      <section id="contact" className="py-20 bg-secondary/30 border-t border-border">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="bg-card rounded-3xl p-8 md:p-12 shadow-sm border border-border"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4" data-testid="text-contact-title">예약 및 문의하기</h2>
              <p className="text-muted-foreground">
                차량 증상이나 원하시는 정비 항목을 남겨주시면, 확인 후 빠르게 연락드리겠습니다.
              </p>
            </div>

            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 flex flex-col items-center text-center space-y-4"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold">예약 문의가 접수되었습니다</h3>
                <p className="text-muted-foreground max-w-md">
                  남겨주신 연락처로 1-2시간 내에 확인 전화를 드릴 예정입니다. <br />
                  이용해 주셔서 감사합니다.
                </p>
                <Button className="mt-8" onClick={() => setIsSubmitted(false)} variant="outline">
                  다른 문의 남기기
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">이름</label>
                    <Input id="name" required placeholder="홍길동" data-testid="input-contact-name" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">연락처</label>
                    <Input id="phone" required placeholder="010-0000-0000" data-testid="input-contact-phone" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="carModel" className="text-sm font-medium">차종</label>
                  <Input id="carModel" placeholder="현대 그랜저 IG" data-testid="input-contact-car" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">문의 내용</label>
                  <Textarea
                    id="message"
                    required
                    placeholder="예: 엔진 오일 교환 예약하고 싶습니다. 주행 중 브레이크에서 소음이 납니다."
                    className="min-h-[120px]"
                    data-testid="input-contact-message"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-base h-14"
                  disabled={isSubmitting}
                  data-testid="button-contact-submit"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2 border-2 border-primary-foreground border-t-transparent rounded-full w-4 h-4" />
                      처리 중...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <CalendarCheck className="mr-2 w-5 h-5" /> 예약 문의 제출하기
                    </span>
                  )}
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-xl font-bold">
              <Wrench className="w-6 h-6 text-primary" />
              <span>드림모터스</span>
            </div>
            <div className="text-center md:text-right text-sm text-muted">
              <p>서울특별시 강남구 테헤란로 123 | 대표전화: 010-1234-5678</p>
              <p className="mt-1 opacity-60">© {new Date().getFullYear()} Dream Motors. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}