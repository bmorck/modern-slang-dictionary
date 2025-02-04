import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/navbar";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Submit from "@/pages/submit";
import ModLogin from "@/pages/mod-login";
import ModDashboard from "@/pages/mod-dashboard";
import Insights from "@/pages/insights";
import About from "@/pages/about";
import { Footer } from "@/components/footer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/submit" component={Submit} />
      <Route path="/insights" component={Insights} />
      <Route path="/about" component={About} />
      <Route path="/mod/login" component={ModLogin} />
      <Route path="/mod/dashboard" component={ModDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Router />
        </main>
        <Footer />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;