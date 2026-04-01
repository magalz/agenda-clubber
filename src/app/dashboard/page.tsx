import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import EventCalendar from '@/components/EventCalendar'
import { Button } from '@/components/ui/button'
import { LogOut, Calendar as CalendarIcon } from 'lucide-react'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-black text-zinc-50 flex flex-col font-sans selection:bg-zinc-50 selection:text-black">
            <header className="border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50 p-4 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-1.5 rounded-lg shadow-lg shadow-white/5">
                        <CalendarIcon className="w-5 h-5 text-black" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-white leading-tight">Agenda Clubber</h1>
                        <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-500">Coordenação • Fortaleza</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-xs font-medium text-zinc-400">Logado como</span>
                        <span className="text-xs font-bold text-white">{user.email}</span>
                    </div>
                    <form action={async () => {
                        'use server'
                        const supa = await createClient()
                        await supa.auth.signOut()
                        redirect('/login')
                    }}>
                        <Button type="submit" variant="outline" size="sm" className="border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all gap-2">
                            <LogOut className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Sair</span>
                        </Button>
                    </form>
                </div>
            </header>

            <main className="flex-1 p-4 md:p-8">
                <div className="mx-auto max-w-7xl h-full flex flex-col bg-zinc-950 border border-zinc-800/50 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden">
                    <div className="p-6 border-b border-zinc-800/50 bg-zinc-900/20">
                        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            Calendário de Eventos
                        </h2>
                        <p className="text-sm text-zinc-500 mt-0.5">Gerencie a programação e evite conflitos de datas.</p>
                    </div>
                    <div className="flex-1 relative p-4 min-h-[700px]">
                        <EventCalendar />
                    </div>
                </div>
            </main>
        </div>
    )
}
