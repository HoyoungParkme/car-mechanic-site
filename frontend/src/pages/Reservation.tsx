import { motion, type Variants } from "framer-motion";
import { useLocation } from "wouter";
import { Phone, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SHOP } from "@/data/shop";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

/**
 * 예약 안내 페이지 (Sprint 7, 시나리오 X).
 *
 * 사이트엔 예약 폼이 없다. 손님이 전화번호로 직접 전화해서 예약한다.
 * 이 페이지는 전화걸기 큰 버튼 + 영업시간 + 위치 안내.
 */
export default function Reservation() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex-1 bg-slate-50 py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">정비 예약</h1>
          <p className="mt-3 text-gray-500 text-lg">전화 한 통이면 끝입니다. 상담부터 정비까지 빠르게 도와드릴게요.</p>
        </motion.div>

        {/* 큰 전화 버튼 */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <Card className="border-0 shadow-xl ring-1 ring-slate-100 bg-white overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-8 py-10 text-center text-white">
              <Phone className="w-12 h-12 mx-auto mb-3 opacity-90" />
              <p className="text-sm uppercase tracking-widest opacity-80 mb-1">전화 예약</p>
              <p className="text-3xl md:text-4xl font-extrabold tracking-tight" data-testid="text-phone-number">{SHOP.phone}</p>
              <Button
                asChild
                size="lg"
                className="mt-6 h-13 px-10 bg-white text-blue-700 hover:bg-blue-50 font-bold text-base shadow-md"
                data-testid="button-call-now"
              >
                <a href={SHOP.phoneTel}>지금 전화하기</a>
              </Button>
            </div>

            <CardContent className="p-6 space-y-4">
              <Info icon={Clock} title="영업시간"
                content={`평일 ${SHOP.weekdayHours}\n토요일 ${SHOP.saturdayHours}\n${SHOP.holidayNote}`} />
              <Info icon={MapPin} title="위치" content={SHOP.address} />
              <Info icon={CheckCircle2} title="이렇게 도와드립니다"
                content={
                  "1) 전화로 증상·차량 정보를 알려주세요\n" +
                  "2) 방문 가능 시간을 함께 정합니다\n" +
                  "3) 예약 시간에 방문해 정비 받으세요"
                } />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mt-8 text-center">
          <Button variant="ghost" onClick={() => setLocation("/")} className="text-sm text-gray-600">
            ← 홈으로 돌아가기
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, title, content }: { icon: typeof Phone; title: string; content: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{title}</p>
        <p className="text-gray-800 text-sm font-medium whitespace-pre-line leading-relaxed">{content}</p>
      </div>
    </div>
  );
}
