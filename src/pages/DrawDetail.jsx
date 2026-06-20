import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { draws as drawsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function DrawDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [draw, setDraw] = useState(null);
  const [entries, setEntries] = useState([]);
  const [myEntry, setMyEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      drawsApi.get(id).then(({ draw, entries }) => { setDraw(draw); setEntries(entries); }),
      user ? drawsApi.myEntry(id).then(({ entry }) => setMyEntry(entry)).catch(() => {}) : Promise.resolve(),
    ]).finally(() => setLoading(false));
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 pt-20 flex items-center justify-center">
        <div className="text-slate-400">Loading draw details...</div>
      </div>
    );
  }

  if (!draw) {
    return (
      <div className="min-h-screen bg-slate-950 pt-20 flex items-center justify-center">
        <div className="text-slate-400">Draw not found</div>
      </div>
    );
  }

  const numbers = draw.draw_numbers
    ? (typeof draw.draw_numbers === 'string' ? JSON.parse(draw.draw_numbers) : draw.draw_numbers)
    : null;

  const tier5Winners = entries.filter(e => e.prize_tier === 5);
  const tier4Winners = entries.filter(e => e.prize_tier === 4);
  const tier3Winners = entries.filter(e => e.prize_tier === 3);

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/draws" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back to draws
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black mb-2">{MONTH_NAMES[draw.month]} {draw.year}</h1>
            <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${
              draw.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' :
              draw.status === 'simulated' ? 'bg-amber-500/20 text-amber-400' :
              'bg-slate-700 text-slate-300'
            }`}>
              {draw.status}
            </span>
          </div>
          {draw.jackpot_carried_forward && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold px-4 py-2 rounded-xl">
              Jackpot rolls to next month
            </div>
          )}
        </div>

        {/* My entry status */}
        {user && myEntry && (
          <div className={`rounded-2xl p-5 mb-8 border ${
            myEntry.prize_tier >= 5 ? 'border-emerald-500 bg-emerald-500/10' :
            myEntry.prize_tier >= 4 ? 'border-amber-500 bg-amber-500/10' :
            myEntry.prize_tier >= 3 ? 'border-blue-500 bg-blue-500/10' :
            'border-slate-700 bg-slate-900'
          }`}>
            <div className="font-bold text-lg mb-1">Your result</div>
            <div className={`text-2xl font-black mb-1 ${
              myEntry.prize_tier >= 5 ? 'text-emerald-400' :
              myEntry.prize_tier >= 4 ? 'text-amber-400' :
              myEntry.prize_tier >= 3 ? 'text-blue-400' : 'text-slate-400'
            }`}>
              {myEntry.numbers_matched} numbers matched
            </div>
            {myEntry.prize_amount > 0 && (
              <div className="text-white font-bold">Prize: £{(myEntry.prize_amount / 100).toFixed(2)}</div>
            )}
          </div>
        )}

        {/* Draw numbers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold mb-6 text-center">
            {numbers ? 'Winning Numbers' : 'Numbers Not Yet Drawn'}
          </h2>
          <div className="flex justify-center gap-4 flex-wrap">
            {numbers
              ? numbers.map(n => (
                <div key={n} className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-500/30">
                  {n}
                </div>
              ))
              : [1,2,3,4,5].map(i => (
                <div key={i} className="w-16 h-16 border-2 border-dashed border-slate-600 rounded-full flex items-center justify-center text-slate-600 font-bold text-2xl">?</div>
              ))
            }
          </div>
        </div>

        {/* Prize breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { tier: '5-Match Jackpot', amount: draw.tier5_amount, winners: tier5Winners.length, highlight: true },
            { tier: '4-Number Match', amount: draw.tier4_amount, winners: tier4Winners.length },
            { tier: '3-Number Match', amount: draw.tier3_amount, winners: tier3Winners.length },
          ].map(p => (
            <div key={p.tier} className={`rounded-2xl p-5 border ${p.highlight ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-slate-700 bg-slate-900'}`}>
              <div className={`text-2xl font-black mb-1 ${p.highlight ? 'text-emerald-400' : 'text-white'}`}>
                £{(p.amount / 100).toFixed(0)}
              </div>
              <div className="text-slate-400 text-sm mb-1">{p.tier}</div>
              <div className="text-slate-500 text-xs">{p.winners} winner{p.winners !== 1 ? 's' : ''}</div>
            </div>
          ))}
        </div>

        {/* Winners table */}
        {entries.length > 0 && draw.status === 'published' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-5">Winners</h2>
            <div className="space-y-3">
              {entries.filter(e => e.prize_tier >= 3).map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      entry.prize_tier === 5 ? 'bg-emerald-500 text-white' :
                      entry.prize_tier === 4 ? 'bg-amber-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {entry.prize_tier}
                    </div>
                    <div>
                      <div className="text-white font-medium">{entry.user_name || 'Anonymous'}</div>
                      <div className="text-slate-500 text-xs">{entry.numbers_matched} numbers matched</div>
                    </div>
                  </div>
                  {entry.prize_amount > 0 && (
                    <div className="text-emerald-400 font-bold">£{(entry.prize_amount / 100).toFixed(2)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
