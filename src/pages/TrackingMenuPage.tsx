import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, CheckCircle, LogOut } from 'lucide-react';

export default function TrackingMenuPage() {
  const navigate = useNavigate();

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a'}}>
      <header style={{padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <button onClick={() => { localStorage.removeItem('tracking_auth'); navigate('/'); }} style={{padding: '0.75rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', borderRadius: '12px'}}><LogOut size={24} /></button>
        <h1 style={{fontWeight: 700, fontSize: '1.25rem', color: 'white'}}>TRACKING ORDER</h1>
        <div style={{width: '48px'}} />
      </header>
      <main style={{flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center'}}>
        <button onClick={() => navigate('/tracking/submit')} style={{width: '100%', maxWidth: '24rem', padding: '2rem', background: 'linear-gradient(135deg, #f59e0b20, #f59e0b10)', border: '2px solid rgba(245,158,11,0.5)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer'}}>
          <div style={{background: '#f59e0b', padding: '1rem', borderRadius: '12px'}}><Package size={32} color="white" /></div>
          <div style={{textAlign: 'left'}}>
            <h3 style={{fontWeight: 700, color: 'white', fontSize: '1.125rem'}}>Submit Order</h3>
            <p style={{color: '#94a3b8', fontSize: '0.875rem'}}>Input barang yang dipesan</p>
          </div>
        </button>
        
        <button onClick={() => navigate('/tracking/diterima')} style={{width: '100%', maxWidth: '24rem', padding: '2rem', background: 'linear-gradient(135deg, #22c55e20, #22c55e10)', border: '2px solid rgba(34,197,94,0.5)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer'}}>
          <div style={{background: '#22c55e', padding: '1rem', borderRadius: '12px'}}><CheckCircle size={32} color="white" /></div>
          <div style={{textAlign: 'left'}}>
            <h3 style={{fontWeight: 700, color: 'white', fontSize: '1.125rem'}}>Order Diterima</h3>
            <p style={{color: '#94a3b8', fontSize: '0.875rem'}}>Konfirmasi barang sampai</p>
          </div>
        </button>
      </main>
    </div>
  );
}