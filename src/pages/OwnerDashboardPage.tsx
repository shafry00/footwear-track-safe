import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, AlertTriangle, RefreshCw, Package, CheckCircle2, Truck, Clock, ArrowLeft, X, Image, Archive, ChevronDown, ChevronUp, Calendar, BarChart3, TrendingUp, DollarSign } from 'lucide-react';
import { api } from '../hooks/useApi';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#f59e0b' },
  packed: { label: 'Packed', color: '#3b82f6' },
  verified: { label: 'Verified', color: '#22c55e' },
  shipped: { label: 'Shipped', color: '#a855f7' },
};

const PHOTO_LABELS: Record<string, { label: string; color: string }> = {
  initial: { label: 'Invoice/Barang Awal', color: '#0ea5e9' },
  packed: { label: 'Barang Packed', color: '#8b5cf6' },
  delivery_before: { label: 'Sebelum Diantar', color: '#f59e0b' },
  delivery_after: { label: 'Bukti Ekspedisi', color: '#10b981' },
};

function formatDateTime(isoString: string) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0);
}

export default function OwnerDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [showDeposits, setShowDeposits] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null);
  const [depositPhotos, setDepositPhotos] = useState<any[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [showSales, setShowSales] = useState(false);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportPeriod, setReportPeriod] = useState('daily');
  const [showReports, setShowReports] = useState(false);

