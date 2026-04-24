import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

async function fetchMe() {
  const res = await api.get('/users/me');
  return res.data.data;
}

async function updateMe(formData) {
  const res = await api.patch('/users/me', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: '#fff',
};

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const fileRef = useRef(null);

  const { data: user, isLoading } = useQuery({ queryKey: ['me'], queryFn: fetchMe });

  const [displayName, setDisplayName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null); // local preview
  const [avatarFile, setAvatarFile] = useState(null);
  const [saved, setSaved] = useState(false);

  const initialised = !!user && displayName === '';
  if (initialised) setDisplayName(user.displayName || '');

  const mutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (updated) => {
      queryClient.setQueryData(['me'], updated);
      setUser(updated);
      setAvatarFile(null);
      setAvatarPreview(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData();
    fd.append('displayName', displayName.trim());
    if (avatarFile) fd.append('avatar', avatarFile);
    mutation.mutate(fd);
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const avatar = avatarPreview || user?.avatarUrl;
  const initials = (displayName || user?.displayName || user?.email || '?')[0].toUpperCase();

  return (
    <div className="min-h-full text-white">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {avatar && (
          <img src={avatar} alt="" aria-hidden
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-3xl opacity-20 pointer-events-none" />
        )}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(7,7,15,0.3), rgba(7,7,15,0.85), #07070f)' }} />

        <div className="relative z-10 px-8 pt-16 pb-10 flex items-end gap-7">
          {/* Clickable avatar */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative shrink-0 group focus:outline-none"
            title="Đổi ảnh đại diện"
          >
            {avatar ? (
              <img src={avatar} alt={displayName}
                className="w-36 h-36 rounded-full object-cover shadow-2xl transition-all duration-200 group-hover:brightness-50"
                style={{ border: '4px solid rgba(255,255,255,0.10)' }} />
            ) : (
              <div className="w-36 h-36 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 group-hover:brightness-50"
                style={{ background: 'linear-gradient(135deg,#1DB954,#0ea5e9)', border: '4px solid rgba(255,255,255,0.10)' }}>
                <span className="text-5xl font-black text-white">{initials}</span>
              </div>
            )}
            {/* Camera overlay */}
            <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex flex-col items-center gap-1">
                <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                  <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0z" clipRule="evenodd" />
                </svg>
                <span className="text-white text-xs font-semibold">Đổi ảnh</span>
              </div>
            </div>
          </button>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Hồ sơ</p>
            <h1 className="text-4xl font-extrabold leading-tight">{displayName || user?.displayName || 'Người dùng'}</h1>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{user?.email}</p>
            <p className="text-xs mt-1 capitalize" style={{ color: 'rgba(255,255,255,0.3)' }}>{user?.role}</p>
          </div>
        </div>
      </div>

      {/* ── Form ──────────────────────────────────────────────────────────── */}
      <div className="px-8 py-6 max-w-xl">
        <h2 className="text-xl font-bold mb-6">Chỉnh sửa thông tin</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Display name */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Tên hiển thị
            </label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              maxLength={100} placeholder="Tên của bạn"
              className="w-full rounded-lg px-4 py-3 text-sm outline-none transition"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(29,185,84,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.10)'}
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Email
            </label>
            <input type="email" value={user?.email || ''} readOnly
              className="w-full rounded-lg px-4 py-3 text-sm outline-none cursor-not-allowed"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}
            />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Email không thể thay đổi.</p>
          </div>

          {mutation.isError && (
            <div className="rounded-lg px-4 py-3 text-sm"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#fca5a5' }}>
              {mutation.error?.response?.data?.error?.message || 'Có lỗi xảy ra, vui lòng thử lại.'}
            </div>
          )}

          {saved && (
            <div className="rounded-lg px-4 py-3 text-sm font-medium"
              style={{ background: 'rgba(29,185,84,0.10)', border: '1px solid rgba(29,185,84,0.35)', color: '#1DB954' }}>
              Đã lưu thành công!
            </div>
          )}

          <button type="submit" disabled={mutation.isPending}
            className="px-8 py-3 rounded-full text-black font-bold text-sm transition disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#1DB954,#0ea5e9)' }}>
            {mutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </div>
  );
}
