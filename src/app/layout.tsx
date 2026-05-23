import type { Metadata, Viewport } from "next";
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://avivadash.vercel.app"
  ),
  applicationName: "AvivaDash",
  title: {
    default: "AvivaDash — Gestão IEAB",
    template: "%s | AvivaDash",
  },
  description:
    "Sistema de gestão eclesiástica da Igreja Evangélica Avivamento Bíblico para membros, células, agenda e relatórios.",
  keywords: [
    "gestão eclesiástica",
    "igreja",
    "IEAB",
    "membros",
    "células",
    "relatórios",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "AvivaDash",
    statusBarStyle: "black-translucent",
    startupImage: "/icons/splash-2048.png",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcf9f8" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
  colorScheme: "light dark",
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
