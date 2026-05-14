"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Network,
  CalendarDays,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { logout } from "@/lib/auth";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Pessoas", href: "/pessoas", icon: Users },
  { label: "Células", href: "/celulas", icon: Network },
  { label: "Agenda", href: "/agenda", icon: CalendarDays },
  { label: "Relatórios", href: "/relatorios", icon: FileText },
];

const BOTTOM_ITEMS = [
  { label: "Configurações", href: "/configuracoes", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const NavLink = ({
    item,
  }: {
    item: { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
  }) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    const linkContent = (
      <Link
        href={item.href}
        onClick={onMobileClose} className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          collapsed && !mobileOpen && "lg:justify-center lg:px-2"
        )}
      >
        <Icon className={cn(
            "h-5 w-5 shrink-0 transition-colors",
            active
              ? "text-primary-foreground"
              : "text-muted-foreground group-hover:text-foreground"
          )}
        />
        {/* Always show labels on mobile, conditionally on desktop */}
        <span className={cn(
          "truncate",
          collapsed && !mobileOpen && "lg:hidden"
        )}>
          {item.label}
        </span>
      </Link>
    );

    // Tooltip only for collapsed desktop sidebar
    if (collapsed && !mobileOpen) {
      return (
        <span className="hidden lg:block">
          <Tooltip>
            <TooltipTrigger>{linkContent}</TooltipTrigger>
            <TooltipContent side="right" sideOffset={12}>
              {item.label}
            </TooltipContent>
          </Tooltip>
        </span>
      );
    }

    return linkContent;
  };

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.push("/login");
    router.refresh();
  }

  const logoutContent = (
    <button
      onClick={handleLogout}
      disabled={loggingOut} className={cn(
        "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground disabled:opacity-60",
        collapsed && !mobileOpen && "lg:justify-center lg:px-2"
      )}
    >
      <LogOut className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
      <span className={cn("truncate", collapsed && !mobileOpen && "lg:hidden")}>
        {loggingOut ? "Saindo..." : "Sair"}
      </span>
    </button>
  );

  return (
    <aside className={cn(
        "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
        // Desktop
        collapsed ? "lg:w-[72px]" : "lg:w-[250px]",
        // Mobile: slide in/out
        mobileOpen
          ? "w-[280px] translate-x-0"
          : "w-[280px] -translate-x-full lg:translate-x-0"
      )}
    >
      {/* Logo / Brand */}
      <div className={cn(
          "flex items-center border-b border-sidebar-border px-4 h-16",
          collapsed && !mobileOpen ? "lg:justify-center" : "gap-3"
        )}
      >
        <div className="flex shrink-0 items-center justify-center">
          <Image
            src="/logo.png"
            alt="Logo IEAB"
            width={120}
            height={36} className="h-9 w-auto object-contain"
            priority
          />
        </div>
        <div className={cn(
          "flex flex-col overflow-hidden",
          collapsed && !mobileOpen && "lg:hidden"
        )}>
          <span className="text-xl font-heading font-bold text-foreground tracking-tight">
            AVIVADASH
          </span>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onMobileClose} className="ml-auto lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-high transition-colors"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="space-y-1 border-t border-sidebar-border px-3 py-4">
        {BOTTOM_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
        {collapsed && !mobileOpen ? (
          <span className="hidden lg:block">
            <Tooltip>
              <TooltipTrigger>{logoutContent}</TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                Sair
              </TooltipContent>
            </Tooltip>
          </span>
        ) : (
          logoutContent
        )}
      </div>

      {/* Collapse Toggle — desktop only */}
      <button
        onClick={onToggle} className={cn(
          "absolute -right-3 top-20 z-50 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
        )}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </aside>
  );
}
