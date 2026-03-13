import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Search, FileText, ShieldAlert } from "lucide-react";
import StatusBar from "./components/StatusBar";
import QueryPage from "./pages/QueryPage";
import DocumentsPage from "./pages/DocumentsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const NAV_ITEMS = [
  { to: "/", label: "Query", icon: Search },
  { to: "/documents", label: "Documents", icon: FileText },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-56 bg-card border-r border-border flex flex-col h-screen fixed left-0 top-0">
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-primary" />
          <span className="text-lg font-bold text-foreground tracking-tight">OncoAssist</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Clinical Decision Support</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border">
        <StatusBar />
      </div>
    </aside>
  );
};

const AppLayout = () => (
  <div className="flex min-h-screen">
    <Sidebar />
    <main className="flex-1 ml-56">
      <div className="border-b border-border bg-card/50 px-6 py-3">
        <p className="text-xs text-muted-foreground">
          <span className="text-amber font-medium">⚠ Research tool only</span> — Not a substitute for professional clinical judgment. All data stays local.
        </p>
      </div>
      <div className="p-6">
        <Routes>
          <Route path="/" element={<QueryPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </main>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
