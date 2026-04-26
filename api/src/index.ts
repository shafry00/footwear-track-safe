import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { z } from 'zod';

const app = new Hono<{
  Bindings: {
    DB: D1Database;
    R2_BUCKET: R2Bucket;
  };
  Variables: {
    ownerAuth: boolean;
  };
}>();

app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

const OWNER_USERNAME = 'danjuna';
const OWNER_PASSWORD = 'jns123';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'footwear123';
const PROCUREMENT_USERNAME = 'procurement';
const PROCUREMENT_PASSWORD = 'procurement123';

const catalogAuthMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const credentials = atob(authHeader.replace('Basic ', ''));
  const [username, password] = credentials.split(':');
  if ((username === OWNER_USERNAME && password === OWNER_PASSWORD) || (username === ADMIN_USERNAME && password === ADMIN_PASSWORD)) {
    await next();
  } else {
    return c.json({ error: 'Invalid credentials' }, 401);
  }
};

const trackingAuthMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const credentials = atob(authHeader.replace('Basic ', ''));
  const [username, password] = credentials.split(':');
  if ((username === OWNER_USERNAME && password === OWNER_PASSWORD) || (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) || (username === PROCUREMENT_USERNAME && password === PROCUREMENT_PASSWORD)) {
    await next();
  } else {
    return c.json({ error: 'Invalid credentials' }, 401);
  }
};

const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const credentials = atob(authHeader.replace('Basic ', ''));
  const [username, password] = credentials.split(':');
  if (username === OWNER_USERNAME && password === OWNER_PASSWORD) {
    c.set('ownerAuth', true);
    await next();
  } else {
    return c.json({ error: 'Invalid credentials' }, 401);
  }
};

const transactionSchema = z.object({
  customer_name: z.string().min(1),
  hp: z.string().min(1),
  alamat: z.string().min(1),
  ekspedisi: z.string().min(1),
  total_qty: z.number().int().positive(),
  total_harga: z.number().positive(),
});

const packagingSchema = z.object({
  transaction_id: z.number().int().positive(),
  jml_karung: z.number().int().min(0),
  jml_kardus: z.number().int().min(0),
  jml_plastik: z.number().int().min(0),
});

const verifikatorSchema = z.object({
  transaction_id: z.number().int().positive(),
});

const deliverySchema = z.object({
  transaction_id: z.number().int().positive(),
});

