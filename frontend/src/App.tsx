import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import CreatePage from './pages/CreatePage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-dvh w-full max-w-full overflow-x-hidden bg-bg">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat/:characterId" element={<ChatPage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
