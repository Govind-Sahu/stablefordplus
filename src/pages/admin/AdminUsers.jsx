import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { admin } from '../../lib/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchUsers = () => {
    const params = {};
    if (search) params.search = search;
    if (status) params.status = status;
    admin.users(params)
      .then(({ users }) => setUsers(users))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [search, status]);

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await admin.updateUser(editUser.id, {
        name: editUser.name,
        role: editUser.role,
        subscription_status: editUser.subscription_status,
        charity_id: editUser.charity_id,
        charity_contribution_pct: editUser.charity_contribution_pct,
      });
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin" className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
          </Link>
          <h1 className="text-3xl font-black">User Management</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="flex-1 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-slate-400 text-xs font-semibold px-5 py-4 uppercase tracking-wider">User</th>
                  <th className="text-left text-slate-400 text-xs font-semibold px-5 py-4 uppercase tracking-wider hidden md:table-cell">Status</th>
                  <th className="text-left text-slate-400 text-xs font-semibold px-5 py-4 uppercase tracking-wider hidden lg:table-cell">Charity</th>
                  <th className="text-left text-slate-400 text-xs font-semibold px-5 py-4 uppercase tracking-wider hidden lg:table-cell">Scores</th>
                  <th className="text-left text-slate-400 text-xs font-semibold px-5 py-4 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-10 text-slate-400">Loading...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-10 text-slate-500">No users found</td></tr>
                ) : users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{user.name}</div>
                          <div className="text-slate-500 text-xs">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        user.subscription_status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {user.subscription_status}
                      </span>
                      {user.role === 'admin' && (
                        <span className="ml-2 text-xs font-semibold px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">admin</span>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-slate-400 text-sm">{user.charity_name || '—'}</span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-slate-400 text-sm">{user.score_count}/5</span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setEditUser(user)}
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit modal */}
        {editUser && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-5">Edit User: {editUser.name}</h2>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={editUser.name || ''}
                    onChange={e => setEditUser(u => ({ ...u, name: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Role</label>
                  <select
                    value={editUser.role}
                    onChange={e => setEditUser(u => ({ ...u, role: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="subscriber">Subscriber</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Subscription Status</label>
                  <select
                    value={editUser.subscription_status}
                    onChange={e => setEditUser(u => ({ ...u, subscription_status: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="past_due">Past Due</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditUser(null)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors"
                  >
                    {editLoading ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
