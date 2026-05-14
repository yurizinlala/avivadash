"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Search, Cake, Calendar, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { logout } from "@/lib/auth";
import type { Notification } from "@/lib/actions/notification-actions";

interface HeaderProps {
  sidebarCollapsed: boolean;
  onMobileMenuToggle: () => void;
  onSearchOpen?: () => void;
  notifications?: Notification[];
  userName?: string;
}

export function Header({ sidebarCollapsed, onMobileMenuToggle, onSearchOpen, notifications = [], userName }: HeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [dismissedIds, setDismissedIds] = React.useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = React.useState(false);
  const bellRef = React.useRef<HTMLDivElement>(null);

  // Close notification panel on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    // Hydrate dismissed notifications from localStorage
    try {
      const stored = localStorage.getItem("avivadash_dismissed_notifications");
      if (stored) {
        setDismissedIds(new Set(JSON.parse(stored)));
      }
    } catch {}
    setHydrated(true);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.push("/login");
    router.refresh();
  }

  function dismissNotification(id: string) {
    setDismissedIds((prev) => {
      const next = new Set(prev).add(id);
      try {
        localStorage.setItem("avivadash_dismissed_notifications", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }

  const activeNotifications = notifications.filter((n) => !dismissedIds.has(n.id));
  const notifCount = hydrated ? activeNotifications.length : notifications.length;

  const initials = userName
    ? userName
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "PA";

  const notifIcon: Record<string, React.ReactNode> = {
    birthday: <Cake className="h-4 w-4 text-gold-muted dark:text-gold" />,
    event: <Calendar className="h-4 w-4 text-primary" />,
    visitor: <UserPlus className="h-4 w-4 text-success" />,
    report: <Bell className="h-4 w-4 text-gold-muted dark:text-gold" />,
  };

  return (
    <header className={cn(
        "header sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4 sm:px-6 transition-all duration-300",
        sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[250px]",
        "ml-0"
      )}
    >
      {/* Left — Mobile Menu + Search */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon" className="lg:hidden h-9 w-9 rounded-xl"
          onClick={onMobileMenuToggle}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
        </Button>

        <button
          onClick={onSearchOpen} className="relative hidden md:flex items-center cursor-pointer group"
        >
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <div className="h-9 w-[280px] rounded-xl bg-surface-high pl-9 pr-4 text-sm text-muted-foreground flex items-center transition-colors group-hover:bg-surface-lowest group-hover:ring-2 group-hover:ring-primary/20">
            Buscar membros, células...
            <kbd className="ml-auto rounded border border-border/50 bg-background/60 px-1.5 py-0.5 font-mono text-xs text-muted-foreground/60">
              Ctrl+K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={bellRef}>
          <Button
            variant="ghost"
            size="icon" className="relative h-9 w-9 rounded-xl hover:bg-surface-high transition-colors"
            aria-label="Notificações"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-[1.1rem] w-[1.1rem] text-muted-foreground" />
            {notifCount > 0 && (
              <Badge className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center border-0 bg-gold p-0 text-xs text-gold-foreground">
                {notifCount > 9 ? "9+" : notifCount}
              </Badge>
            )}
          </Button>

          {/* Notification Panel */}
          {showNotifications && (
            <div className="app-card absolute right-0 top-full z-50 mt-2 w-[340px] overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-sm font-heading font-semibold text-foreground">
                  Notificações
                </h3>
                <span className="text-xs text-muted-foreground">
                  {notifCount === 0 ? "Tudo em dia 🎉" : `${notifCount} nova${notifCount > 1 ? "s" : ""}`}
                </span>
              </div>

              <div className="max-h-[320px] overflow-y-auto">
                {activeNotifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma notificação no momento.
                    </p>
                  </div>
                ) : (
                  activeNotifications.map((notif) => (
                    <div
                      key={notif.id} className="flex items-start gap-3 p-3 hover:bg-surface-high/50 transition-colors group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-high shrink-0 mt-0.5">
                        {notifIcon[notif.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">
                          {notif.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {notif.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-muted-foreground/60">
                          {notif.time}
                        </span>
                        <button
                          onClick={() => dismissNotification(notif.id)} className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-all"
                          aria-label="Descartar"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon" className="h-9 w-9 rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Sair"
        >
          <LogOut className="h-[1.1rem] w-[1.1rem]" />
        </Button>

        {/* User Avatar */}
        <button
          onClick={() => router.push("/configuracoes")} className="flex items-center gap-2 rounded-xl p-1 hover:bg-surface-high transition-colors ml-1"
        >
          <Avatar className="h-8 w-8 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  );
}
