import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Loader2, CheckCircle, Package } from 'lucide-react';
import { trackingApi } from '../hooks/useApi';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0);
}

export default function TrackingDiterimaPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const auth = localStorage.getItem('tracking_auth');
    if (!auth) { navigate('/tracking'); return; }
    loadOrders();
  }, [navigate]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const result = await trackingApi.getOrders();
      setOrders(result.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setPhoto(file); setPhotoPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSuccess('');
    setSubmitting(true);
    try {
      await trackingApi.markReceived({
        order_id: selectedOrder.id,
        received_by: 'procurement',
        file: photo || undefined,
      });
      setSuccess('Barang ditandai sudah diterima!');
      setPhoto(null);
      setPhotoPreview(null);
      setSelectedOrder(null);
      loadOrders();
    } catch (err: any) { 
      setSuccess(err.message || 'Gagal update'); 
    }
    finally { setSubmitting(false); }
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const receivedOrders = orders.filter(o => o.status === 'received');

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a'}}>
      <header style={{padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <button onClick={() => navigate('/tracking/menu')} style={{padding: '0.75rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', borderRadius: '12px'}}><ArrowLeft size={24} /></button>
        <div style={{textAlign: 'center'}}><h1 style={{fontWeight: 700, fontSize: '1.25rem', color: 'white'}}>ORDER DITERIMA</h1><p style={{fontSize: '0.875rem', color: '#94a3b8'}}>Konfirmasi barang sampai</p></div>
        <button onClick={loadOrders} disabled={loading} style={{padding: '0.75rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.1)', borderRadius: '12px'}}>↻</button>
      </header>
      <main style={{flex: 1, padding: '1rem'}}>
        {success && <div style={{background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><CheckCircle size={16} />{success}</div>}
        
        <div className="card" style={{marginBottom: '1.5rem'}}>
          <h3 style={{fontWeight: 600, color: 'white', marginBottom: '1rem'}}>Pending ({pendingOrders.length})</h3>
          {pendingOrders.length === 0 ? <p style={{color: '#64748b', textAlign: 'center', padding: '1rem'}}>Tidak ada order pending</p> :
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto'}}>
              {pendingOrders.map((order) => (
                <div key={order.id} onClick={() => setSelectedOrder(order)} style={{background: selectedOrder?.id === order.id ? 'rgba(245,158,11,0.2)' : 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '0.75rem', cursor: 'pointer', border: selectedOrder?.id === order.id ? '2px solid #f59e0b' : '2px solid transparent'}}>
                  <div style={{display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
                    {order.r2_url && <img src={order.r2_url} alt="" style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px'}} />}
                    <div style={{flex: 1}}>
                      <p style={{fontWeight: 500, color: '#fff'}}>{order.item_name}</p>
                      <p style={{fontSize: '0.875rem', color: '#f59e0b'}}>{formatCurrency(order.modal_price)}</p>
                      <p style={{fontSize: '0.75rem', color: '#64748b'}}>{order.ordered_by}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>}
        </div>

        {selectedOrder && (
          <form onSubmit={handleSubmit} className="card" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <h3 style={{fontWeight: 600, color: 'white'}}>Konfirmasi: {selectedOrder.item_name}</h3>
            <div><label className="label">Foto Barang Diterima</label>
              <label style={{cursor: 'pointer'}}>
                <input type="file" accept="image/*" capture="environment" style={{display: 'none'}} onChange={handlePhotoChange} />
                {photoPreview ? <div style={{aspectRatio: '1', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', overflow: 'hidden'}}><img src={photoPreview} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'cover'}} /></div> : <div style={{aspectRatio: '1', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}><Camera size={32} style={{color: '#64748b'}} /><span style={{fontSize: '0.875rem', color: '#64748b'}}>Ambil foto barang</span></div>}
              </label>
            </div>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{width: '100%'}}>
              {submitting ? <Loader2 size={20} className="animate-spin" /> : <><CheckCircle size={20} />Tandai Diterima</>}
            </button>
          </form>
        )}

        <div className="card">
          <h3 style={{fontWeight: 600, color: 'white', marginBottom: '1rem'}}>Received ({receivedOrders.length})</h3>
          {receivedOrders.length === 0 ? <p style={{color: '#64748b', textAlign: 'center', padding: '1rem'}}>Belum ada yang diterima</p> :
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              {receivedOrders.map((order) => (
                <div key={order.id} style={{background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
                  {order.received_photo ? <img src={order.received_photo} alt="" style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px'}} /> : order.r2_url ? <img src={order.r2_url} alt="" style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px'}} /> : <div style={{width: '50px', height: '50px', background: '#333', borderRadius: '8px'}} />}
                  <div style={{flex: 1}}>
                    <p style={{fontWeight: 500, color: '#fff'}}>{order.item_name}</p>
                    <p style={{fontSize: '0.875rem', color: '#22c55e'}}>{formatCurrency(order.modal_price)}</p>
                  </div>
                  <CheckCircle size={20} style={{color: '#22c55e'}} />
                </div>
              ))}
            </div>}
        </div>
      </main>
    </div>
  );
}