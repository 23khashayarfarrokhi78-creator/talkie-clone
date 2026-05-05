import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
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
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 bg-bg/80 backdrop-blur-xl z-40 border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-3">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Talkie
          </h1>
          <p className="text-xs text-text-muted mt-0.5">Chat with AI Characters</p>

          <div className="relative mt-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search characters..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface rounded-xl pl-9 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted border border-white/5 focus:border-primary/50 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                category === cat.key
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-muted hover:text-text'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-surface rounded-2xl h-44 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            <p className="text-lg">No characters found</p>
            <p className="text-sm mt-2">Try a different search or category</p>
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
