import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Package, Loader2, Search, ArrowLeft, CheckCircle } from 'lucide-react';
import { api, Transaction } from '../hooks/useApi';

export default function PackagingPage() {
  const navigate = useNavigate();
  const picName = localStorage.getItem('pic_name') || '';
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showList, setShowList] = useState(false);
  const [form, setForm] = useState({ jml_karung: '', jml_kardus: '', jml_plastik: '' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  useEffect(() => { loadTransactions(); }, []);
  const loadTransactions = async () => {
    try { const result = await api.getTransactions(); setTransactions(result.data.filter(t => t.status === 'pending' || t.status === 'packed')); }
    catch { console.error('Failed to load'); }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setPhoto(file); setPhotoPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) { setSuccess('Pilih transaksi terlebih dahulu'); return; }
    setSuccess('');
    setLoading(true);
    try {
      await api.updateInventory({ transaction_id: selectedId, jml_karung: parseInt(form.jml_karung)||0, jml_kardus: parseInt(form.jml_kardus)||0, jml_plastik: parseInt(form.jml_plastik)||0, pic_name: picName });
      let successMsg = 'Inventory berhasil diupdate!';
      if (photo) {
        try { await api.uploadPackedPhoto(photo, selectedId, picName); successMsg = 'Inventory & foto berhasil disimpan!'; } catch {}
      }
      setSuccess(successMsg);
      setTimeout(() => { navigate('/'); }, 1500);
    } catch (err: any) { setSuccess(err.message); }
    finally { setLoading(false); }
  };

  const selectedTx = transactions.find(t => t.id === selectedId);

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a'}}>
      <header style={{padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <button onClick={() => navigate('/')} style={{padding: '0.75rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', borderRadius: '12px'}}><ArrowLeft size={24} /></button>
        <div style={{textAlign: 'center'}}><h1 style={{fontWeight: 700, fontSize: '1.25rem', color: 'white'}}>PACKAGING</h1><p style={{fontSize: '0.875rem', color: '#94a3b8'}}>Input Jumlah Packing</p></div>
        <div style={{width: '48px'}} />
      </header>
      <main style={{flex: 1, padding: '1rem'}}>
        <div style={{maxWidth: '28rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {success && <div style={{background: success.includes('berhasil') ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${success.includes('berhasil') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, color: success.includes('berhasil') ? '#22c55e' : '#f87171', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><CheckCircle size={16} />{success}</div>}
          <div className="card">
            <button onClick={() => setShowList(true)} style={{display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', width: '100%'}}>
              <Search size={20} style={{color: '#64748b'}} />
              <span style={{flex: 1, textAlign: 'left', color: selectedTx ? '#fff' : '#64748b'}}>{selectedTx ? `${selectedTx.customer_name} - ${selectedTx.ekspedisi}` : 'Pilih Transaksi...'}</span>
            </button>
          </div>
          {showList && <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-end'}}>
            <div style={{background: '#1e293b', width: '100%', maxHeight: '80vh', borderRadius: '1rem 1rem 0 0'}}>
              <div style={{padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <h3 style={{fontWeight: 600, color: 'white'}}>Pilih Transaksi</h3>
                <button onClick={() => setShowList(false)} style={{color: '#6366f1', fontSize: '0.875rem'}}>Tutup</button>
              </div>
              <div style={{padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '60vh', overflowY: 'auto'}}>
                {transactions.length === 0 ? <p style={{textAlign: 'center', color: '#64748b', padding: '2rem'}}>Tidak ada transaksi pending</p> :
                  transactions.map(tx => <button key={tx.id} onClick={() => {setSelectedId(tx.id); setShowList(false);}} style={{padding: '0.875rem', textAlign: 'left', background: 'rgba(255,255,255,0.05)', borderRadius: '12px'}}><p style={{fontWeight: 500, color: '#fff'}}>{tx.customer_name}</p><p style={{fontSize: '0.875rem', color: '#64748b'}}>{tx.ekspedisi} - Qty: {tx.total_qty}</p></button>)}
              </div>
            </div>
          </div>}
          <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <div className="card" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <h3 style={{fontWeight: 600, color: 'white'}}>Jumlah Packaging</h3>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem'}}>
                <div><label className="label">Karung</label><input type="number" className="input" style={{textAlign: 'center'}} min="0" value={form.jml_karung} onChange={(e) => setForm({...form, jml_karung: e.target.value})} /></div>
                <div><label className="label">Kardus</label><input type="number" className="input" style={{textAlign: 'center'}} min="0" value={form.jml_kardus} onChange={(e) => setForm({...form, jml_kardus: e.target.value})} /></div>
                <div><label className="label">Plastik</label><input type="number" className="input" style={{textAlign: 'center'}} min="0" value={form.jml_plastik} onChange={(e) => setForm({...form, jml_plastik: e.target.value})} /></div>
              </div>
            </div>
            <div className="card" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <h3 style={{fontWeight: 600, color: 'white'}}>Foto Barang Sudah Dipacking</h3>
              <label style={{cursor: 'pointer'}}>
                <input type="file" accept="image/*" capture="environment" style={{display: 'none'}} onChange={handlePhotoChange} />
                {photoPreview ? <div style={{aspectRatio: '16/9', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', overflow: 'hidden'}}><img src={photoPreview} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'contain'}} /></div> : <div style={{aspectRatio: '16/9', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}><Camera size={32} style={{color: '#64748b'}} /><span style={{fontSize: '0.875rem', color: '#64748b'}}>Ambil foto setelah packing</span></div>}
              </label>
            </div>
            <button type="submit" disabled={loading || !selectedId} className="btn btn-primary" style={{width: '100%'}}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : <><Package size={20} />Update Packaging</>}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}