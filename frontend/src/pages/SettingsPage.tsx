import { useState } from 'react';
import { ArrowLeft, Key, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getApiKey,
  getModel,
  setApiKey as persistApiKey,
  setModel as persistModel,
} from '../services/openrouter';

const SUGGESTED_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'google/gemini-flash-1.5',
  'openai/gpt-4o-mini',
  'anthropic/claude-3.5-haiku',
  'meta-llama/llama-3.1-70b-instruct',
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState(() => getApiKey());
  const [model, setModel] = useState(() => getModel());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    persistApiKey(apiKey.trim());
    persistModel(model.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 bg-bg/80 backdrop-blur-xl z-40 border-b border-white/5">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 max-w-lg mx-auto">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 hover:bg-surface-light rounded-lg transition-colors"
          >
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
            <h2 className="font-semibold text-sm text-text">OpenRouter API Key</h2>
          </div>
          <p className="text-xs text-text-muted mb-3">
            Get a key from{' '}
            <a
              href="https://openrouter.ai/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              openrouter.ai
            </a>
            . The key is stored only on this device and is sent directly to OpenRouter on each request. Without a key, the app uses scripted fallback responses.
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-v1-..."
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-surface-light rounded-xl px-4 py-3 text-sm text-text border border-white/5 focus:border-primary/50 focus:outline-none placeholder:text-text-muted mb-4"
          />

          <label className="block text-xs text-text-muted mb-1.5">
            Model
          </label>
          <input
            list="openrouter-models"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="google/gemini-2.0-flash-exp:free"
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-surface-light rounded-xl px-4 py-3 text-sm text-text border border-white/5 focus:border-primary/50 focus:outline-none placeholder:text-text-muted mb-3"
          />
          <datalist id="openrouter-models">
            {SUGGESTED_MODELS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>

          <button
            onClick={handleSave}
            className={`w-full rounded-xl py-3 text-sm font-medium transition-colors ${
              saved
                ? 'bg-green-500/20 text-green-400'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            {saved ? 'Saved!' : 'Save'}
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
            <p>Self-contained build: characters, conversations, and uploads live in this device's storage. AI replies are streamed directly from OpenRouter using your key.</p>
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
              Voice features use the device's built-in Speech APIs. Works best in modern browsers and Chrome-based WebViews.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
