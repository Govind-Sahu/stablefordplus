import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { charities as charitiesApi, auth as authApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function CharityDetail() {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [charity, setCharity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supporting, setSupporting] = useState(false);

  useEffect(() => {
    charitiesApi.get(id)
      .then(({ charity }) => setCharity(charity))
      .catch(() => navigate('/charities'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSupport = async () => {
    if (!user) { navigate('/login'); return; }
    setSupporting(true);
    try {
      await authApi.updateProfile({ charity_id: parseInt(id) });
      await refreshUser();
      alert('You are now supporting ' + charity.name);
    } catch (err) {
      alert(err.message);
    } finally {
      setSupporting(false);
    }
  };

  const isSupporting = user?.charity_id === parseInt(id);
  const events = charity?.events
    ? (typeof charity.events === 'string' ? JSON.parse(charity.events) : charity.events)
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 pt-20 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!charity) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/charities" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back to charities
        </Link>

        {charity.image_url && (
          <div className="aspect-video rounded-3xl overflow-hidden mb-8">
            <img src={charity.image_url} alt={charity.name} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div className="flex-1">
            {charity.featured && (
              <div className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                Featured Partner
              </div>
            )}
            <h1 className="text-4xl font-black mb-3">{charity.name}</h1>
            <p className="text-slate-300 text-lg leading-relaxed">{charity.description}</p>
            {charity.website_url && (
              <a
                href={charity.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 mt-4 text-sm font-medium transition-colors"
              >
                Visit {charity.name}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            )}
          </div>

          <div className="md:w-64 shrink-0">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              {isSupporting ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div className="text-emerald-400 font-bold mb-1">You support this charity</div>
                  <div className="text-slate-400 text-sm">{user.charity_contribution_pct}% of your subscription goes here</div>
                </div>
              ) : (
                <>
                  <h3 className="font-bold text-lg mb-2">Support this charity</h3>
                  <p className="text-slate-400 text-sm mb-4">A percentage of your monthly subscription will go directly to {charity.name}.</p>
                  <button
                    onClick={handleSupport}
                    disabled={supporting}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    {supporting ? 'Updating...' : user ? 'Select this charity' : 'Sign in to support'}
                  </button>
                  {!user && (
                    <p className="text-center text-slate-500 text-xs mt-2">
                      <Link to="/register" className="text-emerald-400">Create an account</Link> to get started
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {events.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-5">Upcoming Events</h2>
            <div className="space-y-4">
              {events.map((event, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-slate-800 rounded-xl">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-semibold">{event.name}</div>
                    {event.date && <div className="text-slate-400 text-sm">{new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>}
                    {event.location && <div className="text-slate-500 text-sm">{event.location}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
