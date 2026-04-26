import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, Loader2, ArrowLeft, CheckCircle, Package } from 'lucide-react';
import { api } from '../hooks/useApi';

export default function BarangTitipanPage() {
  const navigate = useNavigate();
  const picName = localStorage.getItem('pic_name') || '';
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ customer_name: '', store_name: '', quantity: '' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setPhoto(file); setPhotoPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setLoading(true);
    try {
      const result = await api.createDeposit({
        customer_name: form.customer_name,
        store_name: form.store_name,
        quantity: parseInt(form.quantity) || 0,
        pic_name: picName
      });
      
      let successMsg = 'Barang titipan berhasil dicatat!';
      
      if (photo) {
        try {
          await api.uploadDepositPhoto(photo, result.deposit_id);
          successMsg = 'Barang titipan & foto berhasil disimpan!';
        } catch (photoErr: any) {
          console.error('Foto error:', photoErr);
        }
      }
      
      setSuccess(successMsg);
      setTimeout(() => navigate('/'), 1500);
      
    } catch (err: any) { 
      setSuccess(err.message || 'Gagal mencatat barang titipan'); 
    }
    finally { setLoading(false); }
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a'}}>
      <header style={{padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <button onClick={() => navigate('/')} style={{padding: '0.75rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', borderRadius: '12px'}}><ArrowLeft size={24} /></button>
        <div style={{textAlign: 'center'}}><h1 style={{fontWeight: 700, fontSize: '1.25rem', color: 'white'}}>BARANG TITIPAN</h1><p style={{fontSize: '0.875rem', color: '#94a3b8'}}>Catat Barang Titipan</p></div>
        <div style={{width: '48px'}} />
      </header>
      <main style={{flex: 1, padding: '1rem'}}>
        <div style={{maxWidth: '28rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {success && <div style={{background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><CheckCircle size={16} />{success}</div>}
            <div className="card" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <h3 style={{fontWeight: 600, color: 'white'}}>Data Barang Titipan</h3>
              <div><label className="label">Nama Customer</label><input type="text" className="input" required value={form.customer_name} onChange={(e) => setForm({...form, customer_name: e.target.value})} /></div>
              <div><label className="label">Store Penitip</label><input type="text" className="input" required value={form.store_name} onChange={(e) => setForm({...form, store_name: e.target.value})} /></div>
              <div><label className="label">Quantity (pcs)</label><input type="number" className="input" required min="1" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} /></div>
            </div>
            <div className="card" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <h3 style={{fontWeight: 600, color: 'white'}}>Foto Barang (Opsional)</h3>
              <label style={{cursor: 'pointer'}}>
                <input type="file" accept="image/*" capture="environment" style={{display: 'none'}} onChange={handlePhotoChange} />
                {photoPreview ? <div style={{aspectRatio: '16/9', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', overflow: 'hidden'}}><img src={photoPreview} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'contain'}} /></div> : <div style={{aspectRatio: '16/9', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}><Camera size={32} style={{color: '#64748b'}} /><span style={{fontSize: '0.875rem', color: '#64748b'}}>Ambil foto / Pilih dari galeri</span></div>}
              </label>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{width: '100%'}}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : <><Package size={20} />Simpan Barang Titipan</>}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}