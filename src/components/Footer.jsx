import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" strokeWidth="2.5"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
                </svg>
              </div>
              <span className="font-bold text-white text-lg">Stableford<span className="text-emerald-400">+</span></span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Golf performance tracking meets charitable giving. Every score entered, every draw played — a portion goes to causes that matter.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Platform</h4>
            <ul className="space-y-2">
              {[
                { to: '/charities', label: 'Charities' },
                { to: '/draws', label: 'Monthly Draw' },
                { to: '/winners', label: 'Winners' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-slate-400 hover:text-emerald-400 text-sm transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Account</h4>
            <ul className="space-y-2">
              {[
                { to: '/register', label: 'Get Started' },
                { to: '/login', label: 'Sign In' },
                { to: '/dashboard', label: 'Dashboard' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-slate-400 hover:text-emerald-400 text-sm transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-slate-500 text-sm">© 2024 Stableford+. All rights reserved.</p>
          <p className="text-slate-600 text-xs">Track. Give. Win.</p>
        </div>
      </div>
    </footer>
  );
}
