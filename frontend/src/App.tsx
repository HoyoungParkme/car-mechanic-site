import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Reservation from "@/pages/Reservation";
import Layout from "@/components/Layout";

/**
 * Sprint 7 / REQ-04 (시나리오 X) — 정적 사이트.
 *
 * 백엔드·로그인·관리자 페이지·예약 시스템 모두 폐기.
 * 라우트는 홈·예약 안내·404만 남는다. 데이터는 모두 `@/data/shop`에서 가져온다.
 */
function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/reservation" component={Reservation} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
