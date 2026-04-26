import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, CheckCircle2, Truck, ClipboardCheck, Lock, Box, UserCheck, Send, LayoutDashboard, Archive, DollarSign, BookOpen, ClipboardList } from 'lucide-react';
import { api } from '../hooks/useApi';

const roles = [
  { id: 'checker', label: 'Checker', description: 'Input data order', icon: ClipboardCheck, color: '#0ea5e9' },
  { id: 'packaging', label: 'Packaging', description: 'Input jumlah packing', icon: Package, color: '#8b5cf6' },
  { id: 'verifikator', label: 'Verifikator', description: 'Verifikasi order', icon: CheckCircle2, color: '#10b981' },
  { id: 'delivery', label: 'Delivery', description: 'Foto kirim order', icon: Truck, color: '#f59e0b' },
  { id: 'sales', label: 'Sales', description: 'Input order customer', icon: DollarSign, color: '#06b6d4' },
  { id: 'deposit', label: 'Barang Titipan', description: 'Catat barang titipan', icon: Archive, color: '#ec4899' },
  { id: 'katalog', label: 'Katalog', description: 'Lihat produk', icon: BookOpen, color: '#f97316' },
  { id: 'tracking', label: 'Tracking', description: 'Tracking order', icon: ClipboardList, color: '#84cc16' },
  { id: 'owner', label: 'Owner', description: 'Dashboard monitoring', icon: Lock, color: '#ef4444' },
];

export default function RoleSelectPage() {
  const navigate = useNavigate();
  const [picName, setPicName] = useState('');
  const [staff, setStaff] = useState<{id: number; name: string; role: string}[]>([]);

  useEffect(() => {
    api.getSalesStaff().then((res) => {
      if (res.success) setStaff(res.data);
    }).catch(console.error);
  }, []);

  const handleRoleSelect = (roleId: string) => {
    if (roleId === 'owner') navigate('/owner');
    else if (roleId === 'deposit') navigate('/barangtitipan');
    else if (roleId === 'sales') navigate('/sales');
    else if (roleId === 'katalog') navigate('/katalog');
    else if (roleId === 'tracking') navigate('/tracking');
    else if (picName.trim()) { localStorage.setItem('pic_name', picName.trim()); navigate(`/${roleId}`); }
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'}}>
      <header style={{padding: '2rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
        <div style={{maxWidth: '28rem', margin: '0 auto', textAlign: 'center'}}>
          <div style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '72px', height: '72px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '20px', marginBottom: '1rem', boxShadow: '0 8px 32px rgba(99,102,241,0.4)'}}>
            <Box size={36} color="white" />
          </div>
          <h1 style={{fontFamily: 'system-ui', fontSize: '2rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em'}}>
            FOOTWEAR<span style={{background: 'linear-gradient(135deg, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>TRACK</span>
          </h1>
          <p style={{color: '#94a3b8', fontSize: '1rem', marginTop: '0.5rem'}}>Sistem Tracking Order Sepatu</p>
        </div>
      </header>
      <main style={{flex: 1, padding: '1.5rem 1rem'}}>
        <div style={{maxWidth: '28rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          <div style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', padding: '1.5rem'}}>
            <label style={{display: 'block', color: '#e2e8f0', fontWeight: 600, fontSize: '1rem', marginBottom: '0.75rem'}}>Nama PIC</label>
            <select 
              value={picName} 
              onChange={(e) => setPicName(e.target.value)}
              style={{width: '100%', padding: '1rem 1.25rem', background: 'rgba(0,0,0,0.4)', border: '2px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: 'white', fontSize: '1.125rem', outline: 'none', minHeight: '56px'}}
            >
              <option value="" style={{color: '#64748b'}}>Pilih PIC...</option>
              {staff.map((s) => <option key={s.id} value={s.name} style={{color: 'white'}}>{s.name}</option>)}
            </select>
            <p style={{color: '#64748b', fontSize: '0.75rem', marginTop: '0.5rem'}}>Nama ini akan dicatat di setiap transaksi</p>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <h2 style={{color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Pilih Peran</h2>
            {roles.map((role) => {
                const Icon = role.icon;
                const isDisabled = role.id !== 'owner' && role.id !== 'deposit' && role.id !== 'katalog' && role.id !== 'tracking' && !picName.trim();
                return (
                  <button 
                    key={role.id} 
                    onClick={() => handleRoleSelect(role.id)} 
                    disabled={isDisabled}
                    style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1.25rem', 
                      padding: '1.25rem', 
                      background: isDisabled ? 'rgba(255,255,255,0.03)' : `linear-gradient(135deg, ${role.color}20, ${role.color}10)`,
                      border: `2px solid ${isDisabled ? 'rgba(255,255,255,0.05)' : role.color + '50'}`,
                      borderRadius: '16px', 
                      textAlign: 'left',
                      opacity: isDisabled ? 0.4 : 1,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{background: role.color, padding: '0.875rem', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'}}>
                      <Icon size={24} color="white" />
                    </div>
                    <div style={{flex: 1}}>
                      <h3 style={{color: 'white', fontWeight: 700, fontSize: '1.125rem'}}>{role.label}</h3>
                      <p style={{color: '#94a3b8', fontSize: '0.9375rem', marginTop: '0.25rem'}}>{role.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
        </div>
      </main>
      <footer style={{padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)'}}>
        <p style={{textAlign: 'center', color: '#64748b', fontSize: '0.875rem'}}>Footwear Track v1.0</p>
      </footer>
    </div>
  );
}