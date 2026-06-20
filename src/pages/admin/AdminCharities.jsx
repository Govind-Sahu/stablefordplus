import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { charities as charitiesApi } from '../../lib/api';

const emptyCharity = { name: '', description: '', image_url: '', website_url: '', featured: false, events: [], active: true };

export default function AdminCharities() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editCharity, setEditCharity] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [message, setMessage] = useState('');

  const fetchCharities = () => {
    charitiesApi.list().then(({ charities }) => setCharities(charities)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCharities(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      if (isNew) {
        await charitiesApi.create(editCharity);
        setMessage('Charity created');
      } else {
        await charitiesApi.update(editCharity.id, editCharity);
        setMessage('Charity updated');
      }
      setEditCharity(null);
      setIsNew(false);
      fetchCharities();
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Archive this charity? It will be hidden from users.')) return;
    try {
      await charitiesApi.delete(id);
      fetchCharities();
      setMessage('Charity archived');
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
            </Link>
            <h1 className="text-3xl font-black">Charity Management</h1>
          </div>
          <button
            onClick={() => { setEditCharity({ ...emptyCharity }); setIsNew(true); }}
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Add Charity
          </button>
        </div>

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl px-5 py-3 mb-6 flex justify-between items-center">
            <span>{message}</span>
            <button onClick={() => setMessage('')}>✕</button>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl h-48 animate-pulse" />)
          ) : charities.map(charity => (
            <div key={charity.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              {charity.image_url && (
                <img src={charity.image_url} alt={charity.name} className="w-full h-36 object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-bold">{charity.name}</h3>
                  {charity.featured && (
                    <span className="text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full">Featured</span>
                  )}
                </div>
                <p className="text-slate-400 text-sm line-clamp-2 mb-4">{charity.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditCharity({ ...charity }); setIsNew(false); }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-sm py-2 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(charity.id)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg transition-colors"
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Edit/Create modal */}
        {editCharity && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg my-4">
              <h2 className="text-xl font-bold mb-5">{isNew ? 'Add New Charity' : 'Edit Charity'}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Name *</label>
                  <input
                    type="text"
                    value={editCharity.name}
                    onChange={e => setEditCharity(c => ({ ...c, name: e.target.value }))}
                    required
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Description *</label>
                  <textarea
                    value={editCharity.description}
                    onChange={e => setEditCharity(c => ({ ...c, description: e.target.value }))}
                    required
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={editCharity.image_url || ''}
                    onChange={e => setEditCharity(c => ({ ...c, image_url: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={editCharity.website_url || ''}
                    onChange={e => setEditCharity(c => ({ ...c, website_url: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={editCharity.featured || false}
                    onChange={e => setEditCharity(c => ({ ...c, featured: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <label htmlFor="featured" className="text-sm text-slate-300">Featured charity (shown on homepage)</label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setEditCharity(null); setIsNew(false); }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors"
                  >
                    {editLoading ? 'Saving...' : (isNew ? 'Add Charity' : 'Save Changes')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
