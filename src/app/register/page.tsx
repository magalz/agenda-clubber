import Link from 'next/link'
import { signup } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'

export default async function RegisterPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string }>
}) {
    const resolvedParams = await searchParams
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-950 text-zinc-50">
            <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold tracking-tighter text-zinc-50">Cadastro</CardTitle>
                    <CardDescription className="text-zinc-400">
                        Crie sua conta no Agenda Clubber.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={signup} className="flex-1 flex flex-col w-full justify-center gap-4 text-foreground">
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-zinc-300">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                placeholder="seu@email.com"
                                required
                                className="bg-zinc-800 border-zinc-700 text-zinc-100"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password" className="text-zinc-300">Senha</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                className="bg-zinc-800 border-zinc-700 text-zinc-100"
                            />
                        </div>
                        <Button type="submit" className="w-full mt-4 bg-zinc-50 text-zinc-900 hover:bg-zinc-200">
                            Registrar
                        </Button>
                        {resolvedParams?.message && (
                            <p className="mt-4 p-4 bg-zinc-800 border border-zinc-700 text-zinc-300 text-center text-sm rounded-md">
                                {resolvedParams.message}
                            </p>
                        )}
                    </form>
                </CardContent>
                <CardFooter className="justify-center border-t border-zinc-800 pt-4 mt-2">
                    <p className="text-sm text-zinc-400">
                        Já tem uma conta?{' '}
                        <Link href="/login" className="text-zinc-50 underline hover:text-zinc-300 transition-colors">
                            Fazer login
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
