import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { getNotifications } from "@/lib/actions/notification-actions";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading-family",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "IEAB Gestão — Sistema de Gestão Eclesiástica",
  description:
    "Plataforma moderna de administração da Igreja Evangélica Avivamento Bíblico. Gerencie membros, células, agenda e relatórios em um só lugar.",
  keywords: [
    "gestão eclesiástica",
    "igreja",
    "IEAB",
    "membros",
    "células",
    "relatórios",
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let notifications: Awaited<ReturnType<typeof getNotifications>> = [];
  let userName: string | undefined;

  try {
    const user = await getCurrentUser();
    if (user) {
      userName = user.name;
      notifications = await getNotifications();
    }
  } catch {
    // Not authenticated or DB not ready - gracefully continue
  }

  return (
    <html
      lang="pt-BR" className={`${dmSans.variable} ${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AppShell notifications={notifications} userName={userName}>
            {children}
          </AppShell>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
