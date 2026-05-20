"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  FileText,
  LayoutDashboard,
  Network,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV_ITEMS = [
  { label: "Início", href: "/", icon: LayoutDashboard },
  { label: "Pessoas", href: "/pessoas", icon: Users },
  { label: "Células", href: "/celulas", icon: Network },
  { label: "Agenda", href: "/agenda", icon: CalendarDays },
  { label: "Relatórios", href: "/relatorios", icon: FileText },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(28,27,27,0.08)] backdrop-blur-xl lg:hidden"
      aria-label="Navegação principal"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-surface-high hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  active ? "text-primary-foreground" : "text-muted-foreground"
                )}
              />
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
