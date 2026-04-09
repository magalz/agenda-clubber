import { APP_NAME, areDatesOverlapping } from "shared";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isConfigured = !!supabaseUrl && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'SUA_ANON_KEY_AQUI';

  // Quick Conflict Engine Test for the health check
  const hasConflict = areDatesOverlapping(
    '2026-05-01T22:00:00Z', '2026-05-02T06:00:00Z',
    '2026-05-02T04:00:00Z', '2026-05-02T10:00:00Z'
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background text-foreground">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm flex flex-col gap-8">
        <h1 className="text-5xl font-bold text-accent tracking-tighter uppercase mb-2">
          {APP_NAME}
        </h1>
        <p className="border-b border-muted bg-muted/20 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-muted/10 lg:p-4 text-center">
          Status: <span className="text-accent font-bold">Ground Zero Operational</span>
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {/* Framework Card */}
          <div className="p-6 border border-muted rounded-lg bg-muted/20 hover:border-accent/50 transition-colors">
            <h2 className="text-xl font-semibold mb-2 text-accent">Plataforma</h2>
            <ul className="text-foreground/70 space-y-1">
              <li>Next.js 15 (App Router)</li>
              <li>Tailwind CSS v4</li>
              <li>TypeScript</li>
            </ul>
          </div>

          {/* Conflict Engine Card */}
          <div className="p-6 border border-muted rounded-lg bg-muted/20 hover:border-accent/50 transition-colors">
            <h2 className="text-xl font-semibold mb-2 text-accent">Conflict Engine</h2>
            <p className="text-foreground/70 mb-2">Workspace: <code className="text-accent">packages/shared</code></p>
            <p className="text-foreground/70">
              Test Run: {hasConflict ? <span className="text-green-400">Conflict Detected ✓</span> : <span className="text-red-400">Failed</span>}
            </p>
          </div>

          {/* Supabase Card */}
          <div className="p-6 border border-muted rounded-lg bg-muted/20 hover:border-accent/50 transition-colors md:col-span-2 lg:col-span-1">
            <h2 className="text-xl font-semibold mb-2 text-accent">Supabase SDK</h2>
            <p className="text-foreground/70 mb-2">
              Status: {isConfigured ? <span className="text-green-400">Configurado</span> : <span className="text-yellow-400">Aguardando Chave Anon</span>}
            </p>
            <p className="text-foreground/50 font-mono text-[10px] break-all">
              {supabaseUrl || "URL não encontrada"}
            </p>
          </div>
        </div>

        {!isConfigured && (
          <div className="mt-4 p-4 border border-yellow-500/50 rounded bg-yellow-500/10 text-yellow-200 text-xs">
            ⚠️ Adicione sua <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY</strong> no arquivo <code>apps/web/.env.local</code> para habilitar o banco de dados.
          </div>
        )}
      </div>
    </main>
  );
}
