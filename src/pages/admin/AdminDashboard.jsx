import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { admin } from '../../lib/api';

function StatCard({ label, value, sublabel, color = 'emerald', icon }) {
  const colors = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/20 text-blue-400',
    amber: 'bg-amber-500/20 text-amber-400',
    purple: 'bg-purple-500/20 text-purple-400',
    red: 'bg-red-500/20 text-red-400',
  };
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}>
        {icon}
      </div>
      <div className="text-3xl font-black text-white mb-0.5">{value}</div>
      <div className="text-white font-medium text-sm mb-0.5">{label}</div>
      {sublabel && <div className="text-slate-500 text-xs">{sublabel}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    admin.stats()
      .then(s => setStats(s))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">Admin Dashboard</h1>
            <p className="text-slate-400 mt-1">Platform overview and controls</p>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/draws" className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Manage Draws
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl h-32 animate-pulse" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Users"
              value={stats.totalUsers}
              sublabel={`${stats.activeSubscribers} active subscribers`}
              color="blue"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
            />
            <StatCard
              label="Prize Pool Distributed"
              value={`£${(stats.totalPrizePool / 100).toFixed(0)}`}
              sublabel="Across all draws"
              color="emerald"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            />
            <StatCard
              label="Total Draws"
              value={stats.totalDraws}
              color="purple"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>}
            />
            <StatCard
              label="Pending Verification"
              value={stats.pendingVerification}
              sublabel={`${stats.verifiedWinners} verified total`}
              color={stats.pendingVerification > 0 ? 'amber' : 'emerald'}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>}
            />
          </div>
        )}

        {/* Quick nav */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { to: '/admin/users', label: 'User Management', desc: 'View and edit all users, subscriptions, and scores', icon: '👤', color: 'blue' },
            { to: '/admin/draws', label: 'Draw Management', desc: 'Create, simulate, and publish monthly draws', icon: '🎯', color: 'emerald' },
            { to: '/admin/charities', label: 'Charity Management', desc: 'Add, edit, and feature charity partners', icon: '❤️', color: 'red' },
            { to: '/admin/winners', label: 'Winners & Payouts', desc: 'Verify submissions and mark payouts', icon: '🏆', color: 'amber' },
          ].map(item => (
            <Link
              key={item.to}
              to={item.to}
              className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 group"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <div className="text-white font-bold mb-2 group-hover:text-emerald-400 transition-colors">{item.label}</div>
              <div className="text-slate-500 text-sm leading-relaxed">{item.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
