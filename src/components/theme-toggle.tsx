"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
        <Sun className="h-[1.1rem] w-[1.1rem]" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon" className="h-9 w-9 rounded-xl hover:bg-surface-high transition-colors"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      {theme === "dark" ? (
        <Sun className="h-[1.1rem] w-[1.1rem] text-gold transition-transform duration-300" />
      ) : (
        <Moon className="h-[1.1rem] w-[1.1rem] text-primary transition-transform duration-300" />
      )}
    </Button>
  );
}
