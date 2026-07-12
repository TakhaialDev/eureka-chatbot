import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "@/assets/styles/globals.css";
import { Suspense } from "react";
import ClientProvider from "@/components/hooks/ClientProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eureka Shopping Assistant",
  description: "Your AI-powered shopping guide for Eureka Kuwait — electronics, home appliances, and more.",
    icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <div style={{ overflowX: "hidden", maxWidth: "100vw", position: "relative" }}>
            <ClientProvider>
              <Suspense
                fallback={
                  <div className="fixed inset-0 flex items-center justify-center bg-background">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary eureka-spinner" />
                  </div>
                }
              >
                {children}
              </Suspense>
            </ClientProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
