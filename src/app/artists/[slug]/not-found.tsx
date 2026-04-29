import Link from "next/link";

export default function ArtistNotFound() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
            <p className="font-mono text-5xl font-bold text-primary">404</p>
            <h1 className="text-xl font-semibold">Perfil não encontrado</h1>
            <p className="max-w-sm text-sm text-muted-foreground">
                Esta página não foi encontrada.
            </p>
            <Link
                href="/"
                className="mt-2 rounded border border-border px-4 py-2 text-sm text-muted-foreground hover:border-foreground hover:text-foreground"
            >
                Voltar ao início
            </Link>
        </div>
    );
}
