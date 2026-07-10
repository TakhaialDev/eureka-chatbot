import type { Metadata } from "next";
import "@/assets/styles/globals.css";
import { Suspense } from "react";
import ClientProvider from "@/components/hooks/ClientProvider";



export const metadata: Metadata = {
  title: "Eureka Shopping Assistant",
  description: "Eureka Shopping Assistant",
  icons:{
    icon:"/logo.png"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`bg-cream-bg`}>
        <div style={{ overflowX: "hidden", maxWidth: "100vw", position: "relative" }}>
          <ClientProvider>
            <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-dark-navy"><div className="w-16 h-16 border-4 border-primary-gold/20 border-t-primary-gold rounded-full animate-spin" /></div>}>
              {children}
            </Suspense>
          </ClientProvider>
        </div>
      </body>
    </html>
  );
}
