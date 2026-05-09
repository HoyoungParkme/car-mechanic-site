import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Clock, CalendarCheck, CheckCircle2 } from "lucide-react";

export default function Reservation() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    serviceType: "",
    vehicleModel: "",
    vehicleNumber: "",
    notes: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <div className="flex-1 flex items-center justify-center">Loading...</div>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!user) {
      setLocation("/login");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      
      if (response.status === 401) {
        setLocation("/login");
        return;
      }
      
      if (!response.ok) {
        throw new Error('예약 접수 중 오류가 발생했습니다.');
      }
      
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || '예약 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 bg-muted/30">
        <div className="max-w-md w-full px-4">
          <Card className="border-border shadow-lg">
            <CardContent className="pt-12 pb-12 flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">예약이 완료되었습니다</h2>
              <p className="text-muted-foreground text-lg">
                접수하신 내역을 확인 후, 기재해주신 연락처로 확정 안내 문자를 보내드립니다.
              </p>
              <Button 
                className="mt-6 w-full h-12 text-base font-semibold" 
                onClick={() => setLocation("/")}
              >
                홈으로 돌아가기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-muted/10 py-12 md:py-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Left Panel - Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">정비 예약</h1>
              <p className="text-lg text-muted-foreground">
                전문가의 꼼꼼한 진단과 정비를 위해<br />
                사전 예약을 권장해 드립니다.
              </p>
            </div>
            
            <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">오시는 길</h3>
                    <p className="text-muted-foreground">충청북도 진천군 진천읍 문화로 200-8 드림모터스</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">영업 시간</h3>
                    <div className="text-muted-foreground space-y-1">
                      <p>평일: 09:00 - 19:00</p>
                      <p>토요일: 09:00 - 17:00</p>
                      <p className="text-destructive font-medium">일요일 및 공휴일 휴무</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">문의 전화</h3>
                    <p className="text-foreground text-xl font-bold">010-1234-5678</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Panel - Form */}
          <div className="lg:col-span-3">
            <Card className="border-border shadow-xl">
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">이름</label>
                      <Input 
                        name="name" 
                        required 
                        placeholder="홍길동" 
                        className="h-12"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">연락처</label>
                      <Input 
                        name="phone" 
                        required 
                        placeholder="010-0000-0000" 
                        className="h-12"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">예약 일자</label>
                      <Input 
                        type="date" 
                        name="date" 
                        required 
                        className="h-12"
                        value={formData.date}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">예약 시간</label>
                      <Select required onValueChange={(val) => handleSelectChange('time', val)} value={formData.time}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="시간 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">정비 항목</label>
                    <Select required onValueChange={(val) => handleSelectChange('serviceType', val)} value={formData.serviceType}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="어떤 정비가 필요하신가요?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="엔진오일 교환">엔진오일 교환</SelectItem>
                        <SelectItem value="타이어 교환">타이어 교환</SelectItem>
                        <SelectItem value="브레이크 점검">브레이크 점검</SelectItem>
                        <SelectItem value="배터리 교체">배터리 교체</SelectItem>
                        <SelectItem value="에어컨 점검">에어컨 점검</SelectItem>
                        <SelectItem value="종합 정밀진단">종합 정밀진단</SelectItem>
                        <SelectItem value="기타">기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">차량 모델</label>
                      <Input 
                        name="vehicleModel" 
                        required 
                        placeholder="예: 그랜저 IG" 
                        className="h-12"
                        value={formData.vehicleModel}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">차량 번호</label>
                      <Input 
                        name="vehicleNumber" 
                        required 
                        placeholder="예: 12가 3456" 
                        className="h-12"
                        value={formData.vehicleNumber}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">요청 사항 및 상세 증상</label>
                    <Textarea 
                      name="notes" 
                      placeholder="차량의 이상 증상이나 특별히 점검이 필요한 부분을 자유롭게 적어주세요." 
                      className="min-h-[120px] resize-none"
                      value={formData.notes}
                      onChange={handleChange}
                    />
                  </div>

                  {error && <div className="text-sm text-destructive font-medium">{error}</div>}

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full h-14 text-lg font-bold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "처리 중..." : (
                      <>
                        <CalendarCheck className="mr-2 w-5 h-5" />
                        예약 신청하기
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
