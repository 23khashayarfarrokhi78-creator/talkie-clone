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
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-white/5 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-[72px] max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1.5 px-8 py-2.5 rounded-xl transition-colors active:scale-95 ${
                isActive ? 'text-primary' : 'text-text-muted hover:text-text'
              }`}
            >
              <tab.icon size={26} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
