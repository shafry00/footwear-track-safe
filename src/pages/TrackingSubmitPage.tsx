import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Loader2, CheckCircle } from 'lucide-react';
import { trackingApi } from '../hooks/useApi';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0);
}

export default function TrackingSubmitPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ item_name: '', modal_price: '', ordered_by: '' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const auth = localStorage.getItem('tracking_auth');
    if (!auth) navigate('/tracking');
  }, [navigate]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setPhoto(file); setPhotoPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setLoading(true);
    try {
      await trackingApi.submitOrder({
        item_name: form.item_name,
        modal_price: parseFloat(form.modal_price),
        ordered_by: form.ordered_by,
        file: photo || undefined,
      });
      setSuccess('Order submitted!');
      setForm({ item_name: '', modal_price: '', ordered_by: '' });
      setPhoto(null);
      setPhotoPreview(null);
    } catch (err: any) { 
      setSuccess(err.message || 'Gagal submit order'); 
    }
    finally { setLoading(false); }
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a'}}>
      <header style={{padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <button onClick={() => navigate('/tracking/menu')} style={{padding: '0.75rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', borderRadius: '12px'}}><ArrowLeft size={24} /></button>
        <div style={{textAlign: 'center'}}><h1 style={{fontWeight: 700, fontSize: '1.25rem', color: 'white'}}>SUBMIT ORDER</h1><p style={{fontSize: '0.875rem', color: '#94a3b8'}}>Input barang yang dipesan</p></div>
        <div style={{width: '48px'}} />
      </header>
      <main style={{flex: 1, padding: '1rem'}}>
        <div style={{maxWidth: '28rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {success && <div style={{background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><CheckCircle size={16} />{success}</div>}
            <div className="card" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <h3 style={{fontWeight: 600, color: 'white'}}>Data Order</h3>
              <div><label className="label">Nama Barang</label><input type="text" className="input" required value={form.item_name} onChange={(e) => setForm({...form, item_name: e.target.value})} /></div>
              <div><label className="label">Harga Modal</label><input type="number" className="input" required min="1" placeholder="50000" value={form.modal_price} onChange={(e) => setForm({...form, modal_price: e.target.value})} /></div>
              <div><label className="label">Ordered By</label><input type="text" className="input" required value={form.ordered_by} onChange={(e) => setForm({...form, ordered_by: e.target.value})} placeholder="Nama Anda" /></div>
            </div>
            <div className="card" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <h3 style={{fontWeight: 600, color: 'white'}}>Foto Barang</h3>
              <label style={{cursor: 'pointer'}}>
                <input type="file" accept="image/*" capture="environment" style={{display: 'none'}} onChange={handlePhotoChange} />
                {photoPreview ? <div style={{aspectRatio: '1', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', overflow: 'hidden'}}><img src={photoPreview} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'cover'}} /></div> : <div style={{aspectRatio: '1', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}><Camera size={32} style={{color: '#64748b'}} /><span style={{fontSize: '0.875rem', color: '#64748b'}}>Ambil foto / Pilih dari galeri</span></div>}
              </label>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{width: '100%'}}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : <>Submit Order</>}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}