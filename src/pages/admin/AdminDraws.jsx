import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { draws as drawsApi } from '../../lib/api';

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function AdminDraws() {
  const [drawsList, setDrawsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState('');
  const [newDraw, setNewDraw] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), algorithm_type: 'random' });

  const fetchDraws = () => {
    drawsApi.list().then(({ draws }) => setDrawsList(draws)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchDraws(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await drawsApi.create(newDraw);
      setMessage('Draw created successfully');
      fetchDraws();
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSimulate = async (id) => {
    setActionLoading(l => ({ ...l, [id + '_sim']: true }));
    try {
      const result = await drawsApi.simulate(id);
      setMessage(`Simulation complete — 5-match: ${result.summary.tier5Winners}, 4-match: ${result.summary.tier4Winners}, 3-match: ${result.summary.tier3Winners}. Jackpot ${result.summary.jackpotWon ? 'WON' : 'rolls over'}.`);
      fetchDraws();
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setActionLoading(l => ({ ...l, [id + '_sim']: false }));
    }
  };

  const handlePublish = async (id) => {
    if (!confirm('Publish this draw? This will notify winners and cannot be undone.')) return;
    setActionLoading(l => ({ ...l, [id + '_pub']: true }));
    try {
      await drawsApi.publish(id);
      setMessage('Draw published successfully!');
      fetchDraws();
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setActionLoading(l => ({ ...l, [id + '_pub']: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin" className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
          </Link>
          <h1 className="text-3xl font-black">Draw Management</h1>
        </div>

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl px-5 py-3 mb-6 flex justify-between items-center">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-emerald-600 hover:text-emerald-400">✕</button>
          </div>
        )}

        {/* Create draw */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Create New Draw</h2>
          <form onSubmit={handleCreate} className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Month</label>
              <select
                value={newDraw.month}
                onChange={e => setNewDraw(d => ({ ...d, month: Number(e.target.value) }))}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                {MONTH_NAMES.slice(1).map((m, i) => (
                  <option key={i+1} value={i+1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Year</label>
              <input
                type="number"
                value={newDraw.year}
                onChange={e => setNewDraw(d => ({ ...d, year: Number(e.target.value) }))}
                className="w-28 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Algorithm</label>
              <select
                value={newDraw.algorithm_type}
                onChange={e => setNewDraw(d => ({ ...d, algorithm_type: e.target.value }))}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="random">Random</option>
                <option value="algorithmic">Algorithmic (score-weighted)</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={createLoading}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition-colors"
            >
              {createLoading ? 'Creating...' : 'Create Draw'}
            </button>
          </form>
        </div>

        {/* Draws list */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-slate-400 text-center py-8">Loading...</div>
          ) : drawsList.length === 0 ? (
            <div className="text-slate-500 text-center py-12">No draws created yet</div>
          ) : drawsList.map(draw => {
            const numbers = draw.draw_numbers
              ? (typeof draw.draw_numbers === 'string' ? JSON.parse(draw.draw_numbers) : draw.draw_numbers)
              : null;
            return (
              <div key={draw.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-bold text-xl">{MONTH_NAMES[draw.month]} {draw.year}</h3>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        draw.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' :
                        draw.status === 'simulated' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                        {draw.status}
                      </span>
                    </div>
                    <div className="text-slate-500 text-sm mb-3">
                      {draw.algorithm_type} draw · Pool: £{(draw.prize_pool_total / 100).toFixed(0)} ·
                      Entries: {draw.entry_count || 0}
                    </div>
                    {numbers && (
                      <div className="flex gap-2">
                        {numbers.map(n => (
                          <div key={n} className="w-9 h-9 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-sm font-bold">
                            {n}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 shrink-0">
                    {draw.status === 'pending' && (
                      <button
                        onClick={() => handleSimulate(draw.id)}
                        disabled={actionLoading[draw.id + '_sim']}
                        className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                      >
                        {actionLoading[draw.id + '_sim'] ? 'Running...' : 'Simulate'}
                      </button>
                    )}
                    {draw.status === 'simulated' && (
                      <>
                        <button
                          onClick={() => handleSimulate(draw.id)}
                          disabled={actionLoading[draw.id + '_sim']}
                          className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                        >
                          Re-simulate
                        </button>
                        <button
                          onClick={() => handlePublish(draw.id)}
                          disabled={actionLoading[draw.id + '_pub']}
                          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                        >
                          {actionLoading[draw.id + '_pub'] ? 'Publishing...' : 'Publish'}
                        </button>
                      </>
                    )}
                    <Link
                      to={`/draws/${draw.id}`}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
