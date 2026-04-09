"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { GlobalSearch } from "@/components/global-search";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/actions/notification-actions";

interface AppShellProps {
  children: React.ReactNode;
  notifications?: Notification[];
  userName?: string;
}

export function AppShell({ children, notifications = [], userName }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  // Ctrl+K to open search
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Public routes bypass the shell entirely
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <div className="relative min-h-screen bg-background">
        {/* Mobile Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden animate-in fade-in-0 duration-200"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <Header
          sidebarCollapsed={sidebarCollapsed}
          onMobileMenuToggle={() => setMobileOpen(true)}
          onSearchOpen={() => setSearchOpen(true)}
          notifications={notifications}
          userName={userName}
        />

        <main
          className={cn(
            "min-h-[calc(100vh-4rem)] transition-all duration-300 p-4 sm:p-6 lg:p-8",
            sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[250px]",
            "ml-0"
          )}
        >
          {children}
        </main>

        {/* Global Search Modal */}
        <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </TooltipProvider>
  );
}
