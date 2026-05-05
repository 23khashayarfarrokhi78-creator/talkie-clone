import { useNavigate } from 'react-router-dom';
import type { Character } from '../types';
import Avatar from './Avatar';
import { MessageCircle } from 'lucide-react';

interface CharacterCardProps {
  character: Character;
}

export default function CharacterCard({ character }: CharacterCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/chat/${character.id}`)}
      className="bg-surface rounded-2xl p-4 flex flex-col items-center text-center gap-3 hover:bg-surface-light transition-all duration-200 cursor-pointer active:scale-[0.97] border border-white/5 hover:border-white/10 w-full"
    >
      <Avatar name={character.name} color={character.avatar_color} avatarUrl={character.avatar_url} size="lg" />
      <div className="flex flex-col gap-1 min-w-0 w-full">
        <h3 className="font-semibold text-text truncate">{character.name}</h3>
        <p className="text-xs text-text-muted line-clamp-2">{character.tagline}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-text-muted">
        <MessageCircle size={12} />
        <span>Chat</span>
      </div>
    </button>
  );
}
