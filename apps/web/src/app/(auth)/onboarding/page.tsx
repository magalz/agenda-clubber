import { completeOnboarding } from '../actions';

export default function OnboardingPage({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-zinc-100 p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-zinc-800 bg-zinc-950 p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tighter">Bem-vindo(a)</h1>
          <p className="text-zinc-400">Complete seu perfil para começar</p>
        </div>
        <form className="space-y-4" action={completeOnboarding}>
          <div className="space-y-2">
            <label htmlFor="username">Username / Nome</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Ex: Coletivo Ignis ou DJ Fulano"
              required
              className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-700"
            />
          </div>
          <div className="space-y-2">
            <label>Seu perfil principal</label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex cursor-pointer items-center justify-center space-x-2 rounded border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-700 has-[:checked]:border-zinc-100">
                <input
                  type="radio"
                  name="role"
                  value="collective"
                  required
                  className="hidden"
                />
                <span>Coletivo</span>
              </label>
              <label className="flex cursor-pointer items-center justify-center space-x-2 rounded border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-700 has-[:checked]:border-zinc-100">
                <input type="radio" name="role" value="artist" className="hidden" />
                <span>Artista</span>
              </label>
            </div>
          </div>
          {searchParams?.message && (
            <p className="mt-4 p-4 bg-zinc-900 border border-zinc-800 text-zinc-300 text-center rounded">
              {searchParams.message}
            </p>
          )}
          <button className="w-full rounded bg-zinc-100 py-2 font-semibold text-black transition hover:bg-zinc-300">
            Finalizar Perfil
          </button>
        </form>
      </div>
    </div>
  );
}
