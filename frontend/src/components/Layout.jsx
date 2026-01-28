import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiVideo, FiMusic, FiFileText, FiImage, FiGlobe,
  FiAlignLeft, FiSearch, FiShare2, FiMail, FiEdit, FiDollarSign,
  FiFilm, FiMic, FiHeadphones, FiMenu, FiX, FiLogOut, FiUser
} from 'react-icons/fi';

const navItems = [
  { path: '/', icon: FiHome, label: 'Dashboard' },
  { path: '/videos', icon: FiVideo, label: 'Videos' },
  { path: '/audio', icon: FiMusic, label: 'Audio' },
  { path: '/text', icon: FiFileText, label: 'Text Content' },
  { path: '/images', icon: FiImage, label: 'Images' },
  { path: '/translations', icon: FiGlobe, label: 'Translations' },
  { path: '/summaries', icon: FiAlignLeft, label: 'Summaries' },
  { path: '/seo', icon: FiSearch, label: 'SEO Content' },
  { path: '/social', icon: FiShare2, label: 'Social Posts' },
  { path: '/emails', icon: FiMail, label: 'Emails' },
  { path: '/blogs', icon: FiEdit, label: 'Blog Posts' },
  { path: '/marketing', icon: FiDollarSign, label: 'Marketing Copy' },
  { path: '/scripts', icon: FiFilm, label: 'Scripts' },
  { path: '/podcasts', icon: FiMic, label: 'Podcasts' },
  { path: '/voiceovers', icon: FiHeadphones, label: 'Voiceovers' },
  { path: '/music', icon: FiMusic, label: 'Music Tracks' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen bg-white shadow-lg transition-all duration-300
        ${sidebarOpen ? 'w-64' : 'w-20'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-primary-600">AI Content Studio</h1>
          )}
          <button
            className="hidden lg:block p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <FiMenu size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                ${isActive
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'}
              `}
            >
              <Icon size={20} />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <FiUser className="text-primary-600" />
                </div>
                <span className="text-sm font-medium truncate max-w-[120px]">{user?.name}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <FiLogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={`
        transition-all duration-300 min-h-screen
        ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}
      `}>
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