const depositSchema = z.object({
  customer_name: z.string().min(1),
  store_name: z.string().min(1),
  quantity: z.number().int().nonnegative(),
});

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API: Checker - Create Transaction
app.post('/api/checker/transaction', async (c) => {
  try {
    const body = await c.req.json();
    const validation = transactionSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ error: 'Invalid input', details: validation.error.issues }, 400);
    }
    const { customer_name, hp, alamat, ekspedisi, total_qty, total_harga } = validation.data;
    const pic_name = body.pic_name || '';
    const timestamp = new Date().toISOString();

    const result = await c.env.DB.prepare(`
      INSERT INTO transactions (customer_name, hp, alamat, ekspedisi, total_qty, total_harga, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(customer_name, hp, alamat, ekspedisi, total_qty, total_harga, timestamp, timestamp).run();

    if (!result.success) {
      return c.json({ success: false, error: 'Failed to create transaction' }, 500);
    }

    const transactionId = result.meta.last_row_id;

    await c.env.DB.prepare(`
      INSERT INTO pic_logs (transaction_id, role, pic_name, timestamp)
      VALUES (?, 'checker', ?, ?)
    `).bind(transactionId, pic_name, timestamp).run();

    return c.json({ success: true, transaction_id: transactionId, message: 'Transaksi berhasil dibuat!' });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// API: Checker - Upload Photo
app.post('/api/checker/photo', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body['file'] as File;
    const transactionId = body['transaction_id'] as string;
    const photoType = 'initial';

    if (!file || !transactionId || !(file instanceof File)) {
      return c.json({ success: false, error: 'Missing file or transaction_id' }, 400);
    }

    const timestamp = Date.now();
    const key = `${transactionId}_${photoType}_${timestamp}.jpg`;
    const contentType = file.type || 'image/jpeg';

    const arrayBuffer = await file.arrayBuffer();
    await c.env.R2_BUCKET.put(key, arrayBuffer, { httpMetadata: { contentType } });

    const r2Url = getR2Url(key);

    await c.env.DB.prepare('INSERT INTO photos (transaction_id, photo_type, r2_url, created_at) VALUES (?, ?, ?, ?)').bind(parseInt(transactionId), photoType, r2Url, new Date().toISOString()).run();

    return c.json({ success: true, r2_url: r2Url, message: 'Foto berhasil diupload!' });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return c.json({ success: false, error: 'Upload failed' }, 500);
  }
});

// API: Packaging - Update Inventory
app.post('/api/packaging/inventory', async (c) => {
  try {
    const body = await c.req.json();
    const validation = packagingSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ success: false, error: 'Invalid input' }, 400);
    }

    const { transaction_id, jml_karung, jml_kardus, jml_plastik } = validation.data;
    const pic_name = body.pic_name || '';
    const timestamp = new Date().toISOString();

    const existing = await c.env.DB.prepare('SELECT id FROM inventory_logs WHERE transaction_id = ?').bind(transaction_id).first();

    if (existing) {
      await c.env.DB.prepare('UPDATE inventory_logs SET jml_karung = ?, jml_kardus = ?, jml_plastik = ? WHERE transaction_id = ?')
        .bind(jml_karung, jml_kardus, jml_plastik, transaction_id).run();
    } else {
      await c.env.DB.prepare('INSERT INTO inventory_logs (transaction_id, jml_karung, jml_kardus, jml_plastik, created_at) VALUES (?, ?, ?, ?, ?)')
        .bind(transaction_id, jml_karung, jml_kardus, jml_plastik, timestamp).run();
    }

    await c.env.DB.prepare('INSERT INTO pic_logs (transaction_id, role, pic_name, timestamp) VALUES (?, ?, ?, ?)').bind(transaction_id, 'packaging', pic_name, timestamp).run();

    await c.env.DB.prepare("UPDATE transactions SET status = 'packed', updated_at = ? WHERE id = ?").bind(timestamp, transaction_id).run();

    return c.json({ success: true, message: 'Inventory berhasil diupdate!' });
  } catch (error) {
    console.error('Error updating inventory:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// API: Packaging - Upload Photo
app.post('/api/packaging/photo', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body['file'] as File;
    const transactionId = body['transaction_id'] as string;
    const photoType = 'packed';

    if (!file || !transactionId || !(file instanceof File)) {
      return c.json({ success: false, error: 'Missing file or transaction_id' }, 400);
    }

    const timestamp = Date.now();
    const key = `${transactionId}_${photoType}_${timestamp}.jpg`;
    const contentType = file.type || 'image/jpeg';

    const arrayBuffer = await file.arrayBuffer();
    await c.env.R2_BUCKET.put(key, arrayBuffer, { httpMetadata: { contentType } });

    const r2Url = getR2Url(key);

    await c.env.DB.prepare('INSERT INTO photos (transaction_id, photo_type, r2_url, created_at) VALUES (?, ?, ?, ?)').bind(parseInt(transactionId), photoType, r2Url, new Date().toISOString()).run();

    return c.json({ success: true, r2_url: r2Url, message: 'Foto berhasil diupload!' });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return c.json({ success: false, error: 'Upload failed' }, 500);
  }
});

// API: Verifikator - Approve Transaction
app.post('/api/verifikator/approve', async (c) => {
  try {
    const body = await c.req.json();
    const validation = verifikatorSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ success: false, error: 'Invalid input' }, 400);
    }

    const { transaction_id } = validation.data;
    const pic_name = body.pic_name || '';
    const timestamp = new Date().toISOString();

    const current = await c.env.DB.prepare('SELECT status FROM transactions WHERE id = ?').bind(transaction_id).first();
    if (!current) return c.json({ success: false, error: 'Transaction not found' }, 404);
    if (current.status !== 'packed') return c.json({ success: false, error: 'Transaction must be in packed status to verify' }, 400);

    await c.env.DB.prepare('INSERT INTO pic_logs (transaction_id, role, pic_name, timestamp) VALUES (?, ?, ?, ?)').bind(transaction_id, 'verifikator', pic_name, timestamp).run();
    await c.env.DB.prepare("UPDATE transactions SET status = 'verified', updated_at = ? WHERE id = ?").bind(timestamp, transaction_id).run();

    return c.json({ success: true, message: 'Transaksi berhasil diverifikasi!' });
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// API: Delivery - Update Status
app.post('/api/delivery/status', async (c) => {
  try {
    const body = await c.req.json();
    const validation = deliverySchema.safeParse(body);
    if (!validation.success) {
      return c.json({ success: false, error: 'Invalid input' }, 400);
    }

    const { transaction_id } = validation.data;
    const pic_name = body.pic_name || '';
    const timestamp = new Date().toISOString();

    const current = await c.env.DB.prepare('SELECT status FROM transactions WHERE id = ?').bind(transaction_id).first();
    if (!current) return c.json({ success: false, error: 'Transaction not found' }, 404);
    if (current.status !== 'verified') return c.json({ success: false, error: 'Transaction must be verified before shipping' }, 400);

    await c.env.DB.prepare('INSERT INTO pic_logs (transaction_id, role, pic_name, timestamp) VALUES (?, ?, ?, ?)').bind(transaction_id, 'delivery', pic_name, timestamp).run();
    await c.env.DB.prepare("UPDATE transactions SET status = 'shipped', updated_at = ? WHERE id = ?").bind(timestamp, transaction_id).run();

    return c.json({ success: true, message: 'Delivery berhasil diupdate!' });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// API: Delivery - Upload Photo
app.post('/api/delivery/photo', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body['file'] as File;
    const transactionId = body['transaction_id'] as string;
    const photoType = body['photo_type'] as string;

    if (!file || !transactionId || !photoType || !(file instanceof File)) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    if (!['delivery_before', 'delivery_after'].includes(photoType)) {
      return c.json({ success: false, error: 'Invalid photo_type' }, 400);
    }

    const timestamp = Date.now();
    const key = `${transactionId}_${photoType}_${timestamp}.jpg`;
    const contentType = file.type || 'image/jpeg';

    const arrayBuffer = await file.arrayBuffer();
    await c.env.R2_BUCKET.put(key, arrayBuffer, { httpMetadata: { contentType } });

    const r2Url = getR2Url(key);

    await c.env.DB.prepare('INSERT INTO photos (transaction_id, photo_type, r2_url, created_at) VALUES (?, ?, ?, ?)').bind(parseInt(transactionId), photoType, r2Url, new Date().toISOString()).run();

    return c.json({ success: true, r2_url: r2Url, message: 'Foto berhasil diupload!' });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return c.json({ success: false, error: 'Upload failed' }, 500);
  }
});

// API: Deposit - Create Deposit
app.post('/api/deposit', async (c) => {
  try {
    const body = await c.req.json();
    const validation = depositSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ success: false, error: 'Invalid input' }, 400);
    }
    const { customer_name, store_name, quantity } = validation.data;
    const pic_name = body.pic_name || '';
    const timestamp = new Date().toISOString();

    const result = await c.env.DB.prepare(`
      INSERT INTO deposits (customer_name, store_name, quantity, pic_name, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(customer_name, store_name, quantity, pic_name, timestamp).run();

    if (!result.success) {
      return c.json({ success: false, error: 'Failed to create deposit' }, 500);
    }

    const depositId = result.meta.last_row_id;
    return c.json({ success: true, deposit_id: depositId, message: 'Barang titipan berhasil dicatat!' });
  } catch (error) {
    console.error('Error creating deposit:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

const R2_PUBLIC_URL = 'https://cdn-footwear.larutmalam.id';

const getR2Url = (key: string) => `${R2_PUBLIC_URL}/${key}`;

// API: Catalog - Get Image (proxy for download with CORS)
app.get('/api/catalog/image/:key', async (c) => {
  try {
    const key = c.req.param('key');
    const object = await c.env.R2_BUCKET.get(key);
    
    if (!object) {
      return c.json({ error: 'Not found' }, 404);
    }
    
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
        'Content-Disposition': `attachment; filename="${key.split('_').pop()}"`,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error getting image:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// API: Deposit - Upload Photo via Worker
app.post('/api/deposit/photo', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body['file'] as File;
    const depositId = body['deposit_id'] as string;

    if (!file || !depositId || !(file instanceof File)) {
      return c.json({ success: false, error: 'Missing file or deposit_id' }, 400);
    }

    const timestamp = Date.now();
    const key = `deposit_${depositId}_${timestamp}.jpg`;
    const contentType = file.type || 'image/jpeg';

    const arrayBuffer = await file.arrayBuffer();
    await c.env.R2_BUCKET.put(key, arrayBuffer, { httpMetadata: { contentType } });

    const r2Url = `${R2_PUBLIC_URL}/${key}`;

    await c.env.DB.prepare('INSERT INTO deposit_photos (deposit_id, r2_url, created_at) VALUES (?, ?, ?)')
      .bind(parseInt(depositId), r2Url, new Date().toISOString()).run();

    return c.json({ success: true, r2_url: r2Url, message: 'Foto berhasil diupload!' });
  } catch (error) {
    console.error('Error uploading deposit photo:', error);
    return c.json({ success: false, error: 'Upload failed: ' + String(error) }, 500);
  }
});

// API: Deposit - Save photo URL (after frontend uploads to public URL)
app.post('/api/deposit/photo-save', async (c) => {
  try {
    const body = await c.req.json();
    const { deposit_id, r2_url } = body;
    
    if (!deposit_id || !r2_url) {
      return c.json({ success: false, error: 'Missing deposit_id or r2_url' }, 400);
    }

    await c.env.DB.prepare('INSERT INTO deposit_photos (deposit_id, r2_url, created_at) VALUES (?, ?, ?)')
      .bind(deposit_id, r2_url, new Date().toISOString()).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error saving photo:', error);
    return c.json({ success: false, error: 'Failed to save' }, 500);
  }
});

// API: Deposit - Get R2 Public URL for upload
app.get('/api/deposit/r2-config', async (c) => {
  return c.json({ success: true, r2Url: R2_PUBLIC_URL });
});

// API: Deposit - Save photo URL after direct R2 upload
app.post('/api/deposit/photo-save', async (c) => {
  try {
    const body = await c.req.json();
    const { deposit_id, r2_url } = body;
    
    if (!deposit_id || !r2_url) {
      return c.json({ success: false, error: 'Missing deposit_id or r2_url' }, 400);
    }

    await c.env.DB.prepare('INSERT INTO deposit_photos (deposit_id, r2_url, created_at) VALUES (?, ?, ?)')
      .bind(deposit_id, r2_url, new Date().toISOString()).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error saving photo:', error);
    return c.json({ success: false, error: 'Failed to save' }, 500);
  }
});

// API: Get Deposits List
app.get('/api/deposits', async (c) => {
  try {
    const results = await c.env.DB.prepare('SELECT * FROM deposits ORDER BY created_at DESC').all();
    return c.json({ success: true, data: results.results });
  } catch (error) {
    console.error('Error fetching deposits:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// API: Owner - Get All Deposits with Photos
app.get('/api/owner/deposits', authMiddleware, async (c) => {
  try {
    const deposits = await c.env.DB.prepare(`
      SELECT d.*, 
             (SELECT r2_url FROM deposit_photos dp WHERE dp.deposit_id = d.id ORDER BY created_at DESC LIMIT 1) as latest_photo
      FROM deposits d
      ORDER BY d.created_at DESC
    `).all();
    return c.json({ success: true, data: deposits.results });
  } catch (error) {
    console.error('Error fetching deposits:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// API: Owner - Get Photos for Deposit
app.get('/api/owner/deposit/photos/:depositId', authMiddleware, async (c) => {
  try {
    const depositId = c.req.param('depositId');
    const photos = await c.env.DB.prepare('SELECT * FROM deposit_photos WHERE deposit_id = ? ORDER BY created_at DESC').bind(parseInt(depositId)).all();
    return c.json({ success: true, data: photos.results });
  } catch (error) {
    console.error('Error fetching deposit photos:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// API: Get Transactions List
app.get('/api/transactions', async (c) => {
  try {
    const status = c.req.query('status');
    let query = 'SELECT * FROM transactions';
    const params: any[] = [];
    if (status) { query += ' WHERE status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC';
    const results = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, data: results.results });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// API: Get Single Transaction
app.get('/api/transactions/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const transaction = await c.env.DB.prepare('SELECT * FROM transactions WHERE id = ?').bind(parseInt(id)).first();
    if (!transaction) return c.json({ success: false, error: 'Transaction not found' }, 404);
    const inventory = await c.env.DB.prepare('SELECT * FROM inventory_logs WHERE transaction_id = ?').bind(parseInt(id)).first();
    const picLogs = await c.env.DB.prepare('SELECT * FROM pic_logs WHERE transaction_id = ?').bind(parseInt(id)).all();
    const photos = await c.env.DB.prepare('SELECT * FROM photos WHERE transaction_id = ?').bind(parseInt(id)).all();
    return c.json({ success: true, data: { ...transaction, inventory, pic_logs: picLogs.results, photos: photos.results } });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// API: Owner - Dashboard Timeline (Protected) with Date Filter
app.get('/api/owner/dashboard', authMiddleware, async (c) => {
  try {
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');
    
    let txDateFilter = '';
    let depDateFilter = '';
    const params: any[] = [];
    
    if (startDate && endDate) {
      txDateFilter = 'AND t.created_at BETWEEN ? AND ?';
      depDateFilter = 'AND d.created_at BETWEEN ? AND ?';
      params.push(startDate, endDate + ' 23:59:59');
    } else if (startDate) {
      txDateFilter = 'AND t.created_at >= ?';
      depDateFilter = 'AND d.created_at >= ?';
      params.push(startDate);
    } else if (endDate) {
      txDateFilter = 'AND t.created_at <= ?';
      depDateFilter = 'AND d.created_at <= ?';
      params.push(endDate + ' 23:59:59');
    }
    
    const timeline = await c.env.DB.prepare(`
      SELECT t.*, pl_checker.pic_name AS checker_name, pl_checker.timestamp AS checker_time,
             pl_packaging.pic_name AS packaging_name, pl_packaging.timestamp AS packaging_time,
             pl_verifikator.pic_name AS verifikator_name, pl_verifikator.timestamp AS verifikator_time,
             pl_delivery.pic_name AS delivery_name, pl_delivery.timestamp AS delivery_time,
             inv.jml_karung, inv.jml_kardus, inv.jml_plastik
      FROM transactions t
      LEFT JOIN pic_logs pl_checker ON t.id = pl_checker.transaction_id AND pl_checker.role = 'checker'
      LEFT JOIN pic_logs pl_packaging ON t.id = pl_packaging.transaction_id AND pl_packaging.role = 'packaging'
      LEFT JOIN pic_logs pl_verifikator ON t.id = pl_verifikator.transaction_id AND pl_verifikator.role = 'verifikator'
      LEFT JOIN pic_logs pl_delivery ON t.id = pl_delivery.transaction_id AND pl_delivery.role = 'delivery'
      LEFT JOIN inventory_logs inv ON t.id = inv.transaction_id
      WHERE 1=1 ${txDateFilter}
      ORDER BY t.created_at DESC
    `).bind(...params).all();

    const deposits = await c.env.DB.prepare(`
      SELECT d.*, 
             (SELECT r2_url FROM deposit_photos dp WHERE dp.deposit_id = d.id ORDER BY created_at DESC LIMIT 1) as latest_photo
      FROM deposits d
      WHERE 1=1 ${depDateFilter}
      ORDER BY d.created_at DESC
    `).bind(...params).all();

    const summary = await c.env.DB.prepare(`
      SELECT COUNT(*) AS total_transactions,
             SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
             SUM(CASE WHEN status = 'packed' THEN 1 ELSE 0 END) AS packed_count,
             SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) AS verified_count,
             SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS shipped_count
      FROM transactions
    `).first();

    const karungCount = await c.env.DB.prepare(`
      SELECT SUM(inv.jml_karung) AS total_karung_ready FROM transactions t
      JOIN inventory_logs inv ON t.id = inv.transaction_id WHERE t.status = 'verified'
    `).first();

    return c.json({ success: true, data: { timeline: timeline.results, deposits: deposits.results, summary, karung_count: karungCount?.total_karung_ready || 0 } });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// API: Owner - Reports (Daily/Weekly/Monthly) with Date Filter
app.get('/api/owner/reports', authMiddleware, async (c) => {
  try {
    const period = c.req.query('period') || 'daily';
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');
    
    let dateClause = '';
    if (startDate && endDate) {
      dateClause = `created_at BETWEEN '${startDate}' AND '${endDate} 23:59:59'`;
    } else if (startDate) {
      dateClause = `created_at >= '${startDate}'`;
    } else if (endDate) {
      dateClause = `created_at <= '${endDate} 23:59:59'`;
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (period === 'daily') {
        dateClause = `created_at >= '${today}'`;
      } else if (period === 'weekly') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        dateClause = `created_at >= '${weekAgo}'`;
      } else if (period === 'monthly') {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        dateClause = `created_at >= '${monthAgo}'`;
      }
    }
    
    const transactionsReport = await c.env.DB.prepare(`
      SELECT COUNT(*) AS total, COALESCE(SUM(total_qty), 0) AS qty, COALESCE(SUM(total_harga), 0) AS revenue,
             SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS shipped
      FROM transactions WHERE ${dateClause}
    `).first();
    
    const depositsReport = await c.env.DB.prepare(`
      SELECT COUNT(*) AS total, COALESCE(SUM(quantity), 0) AS qty
      FROM deposits WHERE ${dateClause}
    `).first();
    
    const dailyBreakdown = await c.env.DB.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count, COALESCE(SUM(total_qty), 0) as qty
      FROM transactions WHERE ${dateClause}
      GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30
    `).all();
    
    return c.json({ success: true, data: {
      period,
      start_date: startDate,
      end_date: endDate,
      transactions: transactionsReport,
      deposits: depositsReport,
      daily_breakdown: dailyBreakdown.results
    }});
  } catch (error) {
    console.error('Error fetching reports:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// API: Owner - Get Photos for Transaction
app.get('/api/owner/photos/:transactionId', authMiddleware, async (c) => {
  try {
    const transactionId = c.req.param('transactionId');
    const photos = await c.env.DB.prepare('SELECT * FROM photos WHERE transaction_id = ? ORDER BY created_at DESC').bind(parseInt(transactionId)).all();
    return c.json({ success: true, data: photos.results });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// API: Owner - Get Stats with Date Range
app.get('/api/owner/stats', authMiddleware, async (c) => {
  try {
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');
    
    let dateFilter = '';
    const params: any[] = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE created_at BETWEEN ? AND ?';
      params.push(startDate, endDate + ' 23:59:59');
    } else if (startDate) {
      dateFilter = 'WHERE created_at >= ?';
      params.push(startDate);
    } else if (endDate) {
      dateFilter = 'WHERE created_at <= ?';
      params.push(endDate + ' 23:59:59');
    }
    
    const summary = await c.env.DB.prepare(`
      SELECT COUNT(*) AS total_transactions,
             SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
             SUM(CASE WHEN status = 'packed' THEN 1 ELSE 0 END) AS packed_count,
             SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) AS verified_count,
             SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS shipped_count,
             SUM(total_qty) AS total_qty_all,
             SUM(total_harga) AS total_harga_all
      FROM transactions ${dateFilter}
    `).bind(...params).first();

    const karungCount = await c.env.DB.prepare(`
      SELECT SUM(inv.jml_karung) AS total_karung_ready FROM transactions t
      JOIN inventory_logs inv ON t.id = inv.transaction_id WHERE t.status = 'verified'
    `).first();

    const depositsCount = await c.env.DB.prepare(`
      SELECT COUNT(*) AS total_deposits, SUM(quantity) AS total_quantity FROM deposits
    `).first();

    const currentKarung = karungCount?.total_karung_ready || 0;
    const alertThreshold = 7;

    return c.json({ success: true, data: { ...summary, ...depositsCount, total_karung_ready: currentKarung, alert_threshold: alertThreshold, needs_alert: currentKarung >= alertThreshold } });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// API: Owner - Verify
app.post('/api/owner/verify', async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;
    if (username === OWNER_USERNAME && password === OWNER_PASSWORD) {
      return c.json({ success: true, authenticated: true });
    } else {
      return c.json({ success: false, authenticated: false, error: 'Invalid credentials' }, 401);
    }
  } catch (error) {
    console.error('Error verifying owner:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// API: Get PIC Names
app.get('/api/pics/names', async (c) => {
  try {
    const role = c.req.query('role');
    if (!role || !['checker', 'packaging', 'verifikator', 'delivery'].includes(role)) {
      return c.json({ success: false, error: 'Invalid or missing role parameter' }, 400);
    }
    const names = await c.env.DB.prepare('SELECT DISTINCT pic_name, COUNT(*) as count FROM pic_logs WHERE role = ? GROUP BY pic_name ORDER BY count DESC').bind(role).all();
    return c.json({ success: true, data: names.results });
  } catch (error) {
    console.error('Error fetching PIC names:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// API: Get Sales Staff
app.get('/api/sales/staff', async (c) => {
  try {
    const staff = await c.env.DB.prepare('SELECT * FROM sales_staff ORDER BY role, name').all();
    return c.json({ success: true, data: staff.results });
  } catch (error) {
    console.error('Error fetching sales staff:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// API: Owner - Get Sales Orders
app.get('/api/owner/sales', authMiddleware, async (c) => {
  try {
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');
    
    let dateClause = '';
    const params: any[] = [];
    
    if (startDate && endDate) {
      dateClause = 'WHERE t.created_at BETWEEN ? AND ?';
      params.push(startDate, endDate + ' 23:59:59');
    } else if (startDate) {
      dateClause = 'WHERE t.created_at >= ?';
      params.push(startDate);
    } else if (endDate) {
      dateClause = 'WHERE t.created_at <= ?';
      params.push(endDate + ' 23:59:59');
    }
    
    const salesOrders = await c.env.DB.prepare(`
      SELECT t.*, pl.pic_name as sales_pic, ph.r2_url as transfer_proof
      FROM transactions t
      JOIN pic_logs pl ON t.id = pl.transaction_id AND pl.role = 'sales'
      LEFT JOIN photos ph ON t.id = ph.transaction_id AND ph.photo_type = 'transfer_proof'
      ${dateClause ? dateClause : ''}
      ORDER BY t.created_at DESC
    `).bind(...params).all();
    
    return c.json({ success: true, data: salesOrders.results });
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// API: Sales - Create Order
app.post('/api/sales/order', async (c) => {
  try {
    const body = await c.req.parseBody();
    const customer_name = body['customer_name'] as string;
    const hp = body['hp'] as string;
    const alamat = body['alamat'] as string;
    const ekspedisi = body['ekspedisi'] as string;
    const pic_name = body['pic_name'] as string;
    const file = body['file'] as File;

    if (!customer_name || !hp || !alamat || !ekspedisi || !pic_name) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    const timestamp = new Date().toISOString();
    
    // Create transaction first
    const result = await c.env.DB.prepare(`
      INSERT INTO transactions (customer_name, hp, alamat, ekspedisi, total_qty, total_harga, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, 0, 'pending', ?, ?)
    `).bind(customer_name, hp, alamat, ekspedisi, timestamp, timestamp).run();

    if (!result.success) {
      return c.json({ success: false, error: 'Failed to create order' }, 500);
    }

    const transactionId = result.meta.last_row_id;

    // Upload photo if exists
    let r2Url = null;
    if (file && file instanceof File && file.size > 0) {
      const key = `${transactionId}_transfer_${Date.now()}.jpg`;
      const contentType = file.type || 'image/jpeg';
      const arrayBuffer = await file.arrayBuffer();
      await c.env.R2_BUCKET.put(key, arrayBuffer, { httpMetadata: { contentType } });
      r2Url = getR2Url(key);
      
      await c.env.DB.prepare('INSERT INTO photos (transaction_id, photo_type, r2_url, created_at) VALUES (?, ?, ?, ?)')
        .bind(transactionId, 'transfer_proof', r2Url, timestamp).run();
    }

    // Record PIC log
    await c.env.DB.prepare('INSERT INTO pic_logs (transaction_id, role, pic_name, timestamp) VALUES (?, ?, ?, ?)')
      .bind(transactionId, 'sales', pic_name, timestamp).run();

    return c.json({ success: true, transaction_id: transactionId, message: 'Order berhasil dibuat!' });
  } catch (error) {
    console.error('Error creating sales order:', error);
    return c.json({ success: false, error: 'Failed to create order' }, 500);
  }
});

// API: Catalog - Get All Items (public)
app.get('/api/catalog', async (c) => {
  try {
    const items = await c.env.DB.prepare('SELECT * FROM catalog ORDER BY created_at DESC').all();
    return c.json({ success: true, data: items.results });
  } catch (error) {
    console.error('Error fetching catalog:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// API: Catalog - Upload Item (owner/admin only)
app.post('/api/catalog', catalogAuthMiddleware, async (c) => {
  try {
    const body = await c.req.parseBody();
    const item_name = body['item_name'] as string;
    const price = parseFloat(body['price'] as string);
    const file = body['file'] as File;
    const uploaded_by = body['uploaded_by'] as string;

    if (!item_name || !price || !file || !uploaded_by) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    if (!(file instanceof File) || file.size === 0) {
      return c.json({ success: false, error: 'Image file required' }, 400);
    }

    const timestamp = new Date().toISOString();
    const key = `catalog_${Date.now()}_${file.name}`;
    const contentType = file.type || 'image/jpeg';
    const arrayBuffer = await file.arrayBuffer();
    await c.env.R2_BUCKET.put(key, arrayBuffer, { httpMetadata: { contentType } });
    const r2Url = getR2Url(key);

    const result = await c.env.DB.prepare(`
      INSERT INTO catalog (item_name, price, r2_url, uploaded_by, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(item_name, price, r2Url, uploaded_by, timestamp).run();

    if (!result.success) {
      return c.json({ success: false, error: 'Failed to save catalog item' }, 500);
    }

    return c.json({ success: true, catalog_id: result.meta.last_row_id, message: 'Item berhasil ditambahkan!' });
  } catch (error) {
    console.error('Error uploading catalog:', error);
    return c.json({ success: false, error: 'Failed to upload catalog item' }, 500);
  }
});

// API: Catalog - Delete Item (owner/admin only)
app.delete('/api/catalog/:id', catalogAuthMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    
    const item = await c.env.DB.prepare('SELECT r2_url FROM catalog WHERE id = ?').bind(parseInt(id)).first();
    if (!item) {
      return c.json({ success: false, error: 'Item not found' }, 404);
    }

    // Delete from R2
    if (item.r2_url) {
      const key = item.r2_url.split('/').pop();
      if (key) await c.env.R2_BUCKET.delete(key);
    }

    // Delete from DB
    await c.env.DB.prepare('DELETE FROM catalog WHERE id = ?').bind(parseInt(id)).run();

    return c.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    console.error('Error deleting catalog item:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// ============================================
// TRACKING ORDER APIs
// ============================================

// API: Tracking - Get All Orders (for dropdown)
app.get('/api/tracking/orders', async (c) => {
  try {
    const status = c.req.query('status');
    const query = status === 'received' 
      ? 'SELECT * FROM tracking_orders WHERE status = ? ORDER BY created_at DESC'
      : 'SELECT * FROM tracking_orders ORDER BY created_at DESC';
    const params = status === 'received' ? ['received'] : [];
    
    const orders = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, data: orders.results });
  } catch (error) {
    console.error('Error fetching tracking orders:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// API: Tracking - Submit Order
app.post('/api/tracking/submit', trackingAuthMiddleware, async (c) => {
  try {
    const body = await c.req.parseBody();
    const item_name = body['item_name'] as string;
    const modal_price = parseFloat(body['modal_price'] as string);
    const file = body['file'] as File;
    const ordered_by = body['ordered_by'] as string;

    if (!item_name || !modal_price || !ordered_by) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    let r2Url = null;
    if (file && file instanceof File && file.size > 0) {
      const key = `tracking_${Date.now()}_${file.name}`;
      const contentType = file.type || 'image/jpeg';
      const arrayBuffer = await file.arrayBuffer();
      await c.env.R2_BUCKET.put(key, arrayBuffer, { httpMetadata: { contentType } });
      r2Url = getR2Url(key);
    }

    const timestamp = new Date().toISOString();
    const result = await c.env.DB.prepare(`
      INSERT INTO tracking_orders (item_name, modal_price, r2_url, status, ordered_by, created_at)
      VALUES (?, ?, ?, 'pending', ?, ?)
    `).bind(item_name, modal_price, r2Url, ordered_by, timestamp).run();

    if (!result.success) {
      return c.json({ success: false, error: 'Failed to submit order' }, 500);
    }

    return c.json({ success: true, order_id: result.meta.last_row_id, message: 'Order submitted!' });
  } catch (error) {
    console.error('Error submitting order:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// API: Tracking - Mark as Received
app.post('/api/tracking/received', trackingAuthMiddleware, async (c) => {
  try {
    const body = await c.req.parseBody();
    const order_id = parseInt(body['order_id'] as string);
    const file = body['file'] as File;
    const received_by = body['received_by'] as string;

    if (!order_id || !received_by) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    let r2Url = null;
    if (file && file instanceof File && file.size > 0) {
      const key = `tracking_received_${Date.now()}_${file.name}`;
      const contentType = file.type || 'image/jpeg';
      const arrayBuffer = await file.arrayBuffer();
      await c.env.R2_BUCKET.put(key, arrayBuffer, { httpMetadata: { contentType } });
      r2Url = getR2Url(key);
    }

    const timestamp = new Date().toISOString();
    
    await c.env.DB.prepare(`
      UPDATE tracking_orders SET status = 'received', received_at = ?, received_photo = ? WHERE id = ?
    `).bind(timestamp, r2Url, order_id).run();

    return c.json({ success: true, message: 'Order marked as received!' });
  } catch (error) {
    console.error('Error marking order received:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

export default app;