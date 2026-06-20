import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { charities as charitiesApi, draws as drawsApi } from '../lib/api';

function StatCard({ number, label }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-white mb-1">{number}</div>
      <div className="text-slate-400 text-sm">{label}</div>
    </div>
  );
}

function Step({ number, title, description }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function PrizeTier({ match, percent, jackpot }) {
  return (
    <div className={`rounded-2xl p-6 border ${jackpot ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/50'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-2xl font-bold ${jackpot ? 'text-emerald-400' : 'text-white'}`}>
          {match}-Number Match
        </span>
        {jackpot && (
          <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">JACKPOT</span>
        )}
      </div>
      <div className="text-4xl font-bold text-white mb-2">{percent}%</div>
      <div className="text-slate-400 text-sm">of monthly prize pool</div>
      {jackpot && <div className="text-emerald-400 text-xs mt-2">Rolls over if unclaimed</div>}
    </div>
  );
}

export default function Landing() {
  const [featuredCharities, setFeaturedCharities] = useState([]);
  const [currentDraw, setCurrentDraw] = useState(null);

  useEffect(() => {
    charitiesApi.list({ featured: true }).then(({ charities }) => setFeaturedCharities(charities)).catch(() => {});
    drawsApi.current().then(({ draw }) => setCurrentDraw(draw)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/30" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-3xl opacity-10" />
          <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-emerald-400 rounded-full blur-3xl opacity-10" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-sm font-medium">Monthly draw now open</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-tight mb-6">
              Play golf.<br />
              <span className="text-emerald-400">Change lives.</span><br />
              Win prizes.
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed mb-10 max-w-2xl">
              Track your Stableford scores, enter monthly prize draws, and automatically support a charity you believe in — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-lg px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
              >
                Start your journey
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </Link>
              <Link
                to="/charities"
                className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-lg px-8 py-4 rounded-xl transition-colors border border-slate-700"
              >
                See our charities
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-slate-900 border-y border-slate-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard number="£50k+" label="Total prize pool distributed" />
            <StatCard number="6" label="Charities supported" />
            <StatCard number="3" label="Prize tiers every month" />
            <StatCard number="10%+" label="Of every subscription to charity" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-emerald-400 text-sm font-semibold tracking-wider uppercase mb-4">How it works</div>
              <h2 className="text-4xl md:text-5xl font-black mb-6">Three simple steps to make every round count</h2>
              <p className="text-slate-400 mb-10">From the course to the cause — your golf scores do more than you think.</p>
              <div className="space-y-8">
                <Step
                  number="1"
                  title="Subscribe & choose your charity"
                  description="Pick a monthly or yearly plan. Select a charity you care about — a percentage of your subscription goes there automatically."
                />
                <Step
                  number="2"
                  title="Enter your Stableford scores"
                  description="After each round, log your score (1–45). Keep your rolling 5-score record updated to stay eligible for draws."
                />
                <Step
                  number="3"
                  title="Enter the monthly draw"
                  description="Your scores become your draw entries. Match 3, 4 or 5 numbers to win a share of the monthly prize pool — jackpots roll over."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <PrizeTier match={5} percent={40} jackpot={true} />
              <PrizeTier match={4} percent={35} jackpot={false} />
              <PrizeTier match={3} percent={25} jackpot={false} />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Charities */}
      {featuredCharities.length > 0 && (
        <section className="py-24 bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="text-emerald-400 text-sm font-semibold tracking-wider uppercase mb-3">Our partners</div>
              <h2 className="text-4xl font-black mb-4">Charities in the spotlight</h2>
              <p className="text-slate-400 max-w-xl mx-auto">Every subscription contributes. Every draw played supports the cause you choose.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {featuredCharities.slice(0, 2).map(charity => (
                <Link
                  key={charity.id}
                  to={`/charities/${charity.id}`}
                  className="group relative overflow-hidden rounded-2xl bg-slate-800 border border-slate-700 hover:border-emerald-500/50 transition-all duration-300"
                >
                  {charity.image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={charity.image_url}
                        alt={charity.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2 py-1 rounded-full mb-3">
                      Featured Partner
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2 group-hover:text-emerald-400 transition-colors">{charity.name}</h3>
                    <p className="text-slate-400 text-sm line-clamp-2">{charity.description}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center">
              <Link
                to="/charities"
                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
              >
                Explore all charities
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900/40 border border-emerald-500/20 rounded-3xl p-12">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Ready to make your<br />
              <span className="text-emerald-400">game matter?</span>
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              Join thousands of golfers who track their scores, support charity, and compete for monthly prizes.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xl px-10 py-5 rounded-xl transition-all duration-200 shadow-2xl shadow-emerald-500/30"
            >
              Subscribe now
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </Link>
            <p className="text-slate-500 text-sm mt-5">Monthly & yearly plans available. Cancel anytime.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
