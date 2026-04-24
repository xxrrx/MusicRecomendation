import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUserStatus, updateUserRole } from '../../lib/adminApi';
import Pagination from '../../components/Pagination';

const ROLE_BADGE = {
  admin:  'bg-red-500/15 text-red-400 border border-red-500/30',
  artist: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  user:   'bg-blue-500/15 text-blue-400 border border-blue-500/30',
};

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-sp-border">
      {[1,2,3,4,5].map((i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-3 bg-sp-hover rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  function handleSearch(val) {
    setSearch(val);
    setPage(1);
    clearTimeout(window._searchTimer);
    window._searchTimer = setTimeout(() => setDebouncedSearch(val), 400);
  }

  function handleRole(val) { setRole(val); setPage(1); }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', debouncedSearch, role, page],
    queryFn: () => getUsers({ search: debouncedSearch || undefined, role: role || undefined, page, limit: 10 }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }) => updateUserStatus(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => updateUserRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const users = data?.users || [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6 pb-4 shrink-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Người dùng</h1>
        <p className="text-sp-gray text-sm mt-1">{data?.pagination?.total ?? 0} tài khoản</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <svg viewBox="0 0 24 24" fill="currentColor"
               className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-gray-dark pointer-events-none">
            <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5zM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5z" clipRule="evenodd" />
          </svg>
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email…"
            data-testid="user-search"
            className="sp-input pl-10 text-sm"
          />
        </div>
        <select
          value={role}
          onChange={(e) => handleRole(e.target.value)}
          data-testid="role-filter"
          className="bg-sp-hover text-white rounded-card px-4 py-2.5 text-sm
                     border border-sp-border focus:outline-none focus:border-white
                     transition-colors duration-150"
        >
          <option value="">Tất cả vai trò</option>
          <option value="user">User</option>
          <option value="artist">Artist</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      </div>{/* end shrink-0 header */}

      {/* Table — scrollable area */}
      <div className="flex-1 overflow-auto px-6 min-h-0">
      <div className="bg-sp-card rounded-card overflow-hidden">
        <table className="w-full text-sm" data-testid="users-table">
          <thead className="border-b border-sp-border">
            <tr className="text-sp-gray text-xs uppercase tracking-wider text-left">
              <th className="px-4 py-3.5">Người dùng</th>
              <th className="px-4 py-3.5">Vai trò</th>
              <th className="px-4 py-3.5">Ngày tham gia</th>
              <th className="px-4 py-3.5">Trạng thái</th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-sp-border">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              : users.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="text-center text-sp-gray py-12 text-sm">
                      Không tìm thấy người dùng nào.
                    </td>
                  </tr>
                )
                : users.map((user) => (
                    <tr key={user.id} data-testid={`user-row-${user.id}`}
                        className="hover:bg-sp-hover/40 transition-colors duration-150">
                      {/* User info */}
                      <td className="px-4 py-3.5">
                        <Link to={`/admin/users/${user.id}`} className="group flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-sp-hover flex items-center justify-center shrink-0">
                            <span className="text-sp-gray text-xs font-bold uppercase">
                              {user.displayName?.[0] ?? user.email?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium group-hover:text-blue-400 transition-colors">
                              {user.displayName}
                            </p>
                            <p className="text-sp-gray-dark text-xs">{user.email}</p>
                          </div>
                        </Link>
                      </td>

                      {/* Role selector */}
                      <td className="px-4 py-3.5">
                        <select
                          value={user.role}
                          onChange={(e) => roleMutation.mutate({ id: user.id, role: e.target.value })}
                          disabled={user.role === 'admin' || roleMutation.isPending}
                          className={`text-xs px-2.5 py-1.5 rounded-pill border font-semibold
                                      focus:outline-none transition-colors duration-150 cursor-pointer
                                      disabled:opacity-50 disabled:cursor-not-allowed
                                      bg-transparent ${ROLE_BADGE[user.role] ?? ''}`}
                        >
                          <option value="user">user</option>
                          <option value="artist">artist</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>

                      {/* Joined date */}
                      <td className="px-4 py-3.5 text-sp-gray text-xs">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-pill border ${
                          user.isActive
                            ? 'bg-green-500/15 text-green-400 border-green-500/30'
                            : 'bg-red-500/15 text-red-400 border-red-500/30'
                        }`}>
                          {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1.5 justify-end">
                          <Link
                            to={`/admin/users/${user.id}`}
                            className="text-xs px-3 py-1.5 rounded-lg text-sp-gray
                                       hover:text-white hover:bg-sp-hover transition-colors duration-150"
                          >
                            Chi tiết
                          </Link>
                          {user.role !== 'admin' && (
                            <button
                              data-testid={`toggle-status-${user.id}`}
                              onClick={() => statusMutation.mutate({ id: user.id, isActive: !user.isActive })}
                              disabled={statusMutation.isPending}
                              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 ${
                                user.isActive
                                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                  : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                              }`}
                            >
                              {user.isActive ? 'Khóa' : 'Mở khóa'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
            }
          </tbody>
        </table>
      </div>
      </div>{/* end scroll area */}

      <Pagination pagination={data?.pagination} onPageChange={setPage} label="tài khoản" />
    </div>
  );
}
