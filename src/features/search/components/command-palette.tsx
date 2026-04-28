'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ArtistIdentityCard } from '@/features/artists/components/artist-identity-card';
import { CollectiveCard } from '@/features/collectives/components/collective-card';
import { searchTalents } from '@/features/search/actions';
import type { SearchHit } from '@/features/search/types';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        // Don't hijack Cmd+K when focus is inside an editable element
        const target = e.target as HTMLElement;
        if (
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }
    let active = true;
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const res = await searchTalents({ query });
        if (!active) return;
        if (res.error) {
          setResults([]);
          setSearchError(
            res.error.code === 'UNAUTHORIZED'
              ? 'Sessão expirada. Recarregue a página.'
              : 'Erro ao buscar. Tente novamente.'
          );
          return;
        }
        setSearchError(null);
        setResults(res.data ?? []);
      });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query]);

  const artistHits = results.filter(
    (h): h is Extract<SearchHit, { kind: 'artist' }> => h.kind === 'artist'
  );
  const collectiveHits = results.filter(
    (h): h is Extract<SearchHit, { kind: 'collective' }> =>
      h.kind === 'collective'
  );

  function handleSelect() {
    setOpen(false);
    // TODO(story-2.4): navegar para perfil público quando URL existir
    console.info('[CommandPalette] item selected — navigation deferred to story 2.4');
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Buscar talentos"
      description="Busque artistas e coletivos por nome, gênero ou cidade"
    >
      <Command shouldFilter={false}>
      <CommandInput
        placeholder="Buscar por nome, gênero ou cidade..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {query.length < 2 && (
          <CommandEmpty>Digite ao menos 2 caracteres para buscar.</CommandEmpty>
        )}
        {query.length >= 2 && isPending && (
          <CommandEmpty>Buscando...</CommandEmpty>
        )}
        {query.length >= 2 && !isPending && searchError && (
          <CommandEmpty>{searchError}</CommandEmpty>
        )}
        {query.length >= 2 && !isPending && !searchError && results.length === 0 && (
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        )}

        {artistHits.length > 0 && (
          <CommandGroup heading="Artistas">
            {artistHits.map((hit) => (
              <CommandItem
                key={hit.id}
                value={`artist-${hit.id}`}
                onSelect={handleSelect}
              >
                <ArtistIdentityCard
                  variant={hit.isVerified ? 'verified' : 'restricted'}
                  artisticName={hit.artisticName}
                  location={hit.location}
                  genrePrimary={hit.genrePrimary}
                  photoUrl={hit.photoUrl}
                  compact
                />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {collectiveHits.length > 0 && (
          <CommandGroup heading="Coletivos">
            {collectiveHits.map((hit) => (
              <CommandItem
                key={hit.id}
                value={`collective-${hit.id}`}
                onSelect={handleSelect}
              >
                <CollectiveCard
                  name={hit.name}
                  location={hit.location}
                  genrePrimary={hit.genrePrimary}
                  logoUrl={hit.logoUrl}
                  compact
                />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
      </Command>
    </CommandDialog>
  );
}
