import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '../hooks/useApi';

export default function OwnerLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api.verifyOwner(username, password);
      if (result.authenticated) { localStorage.setItem('owner_auth', btoa(`${username}:${password}`)); navigate('/owner/dashboard'); }
      else setError('Username atau password salah');
    } catch (err: any) { setError(err.message || 'Gagal login'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'}}>
      <header style={{padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <button onClick={() => navigate('/')} style={{padding: '0.75rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', borderRadius: '12px'}}><ArrowLeft size={24} /></button>
        <h1 style={{fontSize: '1.25rem', fontWeight: 700, color: 'white'}}>LOGIN OWNER</h1>
        <div style={{width: '48px'}} />
      </header>
      <main style={{flex: 1, padding: '2rem 1.5rem'}}>
        <div style={{maxWidth: '28rem', margin: '0 auto'}}>
          <div className="card" style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
              <div style={{background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', padding: '0.75rem', borderRadius: '12px'}}><Lock size={24} color="white" /></div>
              <div><h2 style={{fontWeight: 700, color: 'white'}}>LOGIN OWNER</h2><p style={{fontSize: '0.875rem', color: '#64748b'}}>Akses Dashboard</p></div>
            </div>
            <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {error && <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.875rem'}}><AlertCircle size={16} />{error}</div>}
              <div><label className="label">Username</label><input type="text" className="input" required value={username} onChange={(e) => setUsername(e.target.value)} /></div>
              <div><label className="label">Password</label><div style={{position: 'relative'}}><input type={showPassword ? 'text' : 'password'} className="input" style={{paddingRight: '2.5rem'}} required value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" onClick={() => setShowPassword(!showPassword)} style={{position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', padding: '0.25rem', color: '#64748b'}}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{width: '100%'}}>{loading ? <Loader2 size={20} className="animate-spin" /> : <><Lock size={20} />Login</>}</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}