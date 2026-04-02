import Link from 'next/link'
import { signup } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { UserPlus, Mail, Lock } from 'lucide-react'

export default async function RegisterPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string }>
}) {
    const resolvedParams = await searchParams
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-black text-zinc-50 font-sans selection:bg-zinc-50 selection:text-black">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(24,24,27,1)_0%,rgba(0,0,0,1)_100%)] z-0" />
            
            <Card className="w-full max-w-sm bg-zinc-950/50 border-zinc-800/50 backdrop-blur-2xl z-10 shadow-2xl overflow-hidden rounded-2xl">
                <div className="bg-gradient-to-br from-zinc-900 to-black p-6 border-b border-zinc-800">
                    <CardHeader className="p-0">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-white p-2 rounded-xl shadow-lg shadow-white/10">
                                <UserPlus className="w-6 h-6 text-black" />
                            </div>
                            <CardTitle className="text-2xl font-bold tracking-tighter text-white">Cadastro</CardTitle>
                        </div>
                        <CardDescription className="text-zinc-500 font-medium">
                            Crie sua conta no Agenda Clubber.
                        </CardDescription>
                    </CardHeader>
                </div>
                
                <CardContent className="p-6">
                    <form action={signup} className="flex flex-col gap-6">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <Mail className="w-3 h-3" /> Email
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    required
                                    className="bg-zinc-900 border-zinc-800 focus:border-white/20 transition-all h-11 rounded-xl"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                    <Lock className="w-3 h-3" /> Senha
                                </Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="bg-zinc-900 border-zinc-800 focus:border-white/20 transition-all h-11 rounded-xl"
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-11 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition-all shadow-lg shadow-white/5 uppercase tracking-wide">
                            REGISTRAR
                        </Button>

                        {resolvedParams?.message && (
                            <div className="p-4 bg-zinc-900/50 border border-zinc-800/50 text-zinc-400 text-center text-xs rounded-xl font-medium italic">
                                "{resolvedParams.message}"
                            </div>
                        )}
                    </form>
                </CardContent>
                
                <CardFooter className="justify-center border-t border-zinc-800/50 bg-zinc-950/30 py-4">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Já tem uma conta?{' '}
                        <Link href="/login" className="text-white font-bold hover:underline transition-all">
                            FAZER LOGIN
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
