import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { draws as drawsApi } from '../lib/api';

const STATUS_COLORS = {
  pending: 'bg-slate-700 text-slate-300',
  simulated: 'bg-amber-500/20 text-amber-400',
  published: 'bg-emerald-500/20 text-emerald-400',
};

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function Draws() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    drawsApi.list()
      .then(({ draws }) => setDraws(draws))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="text-emerald-400 text-sm font-semibold tracking-wider uppercase mb-3">Monthly draws</div>
          <h1 className="text-5xl font-black mb-4">Prize Draw History</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Every month, active subscribers with at least 3 matching numbers win a share of the prize pool.
          </p>
        </div>

        {/* Prize tiers explainer */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { tier: '5-Number', pct: '40%', label: 'Jackpot — rolls over if unclaimed', highlight: true },
            { tier: '4-Number', pct: '35%', label: 'Split equally among winners' },
            { tier: '3-Number', pct: '25%', label: 'Split equally among winners' },
          ].map(t => (
            <div key={t.tier} className={`rounded-2xl p-5 border ${t.highlight ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-700 bg-slate-900'}`}>
              <div className={`text-2xl font-black mb-1 ${t.highlight ? 'text-emerald-400' : 'text-white'}`}>{t.pct}</div>
              <div className="text-white font-semibold text-sm mb-1">{t.tier} Match</div>
              <div className="text-slate-500 text-xs">{t.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse h-24" />
            ))}
          </div>
        ) : draws.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="text-4xl mb-3">🎯</div>
            <div className="text-white font-bold mb-2">No draws yet</div>
            <div className="text-slate-400 text-sm">The first draw will appear here once created.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {draws.map(draw => {
              const numbers = draw.draw_numbers
                ? (typeof draw.draw_numbers === 'string' ? JSON.parse(draw.draw_numbers) : draw.draw_numbers)
                : null;
              return (
                <Link
                  key={draw.id}
                  to={`/draws/${draw.id}`}
                  className="block bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-800 rounded-xl flex flex-col items-center justify-center shrink-0">
                        <span className="text-emerald-400 font-black text-sm">{MONTH_NAMES[draw.month]?.slice(0,3)}</span>
                        <span className="text-slate-400 text-xs">{draw.year}</span>
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">
                          {MONTH_NAMES[draw.month]} {draw.year} Draw
                        </div>
                        {draw.prize_pool_total > 0 && (
                          <div className="text-slate-400 text-sm">Prize pool: £{(draw.prize_pool_total / 100).toFixed(0)}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[draw.status] || 'bg-slate-700 text-slate-300'}`}>
                        {draw.status}
                      </span>
                      {numbers && (
                        <div className="flex gap-1.5">
                          {numbers.map(n => (
                            <div key={n} className="w-7 h-7 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-xs font-bold">
                              {n}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
