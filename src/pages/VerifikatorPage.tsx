import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, Search, ArrowLeft, CheckCircle } from 'lucide-react';
import { api, Transaction } from '../hooks/useApi';

export default function VerifikatorPage() {
  const navigate = useNavigate();
  const picName = localStorage.getItem('pic_name') || '';
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showList, setShowList] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => { loadTransactions(); }, []);
  const loadTransactions = async () => {
    try { const result = await api.getTransactions(); setTransactions(result.data.filter(t => t.status === 'packed')); }
    catch { console.error('Failed to load'); }
  };

  const handleApprove = async () => {
    if (!selectedId) { setSuccess('Pilih transaksi terlebih dahulu'); return; }
    setSuccess('');
    setLoading(true);
    try { 
      await api.approveTransaction({ transaction_id: selectedId, pic_name: picName });
      setSuccess('Transaksi berhasil diverifikasi!');
      setTimeout(() => { navigate('/'); }, 1500);
    } catch (err: any) { setSuccess(err.message); }
    finally { setLoading(false); }
  };

  const selectedTx = transactions.find(t => t.id === selectedId);

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a'}}>
      <header style={{padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <button onClick={() => navigate('/')} style={{padding: '0.75rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', borderRadius: '12px'}}><ArrowLeft size={24} /></button>
        <div style={{textAlign: 'center'}}><h1 style={{fontWeight: 700, fontSize: '1.25rem', color: 'white'}}>VERIFIKATOR</h1><p style={{fontSize: '0.875rem', color: '#94a3b8'}}>Verifikasi Order</p></div>
        <div style={{width: '48px'}} />
      </header>
      <main style={{flex: 1, padding: '1rem'}}>
        <div style={{maxWidth: '28rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {success && <div style={{background: success.includes('berhasil') ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${success.includes('berhasil') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, color: success.includes('berhasil') ? '#22c55e' : '#f87171', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><CheckCircle size={16} />{success}</div>}
          <div className="card">
            <button onClick={() => setShowList(true)} style={{display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', width: '100%'}}>
              <Search size={20} style={{color: '#64748b'}} />
              <span style={{flex: 1, textAlign: 'left', color: selectedTx ? '#fff' : '#64748b'}}>{selectedTx ? `${selectedTx.customer_name} - ${selectedTx.ekspedisi}` : 'Pilih Transaksi untuk Verifikasi...'}</span>
            </button>
          </div>
          {showList && <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-end'}}>
            <div style={{background: '#1e293b', width: '100%', maxHeight: '80vh', borderRadius: '1rem 1rem 0 0'}}>
              <div style={{padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <h3 style={{fontWeight: 600, color: 'white'}}>Pilih Transaksi</h3>
                <button onClick={() => setShowList(false)} style={{color: '#6366f1', fontSize: '0.875rem'}}>Tutup</button>
              </div>
              <div style={{padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '60vh', overflowY: 'auto'}}>
                {transactions.length === 0 ? <p style={{textAlign: 'center', color: '#64748b', padding: '2rem'}}>Tidak ada transaksi perlu verifikasi</p> :
                  transactions.map(tx => <button key={tx.id} onClick={() => {setSelectedId(tx.id); setShowList(false);}} style={{padding: '0.875rem', textAlign: 'left', background: 'rgba(255,255,255,0.05)', borderRadius: '12px'}}><p style={{fontWeight: 500, color: '#fff'}}>{tx.customer_name}</p><p style={{fontSize: '0.875rem', color: '#64748b'}}>{tx.ekspedisi} - Qty: {tx.total_qty} - Rp {(tx.total_harga||0).toLocaleString('id-ID')}</p></button>)}
              </div>
            </div>
          </div>}
          {selectedTx && <div className="card animate-fade-in" style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
            <h3 style={{fontWeight: 600, color: 'white'}}>Detail Transaksi</h3>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem'}}>
              <div><p style={{color: '#64748b'}}>Customer</p><p style={{fontWeight: 500, color: '#fff'}}>{selectedTx.customer_name}</p></div>
              <div><p style={{color: '#64748b'}}>HP</p><p style={{fontWeight: 500, color: '#fff'}}>{selectedTx.hp}</p></div>
              <div><p style={{color: '#64748b'}}>Ekspedisi</p><p style={{fontWeight: 500, color: '#fff'}}>{selectedTx.ekspedisi}</p></div>
              <div><p style={{color: '#64748b'}}>Qty</p><p style={{fontWeight: 500, color: '#fff'}}>{selectedTx.total_qty}</p></div>
              <div style={{gridColumn: 'span 2'}}><p style={{color: '#64748b'}}>Total Harga</p><p style={{fontWeight: 500, color: '#fff'}}>Rp {(selectedTx.total_harga||0).toLocaleString('id-ID')}</p></div>
            </div>
          </div>}
          <button onClick={handleApprove} disabled={loading || !selectedId} className="btn btn-primary" style={{width: '100%'}}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : <><CheckCircle2 size={20} />APPROVE</>}
          </button>
        </div>
      </main>
    </div>
  );
}