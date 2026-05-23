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
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="mx-5 mb-3">
        <div
          className="glass rounded-2xl border border-white/[0.06] flex justify-around items-center h-16 max-w-md mx-auto"
          style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.4)' }}
        >
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all duration-200 min-w-0"
              >
                <div className={`relative transition-all duration-200 ${isActive ? 'scale-110' : ''}`}>
                  <tab.icon
                    size={22}
                    className={`transition-colors duration-200 ${
                      isActive ? 'text-primary' : 'text-text-muted'
                    }`}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  {isActive && (
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold transition-colors duration-200 ${
                    isActive ? 'text-primary' : 'text-text-muted'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
