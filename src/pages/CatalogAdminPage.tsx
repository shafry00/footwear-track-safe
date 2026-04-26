import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Camera, Loader2, RefreshCw, X, Trash2, Image } from 'lucide-react';
import { api } from '../hooks/useApi';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0);
}

export default function CatalogAdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ item_name: '', price: '' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const result = await api.getCatalog();
      if (result.success) setItems(result.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCatalog(); }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setPhoto(file); setPhotoPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!photo || !form.item_name || !form.price) {
      setError('Semua field wajib diisi'); return;
    }
    setUploading(true);
    try {
      await api.uploadCatalogItem(form.item_name, parseFloat(form.price), photo, 'admin');
      setSuccess('Item berhasil ditambahkan!');
      setForm({ item_name: '', price: '' });
      setPhoto(null);
      setPhotoPreview(null);
      loadCatalog();
    } catch (err: any) {
      setError(err.message || 'Gagal upload');
    }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus item ini?')) return;
    try {
      await api.deleteCatalogItem(id);
      loadCatalog();
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a'}}>
      <header style={{padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <button onClick={() => navigate('/')} style={{padding: '0.75rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', borderRadius: '12px'}}><ArrowLeft size={24} /></button>
        <div style={{textAlign: 'center'}}><h1 style={{fontWeight: 700, fontSize: '1.25rem', color: 'white'}}>KATALOG</h1><p style={{fontSize: '0.875rem', color: '#94a3b8'}}>Tambah Produk</p></div>
        <button onClick={loadCatalog} disabled={loading} style={{padding: '0.75rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', borderRadius: '12px'}}><RefreshCw size={24} className={loading ? 'animate-spin' : ''} /></button>
      </header>
      <main style={{flex: 1, padding: '1rem'}}>
        <div style={{maxWidth: '28rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {error && <div style={{background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.875rem'}}>{error}</div>}
            {success && <div style={{background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.875rem'}}>{success}</div>}
            <div className="card" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <h3 style={{fontWeight: 600, color: 'white'}}>Tambah Produk Baru</h3>
              <div><label className="label">Nama Produk</label><input type="text" className="input" required value={form.item_name} onChange={(e) => setForm({...form, item_name: e.target.value})} /></div>
              <div><label className="label">Harga</label><input type="number" className="input" required min="1" placeholder="50000" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} /></div>
            </div>
            <div className="card" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <h3 style={{fontWeight: 600, color: 'white'}}>Foto Produk</h3>
              <label style={{cursor: 'pointer'}}>
                <input type="file" accept="image/*" capture="environment" style={{display: 'none'}} onChange={handlePhotoChange} />
                {photoPreview ? <div style={{aspectRatio: '1', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', overflow: 'hidden'}}><img src={photoPreview} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'cover'}} /></div> : <div style={{aspectRatio: '1', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}><Camera size={32} style={{color: '#64748b'}} /><span style={{fontSize: '0.875rem', color: '#64748b'}}>Ambil foto / Pilih dari galeri</span></div>}
              </label>
            </div>
            <button type="submit" disabled={uploading} className="btn btn-primary" style={{width: '100%'}}>
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <><Upload size={20} />Simpan Produk</>}
            </button>
          </form>

          <div className="card" style={{padding: 0, overflow: 'hidden'}}>
            <div style={{padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)'}}><h3 style={{fontWeight: 600, color: 'white'}}>Produk ({items.length})</h3></div>
            {items.length === 0 ? <div style={{padding: '2rem', textAlign: 'center', color: '#64748b'}}>Belum ada produk</div> :
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem'}}>
                {items.map((item) => (
                  <div key={item.id} style={{background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
                    <img src={item.r2_url} alt={item.item_name} style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px'}} />
                    <div style={{flex: 1}}>
                      <p style={{fontWeight: 500, color: '#fff'}}>{item.item_name}</p>
                      <p style={{fontSize: '0.875rem', color: '#22c55e', fontWeight: 600}}>{formatCurrency(item.price)}</p>
                    </div>
                    <button onClick={() => handleDelete(item.id)} style={{padding: '0.5rem', background: 'rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444'}}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>}
          </div>
        </div>
      </main>
    </div>
  );
}