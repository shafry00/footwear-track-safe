const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export interface Transaction {
  id: number;
  customer_name: string;
  hp: string;
  alamat: string;
  ekspedisi: string;
  total_qty: number;
  total_harga: number;
  status: 'pending' | 'packed' | 'verified' | 'shipped';
  created_at: string;
  updated_at: string;
}

export interface InventoryLog {
  id: number;
  transaction_id: number;
  jml_karung: number;
  jml_kardus: number;
  jml_plastik: number;
}

export interface PICLog {
  id: number;
  transaction_id: number;
  role: 'checker' | 'packaging' | 'verifikator' | 'delivery';
  pic_name: string;
  timestamp: string;
}

export interface Photo {
  id: number;
  transaction_id: number;
  photo_type: 'initial' | 'packed' | 'delivery_before' | 'delivery_after';
  r2_url: string;
}

export interface DashboardTimeline {
  id: number;
  customer_name: string;
  hp: string;
  ekspedisi: string;
  total_qty: number;
  total_harga: number;
  status: string;
  created_at: string;
  updated_at: string;
  checker_name: string;
  packaging_name: string;
  verifikator_name: string;
  delivery_name: string;
  jml_karung: number;
  jml_kardus: number;
  jml_plastik: number;
  photo_initial: string;
  photo_packed: string;
  photo_delivery_before: string;
  photo_delivery_after: string;
}

