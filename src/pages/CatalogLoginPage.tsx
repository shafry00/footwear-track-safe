import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'footwear123';
const OWNER_USER = 'danjuna';
const OWNER_PASS = 'jns123';

export default function CatalogLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if ((username === ADMIN_USER && password === ADMIN_PASS) || (username === OWNER_USER && password === OWNER_PASS)) {
      localStorage.setItem('catalog_auth', btoa(`${username}:${password}`));
      navigate('/katalog/admin');
    } else {
      setError('Username atau password salah');
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', alignItems: 'center', justifyContent: 'center', padding: '1rem'}}>
      <div style={{width: '100%', maxWidth: '28rem'}}>
        <div style={{textAlign: 'center', marginBottom: '2rem'}}>
          <div style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '72px', height: '72px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '20px', marginBottom: '1rem', boxShadow: '0 8px 32px rgba(99,102,241,0.4)'}}>
            <Lock size={36} color="white" />
          </div>
          <h1 style={{fontFamily: 'system-ui', fontSize: '1.5rem', fontWeight: 800, color: 'white'}}>KATALOG ADMIN</h1>
          <p style={{color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem'}}>Login untuk upload produk</p>
        </div>
        
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {error && <div style={{background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.875rem', textAlign: 'center'}}>{error}</div>}
          
          <div style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div><label style={{fontSize: '0.875rem', color: '#cbd5e1', display: 'block', marginBottom: '0.5rem'}}>Username</label><input type="text" className="input" required value={username} onChange={(e) => setUsername(e.target.value)} /></div>
            <div><label style={{fontSize: '0.875rem', color: '#cbd5e1', display: 'block', marginBottom: '0.5rem'}}>Password</label><input type="password" className="input" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          </div>
          
          <button type="submit" disabled={loading} className="btn btn-primary" style={{width: '100%'}}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Lock size={20} />}
            <span style={{marginLeft: '0.5rem'}}>Login</span>
          </button>
          
          <button type="button" onClick={() => navigate('/')} style={{padding: '0.875rem', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#94a3b8', fontWeight: 500}}>Kembali</button>
        </form>
      </div>
    </div>
  );
}