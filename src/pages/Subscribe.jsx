import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscriptions } from '../lib/api';

function PlanCard({ plan, price, selected, onClick }) {
  const isYearly = price?.recurring?.interval === 'year';
  const amount = price ? (price.unit_amount / 100).toFixed(2) : null;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border-2 p-6 transition-all duration-200 ${
        selected
          ? 'border-emerald-500 bg-emerald-500/10'
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-white font-bold text-lg">{plan.name}</div>
          {isYearly && (
            <span className="text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Save ~17%
            </span>
          )}
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'}`}>
          {selected && <div className="w-2 h-2 bg-white rounded-full" />}
        </div>
      </div>
      {amount && (
        <div className="mb-3">
          <span className="text-3xl font-black text-white">£{amount}</span>
          <span className="text-slate-400 text-sm ml-1">/{price.recurring?.interval}</span>
        </div>
      )}
      {plan.description && <p className="text-slate-400 text-sm">{plan.description}</p>}
    </button>
  );
}

export default function Subscribe() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selectedPriceId, setSelectedPriceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/register'); return; }
    subscriptions.plans()
      .then(({ plans }) => {
        setPlans(plans);
        if (plans.length > 0 && plans[0].prices?.length > 0) {
          setSelectedPriceId(plans[0].prices[0].id);
        }
      })
      .catch(() => setError('Could not load subscription plans. Please try again.'))
      .finally(() => setFetchLoading(false));
  }, [user, navigate]);

  const handleSubscribe = async () => {
    if (!selectedPriceId) { setError('Please select a plan'); return; }
    setLoading(true);
    setError('');
    try {
      const { url } = await subscriptions.checkout(selectedPriceId);
      if (url) window.location.href = url;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const allPrices = plans.flatMap(p => p.prices?.map(pr => ({ ...pr, plan: p })) || []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black mb-3">Choose your plan</h1>
          <p className="text-slate-400">Unlock draws, track scores, and support charity</p>
        </div>

        {fetchLoading ? (
          <div className="text-center py-12 text-slate-400">Loading plans...</div>
        ) : allPrices.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-slate-400 mb-2">Subscription plans are being set up.</p>
            <p className="text-slate-500 text-sm">Please connect Stripe to enable payment plans, or check back shortly.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-6 text-emerald-400 hover:text-emerald-300 text-sm font-medium"
            >
              Continue to dashboard anyway
            </button>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
                {error}
              </div>
            )}
            <div className="space-y-4 mb-8">
              {allPrices.map(price => (
                <PlanCard
                  key={price.id}
                  plan={price.plan}
                  price={price}
                  selected={selectedPriceId === price.id}
                  onClick={() => setSelectedPriceId(price.id)}
                />
              ))}
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 mb-6 text-sm text-slate-400 space-y-1">
              <div className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Monthly prize draw entry</div>
              <div className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Score tracking & analytics</div>
              <div className="flex items-center gap-2"><span className="text-emerald-400">✓</span> 10%+ goes to your chosen charity</div>
              <div className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Cancel anytime</div>
            </div>
            <button
              onClick={handleSubscribe}
              disabled={loading || !selectedPriceId}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors text-lg"
            >
              {loading ? 'Redirecting...' : 'Subscribe with Stripe'}
            </button>
            <p className="text-center text-slate-500 text-xs mt-3">Secure payment via Stripe</p>
          </div>
        )}
      </div>
    </div>
  );
}
