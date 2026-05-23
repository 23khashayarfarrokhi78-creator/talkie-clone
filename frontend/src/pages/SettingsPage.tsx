import { useState } from 'react';
import { ArrowLeft, Key, Info } from 'lucide-react';
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
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 bg-bg/80 backdrop-blur-xl z-40 border-b border-white/5">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 max-w-lg mx-auto">
          <button onClick={() => navigate('/')} className="p-1.5 hover:bg-surface-light rounded-lg transition-colors">
            <ArrowLeft size={22} className="text-text" />
          </button>
          <h1 className="font-semibold text-text">Settings</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-6 flex flex-col gap-6">
        {/* API Key */}
        <div className="bg-surface rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Key size={18} className="text-primary" />
            <h2 className="font-semibold text-sm text-text">Gemini API Key</h2>
          </div>
          <p className="text-xs text-text-muted mb-3">
            Get a free API key from{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
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
            className="w-full bg-surface-light rounded-xl px-4 py-3 text-sm text-text border border-white/5 focus:border-primary/50 focus:outline-none placeholder:text-text-muted mb-3"
          />
          <button
            onClick={handleSave}
            className={`w-full rounded-xl py-3 text-sm font-medium transition-colors ${
              saved
                ? 'bg-green-500/20 text-green-400'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            {saved ? 'Saved!' : 'Save API Key'}
          </button>
        </div>

        {/* About */}
        <div className="bg-surface rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Info size={18} className="text-primary" />
            <h2 className="font-semibold text-sm text-text">About</h2>
          </div>
          <div className="text-xs text-text-muted space-y-2">
            <p>Talkie Clone - Personal AI Character Chat App</p>
            <p>Built with React, FastAPI, and Google Gemini AI.</p>
            <p className="text-text-muted/50">Version 1.0.0</p>
          </div>
        </div>

        {/* Voice Info */}
        <div className="bg-surface rounded-2xl p-5 border border-white/5">
          <h2 className="font-semibold text-sm text-text mb-2">Voice Chat</h2>
          <div className="text-xs text-text-muted space-y-2">
            <p>
              Use the microphone button in chat to speak your messages.
              Enable the speaker icon to hear character responses read aloud.
            </p>
            <p className="text-text-muted/70">
              Voice features use your browser's built-in Speech APIs. Works best in Chrome.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
