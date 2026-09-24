import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Table } from '../../components/ui/Table';
import { RoleBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SearchInput, Select, Input } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
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
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(0);

  // Edit user modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userRole, setUserRole] = useState<Role>('CUSTOMER');
  const [saving, setSaving] = useState(false);

  // Create user modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('CUSTOMER');
  const [creating, setCreating] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  function fetchUsers() {
    setLoading(true);
    api.get<PageResponse<User> | User[]>('/api/users')
      .then(res => setUsers(Array.isArray(res) ? res : res.content ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }

  const filtered = users.filter(u => {
    if (search && !`${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter && u.role !== roleFilter) return false;
    return true;
  });

  function openEditModal(user: User) {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone || '');
    setUserRole(user.role);
    setEditModalOpen(true);
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      await api.put(`/api/users/${editingUser.id}`, {
        name,
        email,
        phone,
        role: userRole,
      });
      success(`User ${email} updated.`);
      setEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      error(err.message || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail || !newPassword || !newName) return;
    setCreating(true);
    try {
      await api.post('/api/users', {
        username: newUsername || newEmail.split('@')[0],
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });
      success(`User account ${newEmail} created.`);
      setCreateModalOpen(false);
      setNewUsername('');
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      fetchUsers();
    } catch (err: any) {
      error(err.message || 'Failed to create user account.');
    } finally {
      setCreating(false);
    }
  }

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
      <PageHeader
        title="Users"
        subtitle="Manage platform user accounts, security roles, and permissions"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Users' }]}
        actions={<Button onClick={() => setCreateModalOpen(true)}>Create User</Button>}
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="w-64"><SearchInput placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="w-36"><Select options={ROLE_OPTIONS} value={roleFilter} onChange={e => setRoleFilter(e.target.value)} /></div>
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
                  <span className="text-xs font-medium text-zinc-400">{initials(u.name)}</span>
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
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={e => { e.stopPropagation(); openEditModal(u); }}
                  className="text-zinc-400 hover:text-white text-xs font-mono px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setDeleteTarget(u); }}
                  className="text-red-400 hover:text-red-300 text-xs font-mono px-2 py-1 rounded bg-red-950/30 hover:bg-red-900/40 transition-colors"
                  aria-label="Delete user"
                >
                  Delete
                </button>
              </div>
            )},
          ]}
        />
        <Pagination page={page} totalPages={Math.max(1, Math.ceil(filtered.length / 10))} totalElements={filtered.length} pageSize={10} onPageChange={setPage} />
      </div>

      {/* Edit User Modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit User Account">
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <Input label="Name" value={name} onChange={e => setName(e.target.value)} required />
          <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
          <Select
            label="Security Role"
            options={[
              { value: 'CUSTOMER', label: 'Customer' },
              { value: 'DEALER', label: 'Dealer' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
            value={userRole}
            onChange={e => setUserRole(e.target.value as Role)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button type="button" variant="secondary" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save User</Button>
          </div>
        </form>
      </Modal>

      {/* Create User Modal */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create User Account">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input label="Username" placeholder="johndoe" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
          <Input label="Full Name" placeholder="John Doe" value={newName} onChange={e => setNewName(e.target.value)} required />
          <Input label="Email Address" type="email" placeholder="john@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
          <Input label="Password" type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          <Select
            label="Assigned Role"
            options={[
              { value: 'CUSTOMER', label: 'Customer' },
              { value: 'DEALER', label: 'Dealer' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
            value={newRole}
            onChange={e => setNewRole(e.target.value as Role)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button type="button" variant="secondary" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={creating}>Create Account</Button>
          </div>
        </form>
      </Modal>

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
