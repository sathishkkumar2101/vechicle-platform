import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Table } from '../../components/ui/Table';
import { RoleBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SearchInput, Select } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/Modal';
import { initials, formatDate } from '../../lib/format';
import { useToast } from '../../components/ui/Toast';
import api from '../../lib/api';
import type { User, PageResponse, Role } from '../../types';

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'DEALER', label: 'Dealer' },
  { value: 'CUSTOMER', label: 'Customer' },
];

export default function AdminUsers() {
  const { success, error } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get<PageResponse<User> | User[]>('/api/users')
      .then(res => setUsers(Array.isArray(res) ? res : res.content ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = users.filter(u => {
    if (search && !`${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (role && u.role !== role) return false;
    return true;
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/users/${deleteTarget.id}`);
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      success(`User ${deleteTarget.email} removed.`);
    } catch (err: any) {
      error(err.message || 'Failed to delete user.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage platform user accounts and roles" breadcrumbs={[{ label: 'Admin' }, { label: 'Users' }]} />
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="w-64"><SearchInput placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="w-36"><Select options={ROLE_OPTIONS} value={role} onChange={e => setRole(e.target.value)} /></div>
        <span className="text-xs text-zinc-600 self-center ml-auto font-mono">{filtered.length} users</span>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
        <Table
          loading={loading}
          data={filtered.slice(page * 10, (page + 1) * 10)}
          keyExtractor={u => u.id}
          emptyMessage="No users found"
          columns={[
            { key: 'user', header: 'User', render: u => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                  <span className="text-xs font-medium text-zinc-400">{initials(u.name,)}</span>
                </div>
                <div>
                  <p className="text-white font-medium">{u.name}</p>
                  <p className="text-xs text-zinc-500">{u.email}</p>
                </div>
              </div>
            )},
            { key: 'role', header: 'Role', render: u => <RoleBadge role={u.role} /> },
            { key: 'joined', header: 'Joined', render: u => <span className="text-zinc-500 text-xs font-mono">{formatDate(u.createdAt)}</span> },
            { key: 'actions', header: '', align: 'right', render: u => (
              <button
                onClick={e => { e.stopPropagation(); setDeleteTarget(u); }}
                className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                aria-label="Delete user"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            )},
          ]}
        />
        <Pagination page={page} totalPages={Math.ceil(filtered.length / 10)} totalElements={filtered.length} pageSize={10} onPageChange={setPage} />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteTarget?.email}? This action cannot be undone.`}
        confirmLabel="Delete User"
      />
    </div>
  );
}
