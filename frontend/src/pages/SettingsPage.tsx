import { useState } from 'react';
import { ArrowLeft, Key, Info, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
            <h1 className="font-bold text-base text-text">Settings</h1>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-6 flex flex-col gap-4 w-full">
        {/* API Key */}
        <div
          className="bg-surface/70 rounded-2xl p-5 border border-white/[0.06]"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.25)' }}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Key size={16} className="text-primary" />
            </div>
            <h2 className="font-bold text-sm text-text">Gemini API Key</h2>
          </div>
          <p className="text-xs text-text-muted mb-4 leading-relaxed">
            Get a free API key from{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              Google AI Studio
            </a>
            . Without a key, the app will use fallback (scripted) responses.
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Gemini API key..."
            className="w-full bg-bg/60 rounded-xl px-4 py-3 text-sm text-text border border-white/[0.06] focus:border-primary/40 focus:outline-none placeholder:text-text-muted mb-3 transition-colors"
          />
          <button
            onClick={handleSave}
            className={`w-full rounded-xl py-3 text-sm font-bold transition-all duration-200 ${
              saved
                ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
            style={!saved ? { boxShadow: '0 2px 12px rgba(168,127,255,0.25)' } : undefined}
          >
            {saved ? 'Saved!' : 'Save API Key'}
          </button>
        </div>

        {/* About */}
        <div
          className="bg-surface/70 rounded-2xl p-5 border border-white/[0.06]"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.25)' }}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Info size={16} className="text-primary" />
            </div>
            <h2 className="font-bold text-sm text-text">About</h2>
          </div>
          <div className="text-xs text-text-muted space-y-2.5 leading-relaxed">
            <p>Talkie Clone — Personal AI Character Chat App</p>
            <p>Built with React, FastAPI, and Google Gemini AI.</p>
            <p className="text-text-dim">Version 1.0.0</p>
          </div>
        </div>

        {/* Voice Info */}
        <div
          className="bg-surface/70 rounded-2xl p-5 border border-white/[0.06]"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.25)' }}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Mic size={16} className="text-primary" />
            </div>
            <h2 className="font-bold text-sm text-text">Voice Chat</h2>
          </div>
          <div className="text-xs text-text-muted space-y-2.5 leading-relaxed">
            <p>
              Use the microphone button in chat to speak your messages.
              Enable the speaker icon to hear character responses read aloud.
            </p>
            <p className="text-text-dim">
              Voice features use your browser's built-in Speech APIs. Works best in Chrome.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
