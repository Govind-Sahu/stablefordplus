import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { scores as scoresApi, charities as charitiesApi, subscriptions, draws as drawsApi, winners as winnersApi } from '../lib/api';

function ScoreCard({ score, onDelete }) {
  return (
    <div className="flex items-center justify-between bg-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
          <span className="text-emerald-400 font-black text-lg">{score.score}</span>
        </div>
        <div>
          <div className="text-white font-medium">{new Date(score.date_played).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          <div className="text-slate-500 text-xs">Stableford</div>
        </div>
      </div>
      <button onClick={() => onDelete(score.id)} className="text-slate-500 hover:text-red-400 transition-colors p-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>
  );
}

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userScores, setUserScores] = useState([]);
  const [charities, setCharities] = useState([]);
  const [subStatus, setSubStatus] = useState(null);
  const [currentDraw, setCurrentDraw] = useState(null);
  const [myWinnings, setMyWinnings] = useState([]);
  const [addForm, setAddForm] = useState({ score: '', date_played: new Date().toISOString().split('T')[0] });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(searchParams.get('success') ? 'Subscription activated!' : '');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    Promise.all([
      scoresApi.list().then(({ scores }) => setUserScores(scores)).catch(() => {}),
      charitiesApi.list().then(({ charities }) => setCharities(charities)).catch(() => {}),
      subscriptions.status().then(d => setSubStatus(d)).catch(() => {}),
      drawsApi.current().then(({ draw }) => setCurrentDraw(draw)).catch(() => {}),
      winnersApi.my().then(({ winners }) => setMyWinnings(winners)).catch(() => {}),
    ]);
    if (searchParams.get('success')) refreshUser();
  }, [user, navigate, searchParams, refreshUser]);

  const handleAddScore = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    try {
      const { score } = await scoresApi.add({ score: Number(addForm.score), date_played: addForm.date_played });
      setUserScores(prev => {
        const updated = [score, ...prev].sort((a, b) => new Date(b.date_played) - new Date(a.date_played));
        return updated.slice(0, 5);
      });
      setAddForm({ score: '', date_played: new Date().toISOString().split('T')[0] });
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteScore = async (id) => {
    try {
      await scoresApi.delete(id);
      setUserScores(prev => prev.filter(s => s.id !== id));
    } catch {}
  };

  const handleManageSub = async () => {
    try {
      const { url } = await subscriptions.portal();
      if (url) window.location.href = url;
    } catch (err) {
      alert(err.message);
    }
  };

  const selectedCharity = charities.find(c => c.id === user?.charity_id);
  const charityContrib = user?.charity_contribution_pct || 10;
  const avgScore = userScores.length > 0 ? Math.round(userScores.reduce((s, r) => s + r.score, 0) / userScores.length) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl px-5 py-4 mb-6 flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {successMsg}
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-black mb-1">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-slate-400">Your performance dashboard</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Subscription',
              value: user?.subscription_status === 'active' ? 'Active' : 'Inactive',
              color: user?.subscription_status === 'active' ? 'emerald' : 'red',
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>,
            },
            {
              label: 'Scores Logged',
              value: userScores.length + '/5',
              color: 'blue',
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
            },
            {
              label: 'Avg Score',
              value: avgScore ? avgScore : '—',
              color: 'purple',
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>,
            },
            {
              label: 'Prizes Won',
              value: myWinnings.filter(w => w.payout_status === 'paid').length,
              color: 'amber',
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>,
            },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-${stat.color}-500/20 text-${stat.color}-400`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-black text-white mb-0.5">{stat.value}</div>
              <div className="text-slate-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Scores section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold">Golf Scores</h2>
                <span className="text-slate-500 text-sm">{userScores.length}/5 max</span>
              </div>

              <form onSubmit={handleAddScore} className="flex gap-3 mb-5">
                <input
                  type="number"
                  min="1" max="45"
                  value={addForm.score}
                  onChange={(e) => setAddForm(f => ({ ...f, score: e.target.value }))}
                  placeholder="Score (1-45)"
                  className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
                <input
                  type="date"
                  value={addForm.date_played}
                  onChange={(e) => setAddForm(f => ({ ...f, date_played: e.target.value }))}
                  className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
                <button
                  type="submit"
                  disabled={addLoading}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {addLoading ? '...' : 'Add'}
                </button>
              </form>
              {addError && <p className="text-red-400 text-sm mb-4">{addError}</p>}

              <div className="space-y-3">
                {userScores.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p className="mb-2">No scores yet</p>
                    <p className="text-xs">Add up to 5 Stableford scores to enter draws</p>
                  </div>
                ) : (
                  userScores.map(score => (
                    <ScoreCard key={score.id} score={score} onDelete={handleDeleteScore} />
                  ))
                )}
              </div>
              {userScores.length === 5 && (
                <p className="text-slate-500 text-xs mt-3 text-center">Adding a new score will replace your oldest one</p>
              )}
            </div>

            {/* Current Draw */}
            {currentDraw && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">This Month's Draw</h2>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    currentDraw.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' :
                    currentDraw.status === 'simulated' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {currentDraw.status}
                  </span>
                </div>
                {currentDraw.draw_numbers ? (
                  <div>
                    <p className="text-slate-400 text-sm mb-3">Winning numbers:</p>
                    <div className="flex gap-3 flex-wrap">
                      {(typeof currentDraw.draw_numbers === 'string'
                        ? JSON.parse(currentDraw.draw_numbers)
                        : currentDraw.draw_numbers
                      ).map(n => (
                        <div key={n} className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-black text-lg">
                          {n}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="w-12 h-12 border-2 border-dashed border-slate-700 rounded-full flex items-center justify-center text-slate-600 font-bold text-lg">?</div>
                    ))}
                  </div>
                )}
                {currentDraw.prize_pool_total > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      { tier: '5-Match', amount: currentDraw.tier5_amount, jackpot: true },
                      { tier: '4-Match', amount: currentDraw.tier4_amount },
                      { tier: '3-Match', amount: currentDraw.tier3_amount },
                    ].map(p => (
                      <div key={p.tier} className={`rounded-xl p-3 text-center ${p.jackpot ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-800'}`}>
                        <div className={`font-bold text-sm ${p.jackpot ? 'text-emerald-400' : 'text-white'}`}>
                          £{(p.amount / 100).toFixed(0)}
                        </div>
                        <div className="text-slate-500 text-xs">{p.tier}</div>
                      </div>
                    ))}
                  </div>
                )}
                <Link to={`/draws/${currentDraw.id}`} className="block mt-4 text-center text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors">
                  View full draw details →
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subscription card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">Subscription</h2>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-4 ${
                user?.subscription_status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${user?.subscription_status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}/>
                {user?.subscription_status === 'active' ? 'Active' : 'Inactive'}
              </div>
              {subStatus?.subscription && (
                <div className="text-slate-400 text-sm space-y-1 mb-4">
                  <div>Next billing: {subStatus.subscription.current_period_end
                    ? new Date(subStatus.subscription.current_period_end * 1000).toLocaleDateString('en-GB')
                    : 'N/A'}
                  </div>
                </div>
              )}
              {user?.subscription_status === 'active' ? (
                <button onClick={handleManageSub} className="w-full text-sm bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl transition-colors">
                  Manage subscription
                </button>
              ) : (
                <Link to="/subscribe" className="block w-full text-center text-sm bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-2.5 rounded-xl transition-colors">
                  Subscribe now
                </Link>
              )}
            </div>

            {/* Charity card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">Your Charity</h2>
              {selectedCharity ? (
                <>
                  {selectedCharity.image_url && (
                    <img src={selectedCharity.image_url} alt={selectedCharity.name} className="w-full h-28 object-cover rounded-xl mb-3" />
                  )}
                  <div className="text-white font-semibold mb-1">{selectedCharity.name}</div>
                  <div className="text-emerald-400 text-sm font-bold mb-3">{charityContrib}% of your subscription</div>
                </>
              ) : (
                <div className="text-slate-400 text-sm mb-4">No charity selected yet</div>
              )}
              <Link to="/charities" className="block w-full text-center text-sm bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl transition-colors">
                {selectedCharity ? 'Change charity' : 'Choose a charity'}
              </Link>
            </div>

            {/* My winnings */}
            {myWinnings.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4">My Winnings</h2>
                <div className="space-y-3">
                  {myWinnings.slice(0, 3).map(w => (
                    <div key={w.id} className="flex justify-between items-center">
                      <div>
                        <div className="text-white text-sm font-medium">{w.prize_tier}-Number Match</div>
                        <div className="text-slate-500 text-xs">{w.month}/{w.year}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-bold text-sm">£{(w.prize_amount / 100).toFixed(2)}</div>
                        <div className={`text-xs ${w.payout_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {w.payout_status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
