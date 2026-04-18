import { NavLink, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const navLinks = [
  { to: '/', label: 'Home', icon: '🏠', exact: true },
  { to: '/liked', label: 'Liked Songs', icon: '❤️' },
  { to: '/playlists', label: 'Playlists', icon: '📋' },
  { to: '/following', label: 'Following', icon: '👥' },
];

export default function Sidebar() {
  const { user, clearAuth } = useAuthStore();

  return (
    <aside className="w-56 shrink-0 bg-gray-900 min-h-screen flex flex-col py-6 px-4">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8 px-2">
        <span className="text-2xl">🎵</span>
        <span className="text-white font-bold text-lg tracking-tight">MusicApp</span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {navLinks.map(({ to, label, icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User info */}
      {user && (
        <div className="border-t border-gray-800 pt-4 mt-4">
          <p className="text-gray-400 text-xs truncate px-2 mb-2">{user.email}</p>
          <button
            onClick={clearAuth}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
