import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Share, RefreshCw, Image, X, ZoomIn, Lock } from 'lucide-react';
import { api } from '../hooks/useApi';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0);
}

export default function CatalogPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const result = await api.getCatalog();
      if (result.success) setItems(result.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCatalog(); }, []);

  const handleDownload = async (r2Url: string) => {
    setDownloading(true);
    try {
      const downloadUrl = api.getCatalogImageUrl(r2Url);
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Failed');
      
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = 'produk-katalog.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
        setDownloading(false);
      }, 1000);
    } catch (err) {
      console.error('Download error:', err);
      window.open(r2Url, '_blank');
      setDownloading(false);
    }
  };

  const handleShareWhatsApp = (item: any) => {
    const text = `*${item.item_name}*\n\nHarga: ${formatCurrency(item.price)}\n\n${item.r2_url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a'}}>
      <header style={{padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <button onClick={() => navigate('/')} style={{padding: '0.75rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', borderRadius: '12px'}}><ArrowLeft size={24} /></button>
        <div style={{textAlign: 'center'}}><h1 style={{fontWeight: 700, fontSize: '1.25rem', color: 'white'}}>KATALOG</h1><p style={{fontSize: '0.875rem', color: '#94a3b8'}}>Produk Kami</p></div>
        <div style={{display: 'flex', gap: '0.5rem'}}>
          <button onClick={loadCatalog} disabled={loading} style={{padding: '0.75rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', borderRadius: '12px'}}><RefreshCw size={24} className={loading ? 'animate-spin' : ''} /></button>
          <button onClick={() => navigate('/katalog/login')} style={{padding: '0.75rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', borderRadius: '12px'}} title="Login Admin"><Lock size={24} /></button>
        </div>
      </header>
      <main style={{flex: 1, padding: '1rem'}}>
        {loading ? <div style={{textAlign: 'center', padding: '3rem', color: '#64748b'}}><RefreshCw size={32} className="animate-spin" /></div> :
         items.length === 0 ? <div style={{textAlign: 'center', padding: '3rem', color: '#64748b'}}><Image size={48} style={{margin: '0 auto 0.75rem', opacity: 0.5}} /><p>Belum ada produk</p></div> :
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem'}}>
            {items.map((item) => (
              <div key={item.id} style={{background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer'}} onClick={() => setSelectedItem(item)}>
                <img src={item.r2_url} alt={item.item_name} style={{width: '100%', aspectRatio: '1', objectFit: 'cover'}} />
                <div style={{padding: '0.75rem'}}>
                  <p style={{fontWeight: 600, color: 'white', fontSize: '0.875rem', marginBottom: '0.25rem'}}>{item.item_name}</p>
                  <p style={{color: '#22c55e', fontWeight: 700, fontSize: '0.875rem'}}>{formatCurrency(item.price)}</p>
                </div>
              </div>
            ))}
          </div>}
      </main>

      {selectedItem && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'}}>
          <div style={{background: '#1e293b', borderRadius: '16px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflow: 'auto'}}>
            <div style={{padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <h3 style={{fontWeight: 600, color: 'white'}}>{selectedItem.item_name}</h3>
              <button onClick={() => setSelectedItem(null)} style={{padding: '0.5rem', color: '#64748b'}}><X size={20} /></button>
            </div>
            <img src={selectedItem.r2_url} alt={selectedItem.item_name} style={{width: '100%', aspectRatio: '1', objectFit: 'contain', background: '#000'}} />
            <div style={{padding: '1rem'}}>
              <p style={{fontSize: '1.5rem', fontWeight: 700, color: '#22c55e', marginBottom: '1rem'}}>{formatCurrency(selectedItem.price)}</p>
              <div style={{display: 'flex', gap: '0.75rem'}}>
                <button onClick={() => handleDownload(selectedItem.r2_url)} disabled={downloading} style={{flex: 1, padding: '0.875rem', background: downloading ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', borderRadius: '12px', color: downloading ? '#64748b' : 'white', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: downloading ? 'not-allowed' : 'pointer'}}>
                  {downloading ? <><RefreshCw size={20} className="animate-spin" />Mengunduh...</> : <><Download size={20} />Download</>}
                </button>
                <button onClick={() => handleShareWhatsApp(selectedItem)} style={{flex: 1, padding: '0.875rem', background: '#22c55e', borderRadius: '12px', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
                  <Share size={20} />WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}