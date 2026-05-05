import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Camera, ImagePlus, X } from 'lucide-react';
import { api } from '../services/api';
import Avatar from '../components/Avatar';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#6b7280'];

const CATEGORIES = [
  { key: 'companion', label: 'Companion' },
  { key: 'helper', label: 'Helper' },
  { key: 'anime', label: 'Anime' },
  { key: 'fiction', label: 'Fiction' },
  { key: 'fun', label: 'Fun' },
  { key: 'custom', label: 'Custom' },
];

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

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleBgSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgFile(file);
    setBgPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setUploading(true);

    try {
      let avatarUrl = '';
      let backgroundUrl = '';

      if (avatarFile) {
        avatarUrl = await api.uploadImage(avatarFile);
      }
      if (bgFile) {
        backgroundUrl = await api.uploadImage(bgFile);
      }

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
        category,
      });
      navigate(`/chat/${character.id}`);
    } catch {
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 bg-bg/80 backdrop-blur-xl z-40 border-b border-white/5">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => navigate('/')} className="p-1 hover:bg-surface-light rounded-lg transition-colors">
            <ArrowLeft size={22} className="text-text" />
          </button>
          <h1 className="font-semibold text-text">Create Character</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 pt-6 flex flex-col gap-6">
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
                  onClick={() => { setAvatarPreview(null); setAvatarFile(null); }}
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
          <p className="text-sm text-text-muted">
            {name || 'Your character'}
          </p>
        </div>

        {/* Background Image Upload */}
        <div>
          <label className="text-xs font-medium text-text-muted block mb-2">Chat Background</label>
          {bgPreview ? (
            <div className="relative rounded-xl overflow-hidden">
              <img
                src={bgPreview}
                alt="Background"
                className="w-full h-32 object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => bgInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-xs text-white font-medium hover:bg-white/30 transition-colors"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => { setBgPreview(null); setBgFile(null); }}
                  className="px-3 py-1.5 bg-accent/80 backdrop-blur-sm rounded-lg text-xs text-white font-medium hover:bg-accent transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => bgInputRef.current?.click()}
              className="w-full h-32 bg-surface border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors"
            >
              <ImagePlus size={24} className="text-text-muted" />
              <span className="text-xs text-text-muted">Add chat background image</span>
            </button>
          )}
          <input
            ref={bgInputRef}
            type="file"
            accept="image/*"
            onChange={handleBgSelect}
            className="hidden"
          />
        </div>

        {/* Color */}
        <div>
          <label className="text-xs font-medium text-text-muted block mb-2">
            Avatar Color {avatarPreview && <span className="text-text-muted/50">(used when no image)</span>}
          </label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-bg scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-text-muted block mb-1.5">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Luna, Kai, Dr. Sage..."
              className="w-full bg-surface rounded-xl px-4 py-2.5 text-sm text-text border border-white/5 focus:border-primary/50 focus:outline-none placeholder:text-text-muted"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted block mb-1.5">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="A short description..."
              className="w-full bg-surface rounded-xl px-4 py-2.5 text-sm text-text border border-white/5 focus:border-primary/50 focus:outline-none placeholder:text-text-muted"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted block mb-1.5">Category</label>
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
            <label className="text-xs font-medium text-text-muted block mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Who is this character? Background, interests, quirks..."
              rows={3}
              className="w-full bg-surface rounded-xl px-4 py-2.5 text-sm text-text border border-white/5 focus:border-primary/50 focus:outline-none placeholder:text-text-muted resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted block mb-1.5">Personality</label>
            <textarea
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Traits, speaking style, mannerisms..."
              rows={3}
              className="w-full bg-surface rounded-xl px-4 py-2.5 text-sm text-text border border-white/5 focus:border-primary/50 focus:outline-none placeholder:text-text-muted resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted block mb-1.5">Scenario</label>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="The setting for your conversations..."
              rows={2}
              className="w-full bg-surface rounded-xl px-4 py-2.5 text-sm text-text border border-white/5 focus:border-primary/50 focus:outline-none placeholder:text-text-muted resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted block mb-1.5">Greeting Message</label>
            <textarea
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="The first message your character sends..."
              rows={3}
              className="w-full bg-surface rounded-xl px-4 py-2.5 text-sm text-text border border-white/5 focus:border-primary/50 focus:outline-none placeholder:text-text-muted resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!name.trim() || saving}
          className="w-full bg-primary text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-primary-dark transition-colors mt-2 mb-6"
        >
          <Sparkles size={18} />
          {uploading ? 'Uploading images...' : saving ? 'Creating...' : 'Create Character'}
        </button>
      </form>
    </div>
  );
}
