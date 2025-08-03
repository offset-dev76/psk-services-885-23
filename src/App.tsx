
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Apps from "./pages/Apps";
import Restaurant from "./pages/Restaurant";
import Services from "./pages/Services";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import References from "./pages/References";
import Booking from "./pages/Booking";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <main className="min-h-screen bg-black">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/apps" element={<Apps />} />
            <Route path="/restaurant" element={<Restaurant />} />
            <Route path="*" element={<Index />} />
          </Routes>
        </main>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