const loadDashboard = async () => {
    const auth = localStorage.getItem('owner_auth');
    if (!auth) { navigate('/owner'); return; }
    setLoading(true);
    try {
      const result = await api.getDashboard(auth, startDate || undefined, endDate || undefined);
      setTimeline(result.data.timeline);
      setDeposits(result.data.deposits || []);
      setStats({ ...result.data.summary, total_karung_ready: result.data.karung_count, alert_threshold: 7, needs_alert: result.data.karung_count >= 7 });
      
      const reportsResult = await api.getReports(auth, reportPeriod);
      setReports(reportsResult.data);
      
      const salesResult = await api.getSalesOrders(auth, startDate || undefined, endDate || undefined);
      setSalesOrders(salesResult.data);
    } catch { localStorage.removeItem('owner_auth'); navigate('/owner'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadDashboard(); }, []);

  const handleRefresh = async () => { setRefreshing(true); await loadDashboard(); setRefreshing(false); };
  const handleLogout = () => { localStorage.removeItem('owner_auth'); navigate('/owner'); };

  const handleViewTransaction = async (item: any) => {
    setSelectedTransaction(item);
    setPhotosLoading(true);
    try {
      const auth = localStorage.getItem('owner_auth');
      const result = await fetch(`${import.meta.env.VITE_API_URL}/api/owner/photos/${item.id}`, {
        headers: { Authorization: `Basic ${auth}` }
      });
      const data = await result.json();
      if (data.success) setPhotos(data.data);
    } catch {}
    finally { setPhotosLoading(false); }
  };

  const handleViewDeposit = async (item: any) => {
    setSelectedDeposit(item);
    try {
      const auth = localStorage.getItem('owner_auth');
      const result = await fetch(`${import.meta.env.VITE_API_URL}/api/owner/deposit/photos/${item.id}`, {
        headers: { Authorization: `Basic ${auth}` }
      });
      const data = await result.json();
      if (data.success) setDepositPhotos(data.data);
    } catch {}
    finally { }
  };

  if (loading) return <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a'}}><RefreshCw size={32} className="animate-spin" style={{color: '#6366f1'}} /></div>;

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a'}}>
      <header style={{padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
        <div style={{maxWidth: '80rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div><h1 style={{fontWeight: 700, color: 'white'}}>FOOTWEAR<span style={{background: 'linear-gradient(135deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>TRACK</span></h1><p style={{fontSize: '0.75rem', color: '#64748b'}}>Dashboard Owner</p></div>
          <div style={{display: 'flex', gap: '0.5rem'}}>
            <button onClick={() => setShowReports(!showReports)} style={{padding: '0.75rem', borderRadius: '12px', background: showReports ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.1)', color: '#ffffff'}}><BarChart3 size={24} /></button>
            <button onClick={handleRefresh} disabled={refreshing} style={{padding: '0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: '#ffffff'}}><RefreshCw size={24} className={refreshing ? 'animate-spin' : ''} /></button>
            <button onClick={handleLogout} style={{padding: '0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: '#ffffff'}}><LogOut size={24} /></button>
          </div>
        </div>
      </header>
      <main style={{flex: 1, padding: '1rem'}}>
        <div style={{maxWidth: '80rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          
          <div className="card" style={{padding: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ffffff'}}><Calendar size={24} /><span style={{fontWeight: 600, color: '#ffffff', fontSize: '1.125rem'}}>Filter Tanggal</span></div>
            <div><label style={{fontSize: '0.875rem', color: '#cbd5e1', display: 'block', marginBottom: '0.375rem'}}>Dari</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: 'white', fontSize: '1rem', colorScheme: 'dark'}} /></div>
            <div><label style={{fontSize: '0.875rem', color: '#cbd5e1', display: 'block', marginBottom: '0.375rem'}}>Sampai</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: 'white', fontSize: '1rem', colorScheme: 'dark'}} /></div>
            <button onClick={loadDashboard} style={{padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '10px', color: 'white', fontWeight: 600, fontSize: '1rem', boxShadow: '0 4px 12px rgba(99,102,241,0.4)'}}>Terapkan</button>
            {(startDate || endDate) && <button onClick={() => { setStartDate(''); setEndDate(''); loadDashboard(); }} style={{padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '10px', color: '#cbd5e1', fontWeight: 500, fontSize: '1rem'}}>Clear</button>}
          </div>
          
          {showReports && reports && (
            <div className="card" style={{padding: '1rem'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'white', fontWeight: 600}}><BarChart3 size={22} />Laporan {reportPeriod === 'daily' ? 'Harian' : reportPeriod === 'weekly' ? 'Mingguan' : 'Bulanan'}</div>
              <div style={{display: 'flex', gap: '0.5rem', marginBottom: '1rem'}}>
                {['daily', 'weekly', 'monthly'].map(p => (
                  <button key={p} onClick={async () => { setReportPeriod(p); const auth = localStorage.getItem('owner_auth'); if (auth) { const r = await api.getReports(auth, p, startDate || undefined, endDate || undefined); setReports(r.data); } }} style={{padding: '0.5rem 1rem', background: reportPeriod === p ? '#6366f1' : 'rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.875rem'}}>{p === 'daily' ? 'Harian' : p === 'weekly' ? 'Mingguan' : 'Bulanan'}</button>
                ))}
                {startDate && <span style={{color: '#64748b', fontSize: '0.75rem', alignSelf: 'center'}}>{startDate} s/d {endDate}</span>}
              </div>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem'}}>
                <div style={{background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px'}}><p style={{fontSize: '0.75rem', color: '#64748b'}}>Transaksi</p><p style={{fontSize: '1.5rem', fontWeight: 700, color: 'white'}}>{reports.transactions?.total || 0}</p></div>
                <div style={{background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px'}}><p style={{fontSize: '0.75rem', color: '#64748b'}}>Qty Terjual</p><p style={{fontSize: '1.5rem', fontWeight: 700, color: 'white'}}>{reports.transactions?.qty || 0}</p></div>
                <div style={{background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px'}}><p style={{fontSize: '0.75rem', color: '#64748b'}}>Revenue</p><p style={{fontSize: '1.5rem', fontWeight: 700, color: '#22c55e'}}>{formatCurrency(reports.transactions?.revenue)}</p></div>
                <div style={{background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px'}}><p style={{fontSize: '0.75rem', color: '#64748b'}}>Barang Titipan</p><p style={{fontSize: '1.5rem', fontWeight: 700, color: '#ec4899'}}>{reports.deposits?.total || 0}</p></div>
              </div>
            </div>
          )}
          
          {stats?.needs_alert && <div style={{background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.1))', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
            <AlertTriangle size={24} style={{color: '#f59e0b'}} />
            <div><p style={{fontWeight: 600, color: '#fbbf24'}}>Alert: Karung Siap Kirim!</p><p style={{fontSize: '0.875rem', color: '#d97706'}}>Total {stats.total_karung_ready} karung ready</p></div>
          </div>}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem'}}>
            <div className="card" style={{textAlign: 'center'}}><p style={{fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase'}}>Total</p><p style={{fontSize: '2rem', fontWeight: 700, color: 'white'}}>{stats?.total_transactions || 0}</p></div>
            <div className="card" style={{borderLeft: '3px solid #f59e0b'}}><p style={{fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase'}}>Pending</p><p style={{fontSize: '2rem', fontWeight: 700, color: '#f59e0b'}}>{stats?.pending_count || 0}</p></div>
            <div className="card" style={{borderLeft: '3px solid #3b82f6'}}><p style={{fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase'}}>Packed</p><p style={{fontSize: '2rem', fontWeight: 700, color: '#3b82f6'}}>{stats?.packed_count || 0}</p></div>
            <div className="card" style={{borderLeft: '3px solid #22c55e'}}><p style={{fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase'}}>Verified</p><p style={{fontSize: '2rem', fontWeight: 700, color: '#22c55e'}}>{stats?.verified_count || 0}</p></div>
            <div className="card" style={{borderLeft: '3px solid #a855f7'}}><p style={{fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase'}}>Shipped</p><p style={{fontSize: '2rem', fontWeight: 700, color: '#a855f7'}}>{stats?.shipped_count || 0}</p></div>
            <div className="card" style={{background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))'}}><p style={{fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase'}}>Karung Ready</p><p style={{fontSize: '2rem', fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>{stats?.total_karung_ready || 0}</p></div>
          </div>
          <div className="card" style={{padding: 0, overflow: 'hidden'}}>
            <div style={{padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)'}}><h3 style={{fontWeight: 600, color: 'white'}}>Timeline Transaksi</h3></div>
            {timeline.length === 0 ? <div style={{padding: '3rem', textAlign: 'center', color: '#64748b'}}><Package size={48} style={{margin: '0 auto 0.75rem', opacity: 0.5}} /><p>Belum ada transaksi</p></div> :
              <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', minWidth: '700px'}}>
                  <thead><tr style={{background: 'rgba(0,0,0,0.2)', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b'}}>
                    <th style={{padding: '1rem', color: '#cbd5e1', fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase'}}>ID</th><th style={{padding: '0.75rem', textAlign: 'left'}}>Customer</th><th style={{padding: '0.75rem', textAlign: 'left'}}>Ekspedisi</th>
                    <th style={{padding: '0.75rem', textAlign: 'center'}}>Qty</th><th style={{padding: '0.75rem', textAlign: 'right'}}>Harga</th><th style={{padding: '0.75rem', textAlign: 'center'}}>Status</th>
                    <th style={{padding: '0.75rem', textAlign: 'left'}}>Checker</th><th style={{padding: '0.75rem', textAlign: 'left'}}>Packaging</th><th style={{padding: '0.75rem', textAlign: 'left'}}>Verifikator</th><th style={{padding: '0.75rem', textAlign: 'center'}}>Karung</th><th style={{padding: '0.75rem', textAlign: 'center'}}>Foto</th>
                  </tr></thead>
                  <tbody>
                    {timeline.map((item: any) => {
                      const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                      return (
                        <tr key={item.id} style={{borderTop: '1px solid rgba(255,255,255,0.05)'}}>
                          <td style={{padding: '0.75rem', color: '#64748b', fontFamily: 'var(--font-display)'}}>#{item.id}</td>
                          <td style={{padding: '0.75rem'}}><div><p style={{fontWeight: 500, color: 'white'}}>{item.customer_name}</p><p style={{fontSize: '0.75rem', color: '#64748b'}}>{item.hp}</p></div></td>
                          <td style={{padding: '0.75rem', color: '#94a3b8'}}>{item.ekspedisi}</td>
                          <td style={{padding: '0.75rem', textAlign: 'center', color: '#94a3b8'}}>{item.total_qty}</td>
                          <td style={{padding: '0.75rem', textAlign: 'right', fontFamily: 'var(--font-display)', color: '#94a3b8'}}>Rp {(item.total_harga || 0).toLocaleString('id-ID')}</td>
                          <td style={{padding: '0.75rem', textAlign: 'center'}}><span className="badge" style={{background: `${cfg.color}20`, color: cfg.color}}>{cfg.label}</span></td>
                          <td style={{padding: '0.75rem'}}><div style={{color: '#94a3b8'}}>{item.checker_name || '-'}</div><div style={{fontSize: '0.7rem', color: '#64748b'}}>{formatDateTime(item.checker_time)}</div></td>
                          <td style={{padding: '0.75rem'}}><div style={{color: '#94a3b8'}}>{item.packaging_name || '-'}</div><div style={{fontSize: '0.7rem', color: '#64748b'}}>{formatDateTime(item.packaging_time)}</div></td>
                          <td style={{padding: '0.75rem'}}><div style={{color: '#94a3b8'}}>{item.verifikator_name || '-'}</div><div style={{fontSize: '0.7rem', color: '#64748b'}}>{formatDateTime(item.verifikator_time)}</div></td>
                          <td style={{padding: '0.75rem', textAlign: 'center', fontFamily: 'var(--font-display)', color: '#a78bfa'}}>{item.jml_karung || 0}</td>
                          <td style={{padding: '0.75rem', textAlign: 'center'}}>
                            <button onClick={() => handleViewTransaction(item)} style={{padding: '0.375rem', background: 'rgba(99,102,241,0.2)', borderRadius: '6px', color: '#6366f1'}}><Image size={16} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>}
          </div>

          <div className="card" style={{padding: 0, overflow: 'hidden'}}>
            <button onClick={() => setShowDeposits(!showDeposits)} style={{width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: showDeposits ? '1px solid rgba(255,255,255,0.1)' : 'none'}}>
              <h3 style={{fontWeight: 600, color: 'white'}}>Barang Titipan</h3>
              {showDeposits ? <ChevronUp size={20} style={{color: '#64748b'}} /> : <ChevronDown size={20} style={{color: '#64748b'}} />}
            </button>
            {showDeposits && (
              <div>
                {deposits.length === 0 ? <div style={{padding: '2rem', textAlign: 'center', color: '#64748b'}}>Belum ada barang titipan</div> :
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', maxHeight: '300px', overflowY: 'auto'}}>
                    {deposits.map((item: any) => (
                      <div key={item.id} style={{background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
                        {item.latest_photo && <img src={item.latest_photo} alt="" style={{width: '60px', height: '45px', objectFit: 'cover', borderRadius: '8px', background: '#000'}} />}
                        <div style={{flex: 1}}>
                          <p style={{fontWeight: 500, color: '#fff'}}>{item.customer_name}</p>
                          <p style={{fontSize: '0.75rem', color: '#64748b'}}>{item.store_name} - {item.quantity} pcs</p>
                          <p style={{fontSize: '0.7rem', color: '#64748b'}}>{formatDateTime(item.created_at)}</p>
                        </div>
                        <button onClick={() => handleViewDeposit(item)} style={{padding: '0.5rem', background: 'rgba(236,72,153,0.2)', borderRadius: '8px', color: '#ec4899'}}><Image size={16} /></button>
                      </div>
                    ))}
</div>}
              </div>
            )}
          </div>
          
          <div className="card" style={{padding: 0, overflow: 'hidden'}}>
            <button onClick={() => setShowSales(!showSales)} style={{width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: showSales ? '1px solid rgba(255,255,255,0.1)' : 'none'}}>
              <h3 style={{fontWeight: 600, color: 'white'}}>Sales Order</h3>
              {showSales ? <ChevronUp size={20} style={{color: '#64748b'}} /> : <ChevronDown size={20} style={{color: '#64748b'}} />}
            </button>
            {showSales && (
              <div>
                {salesOrders.length === 0 ? <div style={{padding: '2rem', textAlign: 'center', color: '#64748b'}}>Belum ada order sales</div> :
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', maxHeight: '300px', overflowY: 'auto'}}>
                    {salesOrders.map((item: any) => (
                      <div key={item.id} style={{background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
                        {item.transfer_proof && <img src={item.transfer_proof} alt="" style={{width: '60px', height: '45px', objectFit: 'cover', borderRadius: '8px', background: '#000'}} />}
                        <div style={{flex: 1}}>
                          <p style={{fontWeight: 500, color: '#fff'}}>{item.customer_name}</p>
                          <p style={{fontSize: '0.75rem', color: '#64748b'}}>{item.hp} - {item.ekspedisi}</p>
                          <p style={{fontSize: '0.7rem', color: '#64748b'}}>PIC: {item.sales_pic} | {formatDateTime(item.created_at)}</p>
                        </div>
                        {item.transfer_proof && <div style={{padding: '0.5rem', background: 'rgba(6,182,212,0.2)', borderRadius: '8px', color: '#06b6d4'}}><DollarSign size={16} /></div>}
                      </div>
                    ))}
                  </div>}
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedTransaction && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'}}>
          <div style={{background: '#1e293b', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto'}}>
            <div style={{padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div>
                <h3 style={{fontWeight: 600, color: 'white'}}>Transaksi #{selectedTransaction.id}</h3>
                <p style={{fontSize: '0.875rem', color: '#64748b'}}>{selectedTransaction.customer_name}</p>
              </div>
              <button onClick={() => { setSelectedTransaction(null); setPhotos([]); }} style={{padding: '0.5rem', color: '#64748b'}}><X size={20} /></button>
            </div>
            <div style={{padding: '1rem'}}>
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem'}}>
                <p style={{fontSize: '0.75rem', color: '#64748b'}}>CHECKER</p>
                <p style={{color: '#fff'}}>{selectedTransaction.checker_name || '-'} <span style={{color: '#64748b', fontSize: '0.75rem'}}>{formatDateTime(selectedTransaction.checker_time)}</span></p>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem'}}>
                <p style={{fontSize: '0.75rem', color: '#64748b'}}>PACKAGING</p>
                <p style={{color: '#fff'}}>{selectedTransaction.packaging_name || '-'} <span style={{color: '#64748b', fontSize: '0.75rem'}}>{formatDateTime(selectedTransaction.packaging_time)}</span></p>
                <p style={{color: '#94a3b8', fontSize: '0.875rem'}}>Karung: {selectedTransaction.jml_karung || 0} | Kardus: {selectedTransaction.jml_kardus || 0} | Plastik: {selectedTransaction.jml_plastik || 0}</p>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem'}}>
                <p style={{fontSize: '0.75rem', color: '#64748b'}}>VERIFIKATOR</p>
                <p style={{color: '#fff'}}>{selectedTransaction.verifikator_name || '-'} <span style={{color: '#64748b', fontSize: '0.75rem'}}>{formatDateTime(selectedTransaction.verifikator_time)}</span></p>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem'}}>
                <p style={{fontSize: '0.75rem', color: '#64748b'}}>DELIVERY</p>
                <p style={{color: '#fff'}}>{selectedTransaction.delivery_name || '-'} <span style={{color: '#64748b', fontSize: '0.75rem'}}>{formatDateTime(selectedTransaction.delivery_time)}</span></p>
              </div>
              
              <div style={{marginTop: '1rem'}}>
                <p style={{fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem'}}>FOTO-FOTO</p>
                {photosLoading ? <p style={{color: '#64748b', textAlign: 'center', padding: '2rem'}}>Loading...</p> : photos.length === 0 ? <p style={{color: '#64748b', textAlign: 'center', padding: '1rem'}}>Belum ada foto</p> :
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                    {photos.map((photo: any, idx: number) => {
                      const photoCfg = PHOTO_LABELS[photo.photo_type] || { label: photo.photo_type, color: '#64748b' };
                      return (
                        <div key={idx} style={{background: 'rgba(0,0,0,0.3)', borderRadius: '12px', overflow: 'hidden'}}>
                          <div style={{padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                            <span className="badge" style={{background: `${photoCfg.color}20`, color: photoCfg.color, fontSize: '0.7rem'}}>{photoCfg.label}</span>
                            <span style={{fontSize: '0.7rem', color: '#64748b'}}>{formatDateTime(photo.created_at)}</span>
                          </div>
                          <img src={photo.r2_url} alt={photo.photo_type} style={{width: '100%', aspectRatio: '16/9', objectFit: 'contain', background: '#000'}} />
                        </div>
                      );
                    })}
                  </div>}
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedDeposit && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'}}>
          <div style={{background: '#1e293b', borderRadius: '16px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflow: 'auto'}}>
            <div style={{padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div>
                <h3 style={{fontWeight: 600, color: 'white'}}>Barang Titipan #{selectedDeposit.id}</h3>
                <p style={{fontSize: '0.875rem', color: '#64748b'}}>{selectedDeposit.customer_name}</p>
              </div>
              <button onClick={() => { setSelectedDeposit(null); setDepositPhotos([]); }} style={{padding: '0.5rem', color: '#64748b'}}><X size={20} /></button>
            </div>
            <div style={{padding: '1rem'}}>
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem'}}>
                <p style={{fontSize: '0.75rem', color: '#64748b'}}>STORE</p>
                <p style={{color: '#fff', fontWeight: 500}}>{selectedDeposit.store_name}</p>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem'}}>
                <p style={{fontSize: '0.75rem', color: '#64748b'}}>QUANTITY</p>
                <p style={{color: '#fff', fontWeight: 500}}>{selectedDeposit.quantity} pcs</p>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem'}}>
                <p style={{fontSize: '0.75rem', color: '#64748b'}}>PIC</p>
                <p style={{color: '#fff'}}>{selectedDeposit.pic_name}</p>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem'}}>
                <p style={{fontSize: '0.75rem', color: '#64748b'}}>WAKTU</p>
                <p style={{color: '#64748b', fontSize: '0.875rem'}}>{formatDateTime(selectedDeposit.created_at)}</p>
              </div>
              <div style={{marginTop: '1rem'}}>
                <p style={{fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem'}}>FOTO</p>
                {depositPhotos.length === 0 ? <p style={{color: '#64748b', textAlign: 'center', padding: '1rem'}}>Belum ada foto</p> :
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                    {depositPhotos.map((photo: any, idx: number) => (
                      <div key={idx} style={{background: 'rgba(0,0,0,0.3)', borderRadius: '12px', overflow: 'hidden'}}>
                        <div style={{padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                          <span style={{fontSize: '0.7rem', color: '#64748b'}}>{formatDateTime(photo.created_at)}</span>
                        </div>
                        <img src={photo.r2_url} alt="" style={{width: '100%', aspectRatio: '16/9', objectFit: 'contain', background: '#000'}} />
                      </div>
                    ))}
                  </div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}