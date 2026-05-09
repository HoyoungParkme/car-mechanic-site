import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const DEFAULT_PHOTOS = [
  { id: 1, url: "https://images.unsplash.com/photo-1617886903355-9354bb57751f?w=800&q=80", caption: "엔진룸 정밀 진단" },
  { id: 2, url: "https://images.unsplash.com/photo-1632823471565-1ecdf5c6da2f?w=800&q=80", caption: "서스펜션 및 브레이크 점검" },
  { id: 3, url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80", caption: "최신 진단 장비 활용" },
  { id: 4, url: "https://images.unsplash.com/photo-1504222490345-c075b7b408c8?w=800&q=80", caption: "숙련된 기술진" },
  { id: 5, url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80", caption: "고급 합성유 교환" },
  { id: 6, url: "https://images.unsplash.com/photo-1636040758814-ed6a8acada34?w=800&q=80", caption: "안전하고 깨끗한 작업 환경" },
];

export default function Home() {
  const { data: photos = DEFAULT_PHOTOS } = useQuery({
    queryKey: ['photos'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/photos');
        if (!res.ok) return DEFAULT_PHOTOS;
        const data = await res.json();
        return data.length > 0 ? data : DEFAULT_PHOTOS;
      } catch {
        return DEFAULT_PHOTOS;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="flex flex-col bg-background text-foreground font-sans">
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#111827]">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1632823471565-1ecdf5c6da2f?auto=format&fit=crop&w=2000&q=80" 
            alt="자동차 정비" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/80 via-[#111827]/50 to-[#111827]"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center pt-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary-foreground border border-primary/30 backdrop-blur-sm text-sm font-medium mb-6">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>진천군 최고의 프리미엄 정비소</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-[800] tracking-tight leading-tight text-white drop-shadow-lg" data-testid="text-hero-title">
              차량을 향한 완벽한 헌신,<br className="hidden md:block" />
              <span className="text-primary">드림모터스</span>
            </h1>
            <p className="text-lg md:text-2xl text-gray-300 leading-relaxed font-medium max-w-2xl mx-auto" data-testid="text-hero-subtitle">
              타협하지 않는 품질과 정직한 진단으로<br className="hidden md:block" />
              고객님의 안전한 주행을 책임집니다.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90">
                <Link href="/reservation" data-testid="link-hero-reserve">
                  예약하기 <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-bold border-white text-white hover:bg-white hover:text-black transition-colors bg-transparent">
                <a href="tel:010-1234-5678" data-testid="link-hero-call">
                  <Phone className="mr-2 w-5 h-5" /> 상담 전화
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-32 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-[800] tracking-tight mb-6 text-gray-900" data-testid="text-services-title">프리미엄 정비 서비스</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium">
              숙련된 전문가와 최첨단 진단 장비를 통해 모든 문제를 정확히 해결합니다.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              { icon: Settings, title: "엔진 오일 교환", desc: "차량에 맞는 최고급 합성유로 부드러운 주행감을 선사합니다." },
              { icon: Car, title: "타이어 교환 및 점검", desc: "휠 밸런스 및 편마모 점검으로 완벽한 제동력을 보장합니다." },
              { icon: ShieldCheck, title: "브레이크 시스템", desc: "생명과 직결되는 패드, 디스크, 오일을 꼼꼼하게 점검합니다." },
              { icon: Battery, title: "배터리 교체", 시동: "시동 불량의 원인, 노후 배터리를 신속하고 안전하게 교체합니다.", desc: "시동 불량의 원인, 노후 배터리를 신속하고 안전하게 교체합니다." },
              { icon: ThermometerSnowflake, title: "에어컨/히터 점검", desc: "쾌적한 실내 환경을 위한 필터 교체 및 냉매 가스 정밀 충전." },
              { icon: Wrench, title: "종합 정밀 진단", desc: "장거리 주행 전, 차량의 전반적인 상태를 첨단 장비로 진단합니다." }
            ].map((service, idx) => (
              <motion.div
                key={idx}
                variants={fadeIn}
                className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                data-testid={`card-service-${idx}`}
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <service.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">{service.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">{service.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="py-24 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center divide-x divide-white/20">
            <div className="space-y-3">
              <div className="text-5xl font-[900]">15+</div>
              <div className="text-primary-foreground/80 font-medium text-lg">년의 정비 노하우</div>
            </div>
            <div className="space-y-3">
              <div className="text-5xl font-[900]">10k+</div>
              <div className="text-primary-foreground/80 font-medium text-lg">누적 정비 차량</div>
            </div>
            <div className="space-y-3">
              <div className="text-5xl font-[900]">100%</div>
              <div className="text-primary-foreground/80 font-medium text-lg">순정 및 인증 부품</div>
            </div>
            <div className="space-y-3 border-r-0">
              <div className="text-5xl font-[900]">4.9</div>
              <div className="text-primary-foreground/80 font-medium text-lg">고객 만족도</div>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Gallery */}
      <section id="photos" className="py-32 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-[800] tracking-tight mb-6 text-gray-900" data-testid="text-gallery-title">작업 갤러리</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium">
              청결한 작업장과 꼼꼼한 정비 과정을 확인해보세요.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6"
          >
            {photos.map((photo: any, index: number) => (
              <motion.div 
                key={photo.id} 
                variants={fadeIn}
                className="relative group rounded-2xl overflow-hidden break-inside-avoid shadow-sm hover:shadow-xl transition-shadow"
              >
                <img 
                  src={photo.url} 
                  alt={photo.caption} 
                  className="w-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <span className="text-white font-bold text-lg">{photo.caption}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Location */}
      <section id="location" className="py-32 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="space-y-10"
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-[800] tracking-tight mb-6 text-gray-900" data-testid="text-location-title">찾아오시는 길</h2>
                <p className="text-lg text-gray-500 font-medium">
                  진천읍의 중심에 위치하여 어디서든 쉽게 방문하실 수 있습니다.<br />
                  넓은 주차 공간과 쾌적한 대기실이 준비되어 있습니다.
                </p>
              </div>

              <div className="space-y-8 bg-gray-50 p-8 rounded-3xl border border-gray-100">
                <div className="flex gap-6 items-start">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2 text-gray-900">주소</h4>
                    <p className="text-gray-600 text-lg">충청북도 진천군 진천읍 문화로 200-8<br/>드림모터스</p>
                  </div>
                </div>

                <div className="flex gap-6 items-start">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2 text-gray-900">영업시간</h4>
                    <div className="text-gray-600 space-y-1 text-lg">
                      <p>평일: 09:00 - 19:00</p>
                      <p>토요일: 09:00 - 17:00</p>
                      <p className="text-red-500 font-bold mt-1">일요일 및 공휴일 휴무</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 items-start">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2 text-gray-900">문의전화</h4>
                    <p className="text-2xl font-[900] text-primary">010-1234-5678</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl border border-gray-200"
            >
              <img 
                src="https://images.unsplash.com/photo-1541443131876-44b03de101c5?auto=format&fit=crop&w=1200&q=80" 
                alt="매장 외부" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827] to-transparent opacity-80"></div>
              <div className="absolute bottom-0 left-0 w-full p-8 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-6 h-6 text-primary" />
                  <h3 className="text-2xl font-bold">드림모터스 진천점</h3>
                </div>
                <p className="text-gray-300 font-medium">충청북도 진천군 진천읍 문화로 200-8</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