export interface DashboardStats {
  total_transactions: number;
  pending_count: number;
  packed_count: number;
  verified_count: number;
  shipped_count: number;
  total_qty_all: number;
  total_harga_all: number;
  total_karung_ready: number;
  alert_threshold: number;
  needs_alert: boolean;
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  // Checker
  createTransaction: (data: {
    customer_name: string;
    hp: string;
    alamat: string;
    ekspedisi: string;
    total_qty: number;
    total_harga: number;
    pic_name: string;
  }) => fetchAPI<{ success: boolean; transaction_id: number }>('/api/checker/transaction', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  uploadPhoto: async (file: File, transactionId: number, picName: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('transaction_id', String(transactionId));
    formData.append('pic_name', picName);

    const response = await fetch(`${API_BASE_URL}/api/checker/photo`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  },

  // Packaging
  updateInventory: (data: {
    transaction_id: number;
    jml_karung: number;
    jml_kardus: number;
    jml_plastik: number;
    pic_name: string;
  }) => fetchAPI<{ success: boolean }>('/api/packaging/inventory', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  uploadPackedPhoto: async (file: File, transactionId: number, picName: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('transaction_id', String(transactionId));
    formData.append('pic_name', picName);

    const response = await fetch(`${API_BASE_URL}/api/packaging/photo`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  },

  // Verifikator
  approveTransaction: (data: {
    transaction_id: number;
    pic_name: string;
  }) => fetchAPI<{ success: boolean }>('/api/verifikator/approve', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Delivery
  updateDeliveryStatus: (data: {
    transaction_id: number;
    pic_name: string;
  }) => fetchAPI<{ success: boolean }>('/api/delivery/status', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  uploadDeliveryPhoto: async (
    file: File,
    transactionId: number,
    photoType: 'delivery_before' | 'delivery_after'
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('transaction_id', String(transactionId));
    formData.append('photo_type', photoType);

    const response = await fetch(`${API_BASE_URL}/api/delivery/photo`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  },

  // Get Data
  getTransactions: (status?: string) => 
    fetchAPI<{ success: boolean; data: Transaction[] }>(
      status ? `/api/transactions?status=${status}` : '/api/transactions'
    ),

  getTransaction: (id: number) =>
    fetchAPI<{
      success: boolean;
      data: Transaction & {
        inventory: InventoryLog | null;
        pic_logs: PICLog[];
        photos: Photo[];
      };
    }>(`/api/transactions/${id}`),

  getDashboard: (auth: string, startDate?: string, endDate?: string) =>
    fetchAPI<{
      success: boolean;
      data: {
        timeline: DashboardTimeline[];
        deposits: any[];
        summary: any;
        karung_count: number;
      };
    }>('/api/owner/dashboard' + (startDate || endDate ? `?start_date=${startDate || ''}&end_date=${endDate || ''}` : ''), {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }),

  getStats: (auth: string, startDate?: string, endDate?: string) =>
    fetchAPI<{ success: boolean; data: DashboardStats }>('/api/owner/stats' + (startDate || endDate ? `?start_date=${startDate || ''}&end_date=${endDate || ''}` : ''), {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }),

  getReports: (auth: string, period: string = 'daily', startDate?: string, endDate?: string) =>
    fetchAPI<{ success: boolean; data: any }>(`/api/owner/reports?period=${period}&start_date=${startDate || ''}&end_date=${endDate || ''}`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }),

  verifyOwner: (username: string, password: string) =>
    fetchAPI<{ success: boolean; authenticated: boolean }>('/api/owner/verify', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getPICNames: (role: string) =>
    fetchAPI<{ success: boolean; data: { pic_name: string; count: number }[] }>(
      `/api/pics/names?role=${role}`
    ),

  // Sales
  getSalesStaff: () =>
    fetchAPI<{ success: boolean; data: { id: number; name: string; role: string }[] }>('/api/sales/staff'),

  getSalesOrders: (auth: string, startDate?: string, endDate?: string) =>
    fetchAPI<{ success: boolean; data: any[] }>('/api/owner/sales' + (startDate || endDate ? `?start_date=${startDate || ''}&end_date=${endDate || ''}` : ''), {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }),

  createSalesOrder: async (data: {
    customer_name: string;
    hp: string;
    alamat: string;
    ekspedisi: string;
    pic_name: string;
    file?: File;
  }) => {
    const formData = new FormData();
    formData.append('customer_name', data.customer_name);
    formData.append('hp', data.hp);
    formData.append('alamat', data.alamat);
    formData.append('ekspedisi', data.ekspedisi);
    formData.append('pic_name', data.pic_name);
    if (data.file) formData.append('file', data.file);

    const response = await fetch(`${API_BASE_URL}/api/sales/order`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create order');
    }

    return response.json();
  },

  // Deposit
  createDeposit: (data: {
    customer_name: string;
    store_name: string;
    quantity: number;
    pic_name: string;
  }) => fetchAPI<{ success: boolean; deposit_id: number }>('/api/deposit', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Upload deposit photo via API Worker
  uploadDepositPhoto: async (file: File, depositId: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('deposit_id', String(depositId));

    const response = await fetch(`${API_BASE_URL}/api/deposit/photo`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Upload error:', err);
      throw new Error(err.error || 'Upload failed');
    }

    const result = await response.json();
    return { success: true, r2_url: result.r2_url };
  },

  getDeposits: () =>
    fetchAPI<{ success: boolean; data: Deposit[] }>('/api/deposits'),

  getDashboardDeposits: (auth: string) =>
    fetchAPI<{ success: boolean; data: Deposit[] }>('/api/owner/deposits', {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }),

  // Catalog
  getCatalog: () =>
    fetchAPI<{ success: boolean; data: CatalogItem[] }>('/api/catalog'),

  getCatalogImageUrl: (r2Url: string) => {
    const key = r2Url.split('/').pop();
    return `${API_BASE_URL}/api/catalog/image/${key}`;
  },

  uploadCatalogItem: async (itemName: string, price: number, file: File, uploadedBy: string) => {
    const formData = new FormData();
    formData.append('item_name', itemName);
    formData.append('price', String(price));
    formData.append('file', file);
    formData.append('uploaded_by', uploadedBy);

    const auth = btoa(`admin:footwear123`);
    const response = await fetch(`${API_BASE_URL}/api/catalog`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload');
    }

    return response.json();
  },

  deleteCatalogItem: async (id: number) => {
    const auth = btoa(`admin:footwear123`);
    const response = await fetch(`${API_BASE_URL}/api/catalog/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete');
    }

    return response.json();
  },
};

export interface Deposit {
  id: number;
  customer_name: string;
  store_name: string;
  quantity: number;
  pic_name: string;
  created_at: string;
  latest_photo?: string;
}

export interface CatalogItem {
  id: number;
  item_name: string;
  price: number;
  r2_url: string;
  uploaded_by: string;
  created_at: string;
}

export interface TrackingOrder {
  id: number;
  item_name: string;
  modal_price: number;
  r2_url: string;
  status: string;
  ordered_by: string;
  created_at: string;
  received_at: string;
  received_photo: string;
}

// Auth for tracking
const TRACKING_AUTH = btoa(`procurement:procurement123`);

async function fetchTrackingAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${TRACKING_AUTH}`,
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export const trackingApi = {
  getOrders: (status?: string) =>
    fetchTrackingAPI<{ success: boolean; data: TrackingOrder[] }>(
      `/api/tracking/orders${status ? `?status=${status}` : ''}`
    ),

  submitOrder: async (data: {
    item_name: string;
    modal_price: number;
    file?: File;
    ordered_by: string;
  }) => {
    const formData = new FormData();
    formData.append('item_name', data.item_name);
    formData.append('modal_price', String(data.modal_price));
    formData.append('ordered_by', data.ordered_by);
    if (data.file) formData.append('file', data.file);

    const response = await fetch(`${API_BASE_URL}/api/tracking/submit`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${TRACKING_AUTH}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit order');
    }
    return response.json();
  },

  markReceived: async (data: {
    order_id: number;
    file?: File;
    received_by: string;
  }) => {
    const formData = new FormData();
    formData.append('order_id', String(data.order_id));
    formData.append('received_by', data.received_by);
    if (data.file) formData.append('file', data.file);

    const response = await fetch(`${API_BASE_URL}/api/tracking/received`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${TRACKING_AUTH}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to mark received');
    }
    return response.json();
  },
};