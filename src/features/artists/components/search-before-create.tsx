"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { searchRestrictedArtistByName, type RestrictedArtistHit } from "@/features/artists/actions";

type SearchResult =
    | { step: 'claim'; hit: RestrictedArtistHit }
    | { step: 'create'; artisticName: string };

interface SearchBeforeCreateProps {
    onProceed: (result: SearchResult) => void;
}

export function SearchBeforeCreate({ onProceed }: SearchBeforeCreateProps) {
    const [query, setQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setError(null);

        try {
            const result = await searchRestrictedArtistByName(query.trim());

            if (result.error) {
                setError(result.error.message);
                return;
            }

            const { hit, conflict } = result.data!;

            if (conflict) {
                setError("Já existe um artista com este nome cadastrado na plataforma.");
                return;
            }

            if (hit) {
                onProceed({ step: 'claim', hit });
            } else {
                onProceed({ step: 'create', artisticName: query.trim() });
            }
        } catch {
            setError("Erro ao verificar disponibilidade do nome. Tente novamente.");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-md w-full mx-auto p-6 rounded-lg border border-border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5">
                <h3 className="font-semibold tracking-tight text-2xl">Buscando seu perfil</h3>
                <p className="text-sm text-muted-foreground">
                    Antes de continuar, vamos verificar se já existe um perfil na Agenda Clubber com o seu nome artístico.
                </p>
            </div>
            <form onSubmit={handleSearch} className="flex flex-col gap-4">
                <div className="space-y-2">
                    <Label htmlFor="artisticNameSearch">Qual é o seu nome artístico?</Label>
                    <div className="flex gap-2">
                        <Input
                            id="artisticNameSearch"
                            placeholder="Digite o nome artístico..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            required
                        />
                        <Button type="submit" disabled={isSearching || !query.trim()}>
                            <Search className="h-4 w-4 mr-2" />
                            {isSearching ? "Buscando..." : "Buscar"}
                        </Button>
                    </div>
                </div>
                {error && (
                    <div className="p-3 border border-red-500/50 bg-red-500/10 text-red-500 rounded-md text-sm">
                        {error}
                    </div>
                )}
            </form>
        </div>
    );
}
