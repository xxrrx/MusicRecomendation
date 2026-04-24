import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import ProfileMenu from './ProfileMenu';

/* ── SVG icons ───────────────────────────────────────────────────────────── */
const Icons = {
  Overview: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 0 1 8.25-8.25.75.75 0 0 1 .75.75v6.75H18a.75.75 0 0 1 .75.75 8.25 8.25 0 0 1-16.5 0z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M12.75 3a.75.75 0 0 1 .75-.75 8.25 8.25 0 0 1 8.25 8.25.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75V3z" clipRule="evenodd" />
    </svg>
  ),
  Songs: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66a1.5 1.5 0 0 0 1.088-1.442V5.25a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.122z" />
    </svg>
  ),
  Albums: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653zm4.25 5.597a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5z" clipRule="evenodd" />
    </svg>
  ),
  Analytics: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75c-1.036 0-1.875-.84-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75C3.84 21.75 3 20.91 3 19.875v-6.75z" />
    </svg>
  ),
  Revenue: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5z" />
      <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0zM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008zM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75z" clipRule="evenodd" />
    </svg>
  ),
  Profile: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0zM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695z" clipRule="evenodd" />
    </svg>
  ),
  Home: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M11.03 2.59a1.5 1.5 0 0 1 1.94 0l7.5 6.363A1.5 1.5 0 0 1 21 10.097V19.5A1.5 1.5 0 0 1 19.5 21h-6a.75.75 0 0 1-.75-.75V15h-1.5v5.25a.75.75 0 0 1-.75.75h-6A1.5 1.5 0 0 1 3 19.5v-9.403c0-.39.18-.759.49-1.004l7.54-6.504z" />
    </svg>
  ),
  Logout: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9A.75.75 0 0 1 15 9V5.25a1.5 1.5 0 0 0-1.5-1.5h-6zm10.72 4.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H9a.75.75 0 0 1 0-1.5h10.94l-1.72-1.72a.75.75 0 0 1 0-1.06z" clipRule="evenodd" />
    </svg>
  ),
};

const NAV_TABS = [
  { tab: 'overview',  label: 'Tổng quan',  Icon: Icons.Overview },
  { tab: 'songs',     label: 'Bài hát',    Icon: Icons.Songs },
  { tab: 'albums',    label: 'Album',      Icon: Icons.Albums },
  { tab: 'analytics', label: 'Analytics',  Icon: Icons.Analytics },
  { tab: 'revenue',   label: 'Doanh thu',  Icon: Icons.Revenue },
  { tab: 'profile',   label: 'Hồ sơ',     Icon: Icons.Profile },
];

export default function ArtistLayout({ children }) {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  return (
    <div className="flex min-h-screen relative" style={{ background: '#07070f' }}>
      {/* Background orbs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute rounded-full blur-3xl animate-pulse"
          style={{ width: 500, height: 500, top: '-100px', left: '-100px', background: 'rgba(109,40,217,0.16)', animationDuration: '8s' }} />
        <div className="absolute rounded-full blur-3xl animate-pulse"
          style={{ width: 400, height: 400, top: '50%', right: '-60px', background: 'rgba(37,99,235,0.12)', animationDuration: '11s', animationDelay: '3s' }} />
        <div className="absolute rounded-full blur-3xl animate-pulse"
          style={{ width: 340, height: 340, bottom: '-40px', left: '35%', background: 'rgba(5,150,105,0.10)', animationDuration: '9s', animationDelay: '5s' }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside
        className="w-56 shrink-0 min-h-screen flex flex-col py-4 sticky top-0 h-screen overflow-y-auto z-20"
        style={{
          background: 'rgba(11,11,20,0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Logo */}
        <Link to="/artist/dashboard" className="flex items-center gap-2.5 px-4 mb-4">
          <div style={{ background: 'linear-gradient(135deg,#1DB954,#15803d)', borderRadius: 10, padding: '7px 9px' }}>
            <span style={{ fontSize: 16, color: 'white', lineHeight: 1 }}>♪</span>
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">Artist Studio</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>SoundWave</p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 px-2 flex-1">
          {NAV_TABS.map(({ tab, label, Icon }) => {
            const isActive = currentTab === tab;
            const to = tab === 'overview' ? '/artist/dashboard' : `/artist/dashboard?tab=${tab}`;
            return (
              <Link
                key={tab}
                to={to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={isActive
                  ? { background: 'rgba(29,185,84,0.15)', color: '#fff' }
                  : { color: 'rgba(255,255,255,0.45)' }
                }
              >
                <span style={{ color: isActive ? '#1DB954' : 'inherit' }}><Icon /></span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer — back to main */}
        <div className="px-2 pt-3 mt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <Link to="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150"
            style={{ color: 'rgba(255,255,255,0.45)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
          >
            <Icons.Home /> Về trang chính
          </Link>
        </div>
      </aside>

      <main className="relative z-10 flex-1 overflow-y-auto min-h-screen">
        <div className="fixed top-4 right-4 z-40">
          <ProfileMenu profileLink="/artist/dashboard?tab=profile" />
        </div>
        {children}
      </main>
    </div>
  );
}
