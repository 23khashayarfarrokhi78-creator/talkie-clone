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

  const inputClass =
    'w-full bg-surface/80 rounded-xl px-4 py-3 text-sm text-text border border-white/[0.06] focus:border-primary/40 focus:outline-none placeholder:text-text-muted transition-colors';
  const textareaClass = `${inputClass} resize-none`;
  const labelClass = 'text-xs font-semibold text-text-muted block mb-2 tracking-wide uppercase';

  return (
    <div className="min-h-dvh pb-28 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 safe-area-top">
        <div className="glass border-b border-white/[0.05]">
          <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl hover:bg-white/[0.08] transition-colors shrink-0"
            >
              <ArrowLeft size={20} className="text-text" />
            </button>
            <h1 className="font-bold text-base text-text">Create Character</h1>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 pt-6 flex flex-col gap-6 w-full">
        {/* Avatar section */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative rounded-2xl p-6 w-full flex flex-col items-center"
            style={{
              background: `linear-gradient(135deg, ${color}22 0%, rgba(10,10,18,0.5) 100%)`,
            }}
          >
            <div className="relative">
              {avatarPreview ? (
                <div className="relative">
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover ring-2 ring-primary/30"
                    style={{ boxShadow: '0 0 20px rgba(168,127,255,0.2)' }}
                  />
                  <button
                    type="button"
                    onClick={() => { setAvatarPreview(null); setAvatarFile(null); }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-lg"
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
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center ring-2 ring-bg hover:bg-primary-dark transition-colors shadow-lg"
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
            <p className="text-sm text-text-muted mt-3">
              {name || 'Your character'}
            </p>
          </div>
        </div>

        {/* Background Image Upload */}
        <div>
          <label className={labelClass}>Chat Background</label>
          {bgPreview ? (
            <div className="relative rounded-xl overflow-hidden">
              <img
                src={bgPreview}
                alt="Background"
                className="w-full h-36 object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => bgInputRef.current?.click()}
                  className="px-4 py-2 bg-white/15 backdrop-blur-sm rounded-xl text-xs text-white font-semibold hover:bg-white/25 transition-colors border border-white/10"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => { setBgPreview(null); setBgFile(null); }}
                  className="px-4 py-2 bg-accent/70 backdrop-blur-sm rounded-xl text-xs text-white font-semibold hover:bg-accent transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => bgInputRef.current?.click()}
              className="w-full h-36 bg-surface/60 border-2 border-dashed border-white/[0.08] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/30 transition-colors"
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
          <label className={labelClass}>
            Avatar Color {avatarPreview && <span className="text-text-dim normal-case">(used when no image)</span>}
          </label>
          <div className="flex gap-2.5 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-9 h-9 rounded-full transition-all duration-200 ${
                  color === c
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-bg scale-110'
                    : 'hover:scale-105 ring-1 ring-white/10'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-5">
          <div>
            <label className={labelClass}>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Luna, Kai, Dr. Sage..."
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="A short description..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Category</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategory(cat.key)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                    category === cat.key
                      ? 'bg-primary text-white'
                      : 'bg-surface/60 text-text-muted hover:text-text border border-white/[0.06]'
                  }`}
                  style={
                    category === cat.key
                      ? { boxShadow: '0 2px 12px rgba(168,127,255,0.25)' }
                      : undefined
                  }
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Who is this character? Background, interests, quirks..."
              rows={3}
              className={textareaClass}
            />
          </div>

          <div>
            <label className={labelClass}>Personality</label>
            <textarea
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Traits, speaking style, mannerisms..."
              rows={3}
              className={textareaClass}
            />
          </div>

          <div>
            <label className={labelClass}>Scenario</label>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="The setting for your conversations..."
              rows={2}
              className={textareaClass}
            />
          </div>

          <div>
            <label className={labelClass}>Greeting Message</label>
            <textarea
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="The first message your character sends..."
              rows={3}
              className={textareaClass}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!name.trim() || saving}
          className="w-full bg-primary text-white rounded-2xl py-3.5 font-bold flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-primary-dark transition-all duration-200 mt-2 mb-6"
          style={{ boxShadow: '0 4px 20px rgba(168,127,255,0.3)' }}
        >
          <Sparkles size={18} />
          {uploading ? 'Uploading images...' : saving ? 'Creating...' : 'Create Character'}
        </button>
      </form>
    </div>
  );
}
