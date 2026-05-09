import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const fetchWithCreds = async (url: string, options: RequestInit = {}) => {
  const res = await fetch(url, { ...options, credentials: 'include' });
  if (!res.ok) throw new Error('API Error');
  return res.json();
};

function ReservationsTab() {
  const queryClient = useQueryClient();
  const { data: reservations, isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => fetchWithCreds('/api/reservations')
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number, status: string }) => 
      fetchWithCreds(`/api/reservations/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: data.status })
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] })
  });

  if (isLoading) return <div>Loading...</div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-500 hover:bg-yellow-600">대기중</Badge>;
      case 'confirmed': return <Badge className="bg-green-500 hover:bg-green-600">확정됨</Badge>;
      case 'cancelled': return <Badge className="bg-red-500 hover:bg-red-600">취소됨</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>예약 관리</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>일시</TableHead>
              <TableHead>고객명</TableHead>
              <TableHead>연락처</TableHead>
              <TableHead>정비 항목</TableHead>
              <TableHead>차량</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations?.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell>{r.date} {r.time}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.phone}</TableCell>
                <TableCell>{r.serviceType}</TableCell>
                <TableCell>{r.vehicleModel} ({r.vehicleNumber})</TableCell>
                <TableCell>{getStatusBadge(r.status)}</TableCell>
                <TableCell className="space-x-2">
                  <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: r.id, status: 'confirmed' })}>확정</Button>
                  <Button size="sm" variant="outline" className="text-red-500" onClick={() => updateMutation.mutate({ id: r.id, status: 'cancelled' })}>취소</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PhotosTab() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");

  const { data: photos, isLoading } = useQuery({
    queryKey: ['photos'],
    queryFn: () => fetchWithCreds('/api/photos').catch(() => [])
  });

  const addMutation = useMutation({
    mutationFn: () => fetchWithCreds('/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, caption })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      setOpen(false);
      setUrl("");
      setCaption("");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchWithCreds(`/api/photos/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['photos'] })
  });

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>사진 관리</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">사진 추가</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>새 사진 추가</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <Input placeholder="이미지 URL" value={url} onChange={e => setUrl(e.target.value)} />
              <Input placeholder="사진 설명" value={caption} onChange={e => setCaption(e.target.value)} />
              <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !url}>추가하기</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {photos?.map((p: any) => (
            <div key={p.id} className="relative group rounded-lg overflow-hidden border border-border">
              <img src={p.url} alt={p.caption} className="w-full h-48 object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                <p className="text-white text-center font-medium mb-4">{p.caption}</p>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  className="absolute bottom-4"
                  onClick={() => deleteMutation.mutate(p.id)}
                >삭제</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ExpertiseTab() {
  const queryClient = useQueryClient();
  const { data: expertise, isLoading } = useQuery({
    queryKey: ['expertise'],
    queryFn: () => fetchWithCreds('/api/expertise').catch(() => [])
  });

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", icon_name: "Wrench", sort_order: 0 });

  const addMutation = useMutation({
    mutationFn: () => fetchWithCreds('/api/expertise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expertise'] });
      setOpen(false);
      setFormData({ title: "", description: "", icon_name: "Wrench", sort_order: 0 });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchWithCreds(`/api/expertise/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expertise'] })
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>전문기술 관리</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">기술 추가</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>새 전문기술 추가</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <Input placeholder="기술명" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              <Textarea placeholder="설명" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              <Input placeholder="아이콘 이름 (예: Wrench)" value={formData.icon_name} onChange={e => setFormData({ ...formData, icon_name: e.target.value })} />
              <Input type="number" placeholder="정렬 순서" value={formData.sort_order} onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} />
              <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !formData.title}>추가하기</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>순서</TableHead>
              <TableHead>아이콘</TableHead>
              <TableHead>기술명</TableHead>
              <TableHead>설명</TableHead>
              <TableHead>관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expertise?.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell>{item.sort_order}</TableCell>
                <TableCell>{item.icon_name}</TableCell>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(item.id)}>삭제</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ShopInfoTab() {
  const queryClient = useQueryClient();
  const { data: info, isLoading } = useQuery({
    queryKey: ['shop-info'],
    queryFn: () => fetchWithCreds('/api/shop-info').catch(() => ({}))
  });

  const [formData, setFormData] = useState({
    name: "", address: "", phone: "", hours_weekday: "", hours_saturday: "", hours_sunday: ""
  });

  useEffect(() => {
    if (info && !isLoading) {
      setFormData(info);
    }
  }, [info, isLoading]);

  const updateMutation = useMutation({
    mutationFn: () => fetchWithCreds('/api/shop-info', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shop-info'] })
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>매장정보 관리</CardTitle>
        <CardDescription>홈페이지 하단 등에 노출되는 정보입니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-xl">
        <div className="space-y-2">
          <label className="text-sm font-semibold">매장명</label>
          <Input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">주소</label>
          <Input value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">연락처</label>
          <Input value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">평일 영업시간</label>
          <Input value={formData.hours_weekday || ''} onChange={e => setFormData({ ...formData, hours_weekday: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">토요일 영업시간</label>
          <Input value={formData.hours_saturday || ''} onChange={e => setFormData({ ...formData, hours_saturday: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">일요일/공휴일 휴무 안내</label>
          <Input value={formData.hours_sunday || ''} onChange={e => setFormData({ ...formData, hours_sunday: e.target.value })} />
        </div>
        <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>저장하기</Button>
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const { user, isLoading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!isAdmin) return <div className="p-8 text-center text-red-500 font-bold text-2xl">권한 없음</div>;

  return (
    <div className="container mx-auto px-4 py-8 bg-muted/10 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 tracking-tight">관리자 대시보드</h1>
      
      <Tabs defaultValue="reservations">
        <TabsList className="mb-8">
          <TabsTrigger value="reservations">예약 관리</TabsTrigger>
          <TabsTrigger value="photos">사진 관리</TabsTrigger>
          <TabsTrigger value="expertise">전문기술</TabsTrigger>
          <TabsTrigger value="shopInfo">매장정보</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reservations">
          <ReservationsTab />
        </TabsContent>
        
        <TabsContent value="photos">
          <PhotosTab />
        </TabsContent>
        
        <TabsContent value="expertise">
          <ExpertiseTab />
        </TabsContent>
        
        <TabsContent value="shopInfo">
          <ShopInfoTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
