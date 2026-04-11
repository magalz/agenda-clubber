'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Filter, X } from 'lucide-react';

interface CalendarFiltersProps {
  availableGenres: string[];
  availableRegions: string[];
}

export function CalendarFilters({ availableGenres, availableRegions }: CalendarFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedGenres = searchParams.get('genres')?.split(',').filter(Boolean) || [];
  const selectedRegions = searchParams.get('regions')?.split(',').filter(Boolean) || [];
  const conflictsOnly = searchParams.get('conflicts') === 'true';

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const toggleFilter = (type: 'genres' | 'regions', value: string) => {
    const current = type === 'genres' ? selectedGenres : selectedRegions;
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    
    router.push(pathname + '?' + createQueryString(type, next.join(',')));
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasFilters = selectedGenres.length > 0 || selectedRegions.length > 0 || conflictsOnly;

  return (
    <div className="flex flex-col gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500 tracking-widest">
          <Filter size={14} />
          Intelligence Filters
        </div>
        {hasFilters && (
          <button 
            onClick={clearFilters}
            className="text-[10px] text-zinc-500 hover:text-zinc-100 flex items-center gap-1 uppercase font-bold transition"
          >
            <X size={12} /> Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Genres */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-600 uppercase">Musical Genres</label>
          <div className="flex flex-wrap gap-1">
            {availableGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => toggleFilter('genres', genre)}
                className={`px-2 py-1 text-[9px] rounded border transition ${
                  selectedGenres.includes(genre)
                    ? 'bg-zinc-100 border-zinc-100 text-black'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Regions */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-600 uppercase">Regions / Neighborhoods</label>
          <div className="flex flex-wrap gap-1">
            {availableRegions.length === 0 ? (
              <span className="text-[9px] text-zinc-700 italic text-zinc-500">No regions found</span>
            ) : (
              availableRegions.map((region) => (
                <button
                  key={region}
                  onClick={() => toggleFilter('regions', region)}
                  className={`px-2 py-1 text-[9px] rounded border transition ${
                    selectedRegions.includes(region)
                      ? 'bg-zinc-100 border-zinc-100 text-black'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600'
                  }`}
                >
                  {region}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Strategic Toggles */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-zinc-600 uppercase">Strategic Insight</label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={conflictsOnly}
                  onChange={(e) => router.push(pathname + '?' + createQueryString('conflicts', e.target.checked ? 'true' : ''))}
                  className="sr-only peer" 
                />
                <div className="w-7 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-yellow-600"></div>
              </div>
              <span className="text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 transition">Show Conflicts Only</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
