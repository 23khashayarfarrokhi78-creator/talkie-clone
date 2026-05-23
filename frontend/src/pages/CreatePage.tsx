import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Film,
  ImagePlus,
  Sparkles,
  Star,
  StarOff,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import Avatar from '../components/Avatar';
import type { BackgroundMediaItem, BackgroundMediaType } from '../types';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#6b7280'];

const CATEGORIES = [
  { key: 'companion', label: 'Companion' },
  { key: 'helper', label: 'Helper' },
  { key: 'anime', label: 'Anime' },
  { key: 'fiction', label: 'Fiction' },
  { key: 'fun', label: 'Fun' },
  { key: 'custom', label: 'Custom' },
];

interface DraftBackgroundItem {
  key: string;
  type: BackgroundMediaType;
  // Local object-URL preview while pending upload, or remote URL once uploaded.
  previewUrl: string;
  // File present until uploaded.
  file?: File;
  // Remote URL after upload completes.
  remoteUrl?: string;
}

function genKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function CreatePage() {
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [personality, setPersonality] = useState('');
  const [scenario, setScenario] = useState('');
  const [greeting, setGreeting] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [category, setCategory] = useState('custom');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bgItems, setBgItems] = useState<DraftBackgroundItem[]>([]);
  const [activeBgIndex, setActiveBgIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Revoke object URLs on unmount to avoid memory leaks.
  useEffect(() => {
    return () => {
      bgItems.forEach((item) => {
        if (item.file) URL.revokeObjectURL(item.previewUrl);
      });
      if (avatarPreview && avatarFile) URL.revokeObjectURL(avatarPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleBgSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const newItems: DraftBackgroundItem[] = files.map((file) => ({
      key: genKey(),
      type: file.type.startsWith('video/') ? 'video' : 'image',
      previewUrl: URL.createObjectURL(file),
      file,
    }));
    setBgItems((prev) => [...prev, ...newItems]);
    // Reset input so selecting the same file again still fires onChange.
    e.target.value = '';
  };

  const removeBgItem = (key: string) => {
    setBgItems((prev) => {
      const idx = prev.findIndex((i) => i.key === key);
      if (idx === -1) return prev;
      const item = prev[idx];
      if (item.file) URL.revokeObjectURL(item.previewUrl);
      const next = prev.filter((i) => i.key !== key);
      // Adjust active index if needed.
      setActiveBgIndex((prevActive) => {
        if (next.length === 0) return 0;
        if (idx < prevActive) return prevActive - 1;
        if (prevActive >= next.length) return next.length - 1;
        return prevActive;
      });
      return next;
    });
  };

  const makeActive = (index: number) => setActiveBgIndex(index);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setUploading(true);
    setError(null);

    try {
      let avatarUrl = '';
      if (avatarFile) {
        avatarUrl = await api.uploadImage(avatarFile);
      }

      // Upload all background media items in order.
      const uploaded: BackgroundMediaItem[] = [];
      for (const item of bgItems) {
        if (item.remoteUrl) {
          uploaded.push({ type: item.type, url: item.remoteUrl });
          continue;
        }
        if (!item.file) continue;
        const result = await api.uploadMedia(item.file);
        uploaded.push({ type: result.type, url: result.url });
      }

      // Reorder so the active item is first (acts as "default").
      const ordered =
        uploaded.length > 0 && activeBgIndex > 0 && activeBgIndex < uploaded.length
          ? [
              uploaded[activeBgIndex],
              ...uploaded.filter((_, i) => i !== activeBgIndex),
            ]
          : uploaded;

      // Legacy background_url = first image (if any) for backward-compat.
      const firstImage = ordered.find((m) => m.type === 'image');
      const backgroundUrl = firstImage?.url ?? '';

      setUploading(false);

      const character = await api.createCharacter({
        name: name.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        personality: personality.trim(),
        scenario: scenario.trim(),
        greeting: greeting.trim(),
        avatar_url: avatarUrl,
        avatar_color: color,
        background_url: backgroundUrl,
        background_media: ordered,
        category,
      });
      navigate(`/chat/${character.id}`);
    } catch (err) {
      setSaving(false);
      setUploading(false);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 bg-bg/80 backdrop-blur-xl z-40 border-b border-white/5">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-1.5 hover:bg-surface-light rounded-lg transition-colors"
          >
            <ArrowLeft size={22} className="text-text" />
          </button>
          <h1 className="font-semibold text-text">Create Character</h1>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="max-w-lg mx-auto px-4 sm:px-6 pt-6 flex flex-col gap-6"
      >
        {/* Avatar Upload */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {avatarPreview ? (
              <div className="relative">
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover ring-2 ring-white/10"
                />
                <button
                  type="button"
                  onClick={() => {
                    setAvatarPreview(null);
                    setAvatarFile(null);
                  }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            ) : (
              <Avatar name={name || '?'} color={color} size="xl" />
            )}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center ring-2 ring-bg hover:bg-primary-dark transition-colors"
            >
              <Camera size={14} className="text-white" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />
          </div>
          <p className="text-sm text-text-muted">{name || 'Your character'}</p>
        </div>

        {/* Background Media Manager */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-muted">
              Chat Backgrounds
            </label>
            <span className="text-[10px] text-text-muted/70">
              Images & videos · multiple allowed
            </span>
          </div>

          {bgItems.length > 0 && (
            <div className="grid grid-cols-3 gap-2.5">
              {bgItems.map((item, idx) => {
                const isActive = idx === activeBgIndex;
                return (
                  <div
                    key={item.key}
                    className={`relative aspect-video rounded-xl overflow-hidden bg-surface border ${
                      isActive ? 'border-primary' : 'border-white/5'
                    }`}
                  >
                    {item.type === 'image' ? (
                      <img
                        src={item.previewUrl}
                        alt="Background"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={item.previewUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    )}
                    {item.type === 'video' && (
                      <div className="absolute top-1 left-1 bg-black/60 rounded-md px-1.5 py-0.5 flex items-center gap-1">
                        <Film size={10} className="text-white" />
                        <span className="text-[9px] text-white font-medium">
                          VIDEO
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between p-1.5 bg-gradient-to-t from-black/70 to-transparent">
                      <button
                        type="button"
                        onClick={() => makeActive(idx)}
                        className="p-1 rounded-md bg-white/15 backdrop-blur-sm hover:bg-white/25"
                        title={isActive ? 'Default background' : 'Set as default'}
                      >
                        {isActive ? (
                          <Star
                            size={12}
                            className="text-yellow-300 fill-yellow-300"
                          />
                        ) : (
                          <StarOff size={12} className="text-white" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBgItem(item.key)}
                        className="p-1 rounded-md bg-white/15 backdrop-blur-sm hover:bg-accent/80"
                        title="Remove"
                      >
                        <Trash2 size={12} className="text-white" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={() => bgInputRef.current?.click()}
            className="w-full py-3 px-4 bg-surface border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 hover:border-primary/50 transition-colors"
          >
            <ImagePlus size={18} className="text-text-muted" />
            <span className="text-xs text-text-muted">
              {bgItems.length === 0
                ? 'Add background image or video'
                : 'Add another background'}
            </span>
          </button>
          <input
            ref={bgInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleBgSelect}
            className="hidden"
          />
        </div>

        {/* Color */}
        <div>
          <label className="text-xs font-medium text-text-muted block mb-2">
            Avatar Color{' '}
            {avatarPreview && (
              <span className="text-text-muted/50">(used when no image)</span>
            )}
          </label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-transform ${
                  color === c
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-bg scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-text-muted block mb-1.5">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Luna, Kai, Dr. Sage..."
              className="w-full bg-surface rounded-xl px-4 py-3 text-sm text-text border border-white/5 focus:border-primary/50 focus:outline-none placeholder:text-text-muted"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted block mb-1.5">
              Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="A short description..."
              className="w-full bg-surface rounded-xl px-4 py-3 text-sm text-text border border-white/5 focus:border-primary/50 focus:outline-none placeholder:text-text-muted"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted block mb-1.5">
              Category
            </label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    category === cat.key
                      ? 'bg-primary text-white'
                      : 'bg-surface text-text-muted hover:text-text'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted block mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Who is this character? Background, interests, quirks..."
              rows={3}
              className="w-full bg-surface rounded-xl px-4 py-3 text-sm text-text border border-white/5 focus:border-primary/50 focus:outline-none placeholder:text-text-muted resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted block mb-1.5">
              Personality
            </label>
            <textarea
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Traits, speaking style, mannerisms..."
              rows={3}
              className="w-full bg-surface rounded-xl px-4 py-3 text-sm text-text border border-white/5 focus:border-primary/50 focus:outline-none placeholder:text-text-muted resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted block mb-1.5">
              Scenario
            </label>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="The setting for your conversations..."
              rows={2}
              className="w-full bg-surface rounded-xl px-4 py-3 text-sm text-text border border-white/5 focus:border-primary/50 focus:outline-none placeholder:text-text-muted resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted block mb-1.5">
              Greeting Message
            </label>
            <textarea
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="The first message your character sends..."
              rows={3}
              className="w-full bg-surface rounded-xl px-4 py-3 text-sm text-text border border-white/5 focus:border-primary/50 focus:outline-none placeholder:text-text-muted resize-none"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-accent bg-accent/10 border border-accent/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!name.trim() || saving}
          className="w-full bg-primary text-white rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-primary-dark transition-colors mt-2 mb-6"
        >
          <Sparkles size={18} />
          {uploading
            ? 'Uploading media...'
            : saving
              ? 'Creating...'
              : 'Create Character'}
        </button>
      </form>
    </div>
  );
}
