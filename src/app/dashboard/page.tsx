import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import EventCalendar from '@/components/EventCalendar'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col">
            <header className="border-b border-zinc-800 bg-zinc-900 p-4 shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">Agenda Clubber</h1>
                    <p className="text-xs text-zinc-400">Coordenação de Datas de Fortaleza</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-zinc-400">{user.email}</span>
                    <form action={async () => {
                        'use server'
                        const supa = await createClient()
                        await supa.auth.signOut()
                        redirect('/login')
                    }}>
                        <Button type="submit" variant="outline" className="border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700">
                            Sair
                        </Button>
                    </form>
                </div>
            </header>

            <main className="flex-1 p-4 md:p-8 overflow-hidden">
                <div className="mx-auto max-w-7xl h-full flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl shadow-black/50 p-6">
                    <h2 className="text-2xl font-bold text-zinc-100 mb-6">Calendário de Eventos</h2>
                    <div className="flex-1 relative min-h-[600px]">
                        {/* Componente ClientSide do Calendário */}
                        <EventCalendar />
                    </div>
                </div>
            </main>
        </div>
    )
}
