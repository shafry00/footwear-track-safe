import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { api } from '../hooks/useApi';

interface SalesStaff {
  id: number;
  name: string;
  role: string;
}

export default function SalesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<SalesStaff[]>([]);
  const [form, setForm] = useState({ customer_name: '', hp: '', alamat: '', ekspedisi: '', pic_name: '' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.getSalesStaff().then((res) => {
      if (res.success) setStaff(res.data);
    }).catch(console.error);
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setPhoto(file); setPhotoPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setLoading(true);
    try {
      await api.createSalesOrder({
        customer_name: form.customer_name,
        hp: form.hp,
        alamat: form.alamat,
        ekspedisi: form.ekspedisi,
        pic_name: form.pic_name,
        file: photo || undefined,
      });
      
      setSuccess('Order sales berhasil disimpan!');
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (err: any) { 
      setSuccess(err.message || 'Gagal membuat order'); 
    }
    finally { setLoading(false); }
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a'}}>
      <header style={{padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <button onClick={() => navigate('/')} style={{padding: '0.75rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', borderRadius: '12px'}}><ArrowLeft size={24} /></button>
        <div style={{textAlign: 'center'}}><h1 style={{fontWeight: 700, fontSize: '1.25rem', color: 'white'}}>SALES</h1><p style={{fontSize: '0.875rem', color: '#94a3b8'}}>Input Order Customer</p></div>
        <div style={{width: '48px'}} />
      </header>
      <main style={{flex: 1, padding: '1rem'}}>
        <div style={{maxWidth: '28rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {success && <div style={{background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><CheckCircle size={16} />{success}</div>}
            <div className="card" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <h3 style={{fontWeight: 600, color: 'white'}}>Data Customer</h3>
              <div><label className="label">Nama Customer</label><input type="text" className="input" required value={form.customer_name} onChange={(e) => setForm({...form, customer_name: e.target.value})} /></div>
              <div><label className="label">No HP</label><input type="tel" className="input" required value={form.hp} onChange={(e) => setForm({...form, hp: e.target.value})} /></div>
              <div><label className="label">Alamat</label><textarea className="input" style={{minHeight: '80px', resize: 'none'}} required value={form.alamat} onChange={(e) => setForm({...form, alamat: e.target.value})} /></div>
              <div><label className="label">Ekspedisi</label><input type="text" className="input" required value={form.ekspedisi} onChange={(e) => setForm({...form, ekspedisi: e.target.value})} /></div>
              <div>
                <label className="label">PIC Sales</label>
                <select className="input" required value={form.pic_name} onChange={(e) => setForm({...form, pic_name: e.target.value})}>
                  <option value="">Pilih PIC...</option>
                  {staff.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="card" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <h3 style={{fontWeight: 600, color: 'white'}}>Bukti Transfer</h3>
              <label style={{cursor: 'pointer'}}>
                <input type="file" accept="image/*" capture="environment" style={{display: 'none'}} onChange={handlePhotoChange} />
                {photoPreview ? <div style={{aspectRatio: '16/9', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', overflow: 'hidden'}}><img src={photoPreview} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'contain'}} /></div> : <div style={{aspectRatio: '16/9', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}><Camera size={32} style={{color: '#64748b'}} /><span style={{fontSize: '0.875rem', color: '#64748b'}}>Ambil foto / Pilih dari galeri</span></div>}
              </label>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{width: '100%'}}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : <><Upload size={20} />Simpan Order</>}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}