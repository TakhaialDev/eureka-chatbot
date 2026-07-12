import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { BackgroundEffects } from "@/components/layout/BackgroundEffects";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh flex bg-background">
      <BackgroundEffects />
      <Sidebar />
      <div className="relative z-10 flex-1 flex flex-col min-w-0 h-dvh">
        <Header />
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
