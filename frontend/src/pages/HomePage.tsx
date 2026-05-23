import { useEffect, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import type { Character } from '../types';
import { api } from '../services/api';
import CharacterCard from '../components/CharacterCard';

const CATEGORIES = [
  { key: '', label: 'All' },
  { key: 'companion', label: 'Companion' },
  { key: 'helper', label: 'Helper' },
  { key: 'anime', label: 'Anime' },
  { key: 'fiction', label: 'Fiction' },
  { key: 'fun', label: 'Fun' },
  { key: 'custom', label: 'My Characters' },
];

export default function HomePage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getCharacters(category || undefined).then((data) => {
      setCharacters(data);
      setLoading(false);
    });
  }, [category]);

  const filtered = search
    ? characters.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.tagline.toLowerCase().includes(search.toLowerCase())
      )
    : characters;

  return (
    <div className="min-h-dvh pb-28 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 safe-area-top">
        <div className="glass border-b border-white/[0.05]">
          <div className="max-w-lg mx-auto px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-primary" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Talkie
              </h1>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5 ml-7">Chat with AI Characters</p>

            {/* Search */}
            <div className="relative mt-3">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search characters..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted border border-white/[0.06] focus:border-primary/40 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Category pills */}
          <div className="max-w-lg mx-auto px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  category === cat.key
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-surface/60 text-text-muted hover:text-text border border-white/[0.06]'
                }`}
                style={
                  category === cat.key
                    ? { boxShadow: '0 2px 12px rgba(168,127,255,0.3)' }
                    : undefined
                }
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 pt-4 w-full">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl aspect-[3/4] animate-shimmer"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-text-muted" />
            </div>
            <p className="text-base font-semibold text-text">No characters found</p>
            <p className="text-sm text-text-muted mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((character) => (
              <CharacterCard key={character.id} character={character} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
