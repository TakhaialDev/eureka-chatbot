import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

export default function MainLayout({children}: {children: React.ReactNode}) {
    return(
        <div className='min-h-dvh flex '>
            <Sidebar />
            <div className='flex-1 flex flex-col min-w-0 h-dvh'>
                <Header />
                <main className='flex-1 flex flex-col p-2 sm:p-4 overflow-hidden bg-cream-bg'>
                    {children}
                </main>
            </div>
        </div>
    )
}