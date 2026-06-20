import { useState, useEffect } from 'react';
import { winners as winnersApi } from '../lib/api';

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const TIER_LABEL = { 5: 'Jackpot', 4: '4-Match', 3: '3-Match' };
const TIER_COLORS = { 5: 'text-emerald-400', 4: 'text-amber-400', 3: 'text-blue-400' };

export default function Winners() {
  const [winnersList, setWinnersList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    winnersApi.list()
      .then(({ winners }) => setWinnersList(winners))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="text-emerald-400 text-sm font-semibold tracking-wider uppercase mb-3">Hall of fame</div>
          <h1 className="text-5xl font-black mb-4">Winners Gallery</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Verified winners who matched the monthly draw numbers and claimed their prizes.
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-pulse h-28" />
            ))}
          </div>
        ) : winnersList.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="text-5xl mb-4">🏆</div>
            <div className="text-white font-bold text-xl mb-2">No winners yet</div>
            <div className="text-slate-400 text-sm">Verified winners will be showcased here after each draw.</div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {winnersList.map(winner => {
              const numbers = winner.draw_numbers
                ? (typeof winner.draw_numbers === 'string' ? JSON.parse(winner.draw_numbers) : winner.draw_numbers)
                : [];
              return (
                <div
                  key={winner.id}
                  className={`bg-slate-900 border rounded-2xl p-6 ${
                    winner.prize_tier === 5 ? 'border-emerald-500/40' :
                    winner.prize_tier === 4 ? 'border-amber-500/30' :
                    'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className={`text-sm font-bold mb-1 ${TIER_COLORS[winner.prize_tier] || 'text-white'}`}>
                        {TIER_LABEL[winner.prize_tier] || winner.prize_tier + '-Match'}
                      </div>
                      <div className="text-white font-bold text-xl">
                        {winner.user_name || 'Anonymous Winner'}
                      </div>
                      <div className="text-slate-500 text-sm">
                        {MONTH_NAMES[winner.month]} {winner.year}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-400">
                        £{(winner.prize_amount / 100).toFixed(2)}
                      </div>
                      <div className={`text-xs mt-1 ${winner.payout_status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {winner.payout_status === 'paid' ? 'Paid' : 'Pending'}
                      </div>
                    </div>
                  </div>
                  {numbers.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {numbers.map(n => (
                        <div key={n} className="w-8 h-8 bg-slate-800 text-slate-300 rounded-full flex items-center justify-center text-xs font-bold">
                          {n}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
