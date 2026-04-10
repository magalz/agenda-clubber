import Link from 'next/link';
import { signup } from '../actions';

export default function SignupPage({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-zinc-100 p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-zinc-800 bg-zinc-950 p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tighter">Cadastro</h1>
          <p className="text-zinc-400">Crie sua conta no agenda-clubber</p>
        </div>
        <form className="space-y-4" action={signup}>
          <div className="space-y-2">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              required
              className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-700"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-700"
            />
          </div>
          {searchParams?.message && (
            <p className="mt-4 p-4 bg-zinc-900 border border-zinc-800 text-zinc-300 text-center rounded">
              {searchParams.message}
            </p>
          )}
          <button className="w-full rounded bg-zinc-100 py-2 font-semibold text-black transition hover:bg-zinc-300">
            Criar Conta
          </button>
        </form>
        <div className="text-center text-sm">
          Já tem conta?{' '}
          <Link href="/login" className="font-semibold underline">
            Faça login
          </Link>
        </div>
      </div>
    </div>
  );
}
