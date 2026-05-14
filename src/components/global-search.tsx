"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Network, Calendar, X, Loader2, ArrowRight } from "lucide-react";
import { globalSearch } from "@/lib/actions/search-actions";

const TYPE_CONFIG = {
  person: { icon: Users, label: "Pessoas", color: "icon-tile-primary" },
  cell: { icon: Network, label: "Células", color: "icon-tile-gold" },
  event: { icon: Calendar, label: "Agenda", color: "icon-tile-success" },
};

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Awaited<ReturnType<typeof globalSearch>>>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  // Focus input when opened
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Debounced search
  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await globalSearch(query);
        setResults(res);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  // Keyboard shortcut Ctrl+K
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (open) {
          onClose();
        } else {
          // parent handles opening
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  function handleNavigate(href: string) {
    router.push(href);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleNavigate(results[selectedIndex].href);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  // Group results by type
  const grouped = results.reduce(
    (acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    },
    {} as Record<string, typeof results>
  );

  if (!open) return null;

  let flatIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 top-[15%] z-50 mx-auto w-full max-w-[560px] px-4 animate-in fade-in-0 slide-in-from-top-4 duration-200">
        <div className="app-card overflow-hidden shadow-2xl">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 border-b border-border">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar membros, células, eventos..." className="flex-1 h-14 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <button
              onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-high text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            {query.trim().length < 2 ? (
              <div className="py-8 text-center">
                <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Digite pelo menos 2 caracteres para buscar
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Busque por nome, célula ou evento
                </p>
              </div>
            ) : results.length === 0 && !loading ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhum resultado encontrado para &ldquo;{query}&rdquo;
                </p>
              </div>
            ) : (
              Object.entries(grouped).map(([type, items]) => {
                const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
                const Icon = config.icon;
                return (
                  <div key={type} className="mb-2 last:mb-0">
                    <p className="section-kicker px-2 py-1.5">
                      {config.label}
                    </p>
                    {items.map((item) => {
                      const currentIndex = flatIndex++;
                      const isSelected = currentIndex === selectedIndex;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigate(item.href)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                            isSelected
                              ? "bg-primary/10 text-foreground"
                              : "text-foreground hover:bg-surface-high"
                          }`}
                        >
                          <div className={`icon-tile h-8 w-8 rounded-lg ${config.color}`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.subtitle}
                            </p>
                          </div>
                          {isSelected && (
                            <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2.5 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface-high border border-border font-mono">↑↓</kbd>
              Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface-high border border-border font-mono">Enter</kbd>
              Abrir
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-surface-high border border-border font-mono">Esc</kbd>
              Fechar
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
