import { useNavigate, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Settings } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname.startsWith('/chat/')) return null;

  const tabs = [
    { path: '/', icon: Home, label: 'Discover' },
    { path: '/create', icon: PlusCircle, label: 'Create' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-xl border-t border-white/5 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 px-5 sm:px-6 py-2 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-text-muted hover:text-text'
              }`}
            >
              <tab.icon size={22} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
