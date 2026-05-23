import { useNavigate } from 'react-router-dom';
import type { Character } from '../types';
import Avatar from './Avatar';
import { MessageCircle } from 'lucide-react';

interface CharacterCardProps {
  character: Character;
}

export default function CharacterCard({ character }: CharacterCardProps) {
  const navigate = useNavigate();

  const hasImage = !!character.avatar_url;

  return (
    <button
      onClick={() => navigate(`/chat/${character.id}`)}
      className="relative rounded-2xl overflow-hidden w-full text-left active:scale-[0.97] transition-transform duration-150 group"
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
    >
      {/* Background: image or gradient */}
      <div className="relative aspect-[3/4] w-full">
        {hasImage ? (
          <img
            src={character.avatar_url}
            alt={character.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${character.avatar_color}44 0%, ${character.avatar_color}22 50%, rgba(10,10,18,0.9) 100%)`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <Avatar name={character.name} color={character.avatar_color} size="lg" />
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 min-w-0">
          <h3 className="font-bold text-[13px] text-white truncate leading-tight">
            {character.name}
          </h3>
          <p className="text-[11px] text-white/60 line-clamp-2 mt-0.5 leading-snug min-w-0">
            {character.tagline}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <div className="flex items-center gap-1 text-[10px] text-white/40 bg-white/10 rounded-full px-2 py-0.5">
              <MessageCircle size={10} />
              <span>Chat</span>
            </div>
            <div className="text-[10px] text-white/40 bg-white/10 rounded-full px-2 py-0.5 capitalize truncate">
              {character.category}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
