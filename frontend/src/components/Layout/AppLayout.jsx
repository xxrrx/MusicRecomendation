import Sidebar from './Sidebar';
import ProfileMenu from './ProfileMenu';

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen relative" style={{ background: '#07070f' }}>
      {/* Animated background orbs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute rounded-full blur-3xl animate-pulse"
          style={{ width: 520, height: 520, top: '-120px', left: '-140px', background: 'rgba(109,40,217,0.18)', animationDuration: '8s' }}
        />
        <div
          className="absolute rounded-full blur-3xl animate-pulse"
          style={{ width: 420, height: 420, top: '40%', right: '-80px', background: 'rgba(37,99,235,0.14)', animationDuration: '11s', animationDelay: '2s' }}
        />
        <div
          className="absolute rounded-full blur-3xl animate-pulse"
          style={{ width: 360, height: 360, bottom: '-60px', left: '30%', background: 'rgba(5,150,105,0.12)', animationDuration: '9s', animationDelay: '4s' }}
        />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
      </div>

      <Sidebar />

      <main className="relative z-10 flex-1 overflow-y-auto pb-28 min-h-screen">
        {/* Top-right profile menu */}
        <div className="fixed top-4 right-4 z-40">
          <ProfileMenu profileLink="/profile" />
        </div>
        {children}
      </main>
    </div>
  );
}
