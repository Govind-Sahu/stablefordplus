import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { admin, winners as winnersApi } from '../../lib/api';

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const STATUS_COLORS = {
  pending: 'bg-slate-700 text-slate-400',
  submitted: 'bg-amber-500/20 text-amber-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  rejected: 'bg-red-500/20 text-red-400',
};

export default function AdminWinners() {
  const [winnersList, setWinnersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [message, setMessage] = useState('');

  const fetchWinners = () => {
    admin.winners()
      .then(({ winners }) => setWinnersList(winners))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWinners(); }, []);

  const handleVerify = async (id, status, payout_status) => {
    setUpdating(u => ({ ...u, [id]: true }));
    try {
      await winnersApi.verify(id, { status, payout_status });
      setMessage(`Winner ${status}`);
      fetchWinners();
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setUpdating(u => ({ ...u, [id]: false }));
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
          <h1 className="text-3xl font-black">Winners & Payouts</h1>
        </div>

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl px-5 py-3 mb-6 flex justify-between items-center">
            <span>{message}</span>
            <button onClick={() => setMessage('')}>✕</button>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-slate-400 text-xs font-semibold px-5 py-4 uppercase tracking-wider">Winner</th>
                  <th className="text-left text-slate-400 text-xs font-semibold px-5 py-4 uppercase tracking-wider">Draw</th>
                  <th className="text-left text-slate-400 text-xs font-semibold px-5 py-4 uppercase tracking-wider">Prize</th>
                  <th className="text-left text-slate-400 text-xs font-semibold px-5 py-4 uppercase tracking-wider">Verification</th>
                  <th className="text-left text-slate-400 text-xs font-semibold px-5 py-4 uppercase tracking-wider">Payout</th>
                  <th className="text-left text-slate-400 text-xs font-semibold px-5 py-4 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-10 text-slate-400">Loading...</td></tr>
                ) : winnersList.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-10 text-slate-500">No winners yet</td></tr>
                ) : winnersList.map(winner => (
                  <tr key={winner.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="text-white font-medium text-sm">{winner.user_name}</div>
                      <div className="text-slate-500 text-xs">{winner.user_email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-white text-sm">{MONTH_NAMES[winner.month]} {winner.year}</div>
                      <div className="text-slate-500 text-xs">{winner.prize_tier}-Match</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-emerald-400 font-bold text-sm">£{(winner.prize_amount / 100).toFixed(2)}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[winner.verification_status] || 'bg-slate-700 text-slate-400'}`}>
                        {winner.verification_status}
                      </span>
                      {winner.proof_url && (
                        <a href={winner.proof_url} target="_blank" rel="noopener noreferrer" className="block text-emerald-400 text-xs mt-1 hover:text-emerald-300">
                          View proof →
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        winner.payout_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {winner.payout_status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 flex-wrap">
                        {winner.verification_status === 'submitted' && (
                          <>
                            <button
                              onClick={() => handleVerify(winner.id, 'approved', winner.payout_status)}
                              disabled={updating[winner.id]}
                              className="text-xs bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleVerify(winner.id, 'rejected', winner.payout_status)}
                              disabled={updating[winner.id]}
                              className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {winner.verification_status === 'approved' && winner.payout_status !== 'paid' && (
                          <button
                            onClick={() => handleVerify(winner.id, 'approved', 'paid')}
                            disabled={updating[winner.id]}
                            className="text-xs bg-amber-500 hover:bg-amber-400 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
