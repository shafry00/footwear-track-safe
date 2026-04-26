-- Footwear Track & Safe - D1 Database Schema
-- Database untuk prevent fraud grosir footwear

-- ============================================
-- Table: transactions
-- Main transaction table untuk semua order
-- ============================================
CREATE TABLE IF NOT EXISTS `transactions` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `customer_name` TEXT NOT NULL,
    `hp` TEXT NOT NULL,
    `alamat` TEXT NOT NULL,
    `ekspedisi` TEXT NOT NULL,
    `total_qty` INTEGER NOT NULL DEFAULT 0,
    `total_harga` REAL NOT NULL DEFAULT 0,
    `status` TEXT NOT NULL DEFAULT 'pending',
    `created_at` TEXT NOT NULL DEFAULT (datetime('now')),
    `updated_at` TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK(`status` IN ('pending', 'packed', 'verified', 'shipped'))
);

-- ============================================
-- Table: inventory_logs
-- Mencatat inventory packaging per transaction
-- ============================================
CREATE TABLE IF NOT EXISTS `inventory_logs` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `transaction_id` INTEGER NOT NULL,
    `jml_karung` INTEGER NOT NULL DEFAULT 0,
    `jml_kardus` INTEGER NOT NULL DEFAULT 0,
    `jml_plastik` INTEGER NOT NULL DEFAULT 0,
    `created_at` TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE CASCADE
);

-- ============================================
-- Table: pic_logs
-- Mencatat semua PIC yang terlibat per transaction
-- ============================================
CREATE TABLE IF NOT EXISTS `pic_logs` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `transaction_id` INTEGER NOT NULL,
    `role` TEXT NOT NULL,
    `pic_name` TEXT NOT NULL,
    `timestamp` TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE CASCADE,
    CHECK(`role` IN ('checker', 'packaging', 'verifikator', 'delivery', 'deposit'))
);

-- ============================================
-- Table: photos
-- Mencatat semua foto yang diupload ke R2
-- ============================================
CREATE TABLE IF NOT EXISTS `photos` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `transaction_id` INTEGER NOT NULL,
    `photo_type` TEXT NOT NULL,
    `r2_url` TEXT NOT NULL,
    `created_at` TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE CASCADE,
    CHECK(`photo_type` IN ('initial', 'packed', 'delivery_before', 'delivery_after'))
);

-- ============================================
-- Table: deposits
-- Barang titipan dari customer
-- ============================================
CREATE TABLE IF NOT EXISTS `deposits` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `customer_name` TEXT NOT NULL,
    `store_name` TEXT NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `pic_name` TEXT NOT NULL,
    `created_at` TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- Table: catalog
-- Katalog produk untuk sales team
-- ============================================
CREATE TABLE IF NOT EXISTS `catalog` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `item_name` TEXT NOT NULL,
    `price` REAL NOT NULL DEFAULT 0,
    `r2_url` TEXT NOT NULL,
    `uploaded_by` TEXT NOT NULL,
    `created_at` TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- Table: sales_staff
-- Staff yang bisa di Pilih di menu Sales
-- ============================================
CREATE TABLE IF NOT EXISTS `sales_staff` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `name` TEXT NOT NULL,
    `role` TEXT NOT NULL DEFAULT 'sales'
);

-- ============================================
-- Table: tracking_orders
-- Tracking order untuk procurement
-- ============================================
CREATE TABLE IF NOT EXISTS `tracking_orders` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `item_name` TEXT NOT NULL,
    `modal_price` REAL NOT NULL DEFAULT 0,
    `r2_url` TEXT NOT NULL,
    `status` TEXT NOT NULL DEFAULT 'pending',
    `ordered_by` TEXT NOT NULL,
    `created_at` TEXT NOT NULL DEFAULT (datetime('now')),
    `received_at` TEXT,
    `received_photo` TEXT
);

-- ============================================
-- Table: tracking_order_received
-- Foto barang yang sudah diterima
-- ============================================
CREATE TABLE IF NOT EXISTS `tracking_order_received` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `order_id` INTEGER NOT NULL,
    `r2_url` TEXT NOT NULL,
    `received_by` TEXT NOT NULL,
    `created_at` TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (`order_id`) REFERENCES `tracking_orders`(`id`) ON DELETE CASCADE
);

-- ============================================
-- Table: deposit_photos
-- Foto barang titipan
-- ============================================
CREATE TABLE IF NOT EXISTS `deposit_photos` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `deposit_id` INTEGER NOT NULL,
    `r2_url` TEXT NOT NULL,
    `created_at` TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (`deposit_id`) REFERENCES `deposits`(`id`) ON DELETE CASCADE
);

-- ============================================
-- Table: owner_auth
-- Credentaial untuk owner dashboard
-- ============================================
CREATE TABLE IF NOT EXISTS `owner_auth` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `username` TEXT NOT NULL UNIQUE,
    `password_hash` TEXT NOT NULL,
    `created_at` TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================
-- Indexes untuk performa query
-- ============================================
CREATE INDEX IF NOT EXISTS `idx_transactions_status` ON `transactions`(`status`);
CREATE INDEX IF NOT EXISTS `idx_transactions_created` ON `transactions`(`created_at`);
CREATE INDEX IF NOT EXISTS `idx_inventory_logs_tid` ON `inventory_logs`(`transaction_id`);
CREATE INDEX IF NOT EXISTS `idx_pic_logs_tid` ON `pic_logs`(`transaction_id`);
CREATE INDEX IF NOT EXISTS `idx_photos_tid` ON `photos`(`transaction_id`);
CREATE INDEX IF NOT EXISTS `idx_deposits_created` ON `deposits`(`created_at`);
CREATE INDEX IF NOT EXISTS `idx_deposit_photos_did` ON `deposit_photos`(`deposit_id`);

-- ============================================
-- Insert default owner (password: jns123 - harus di-hash di aplikasi)
-- ============================================
INSERT INTO `owner_auth` (`username`, `password_hash`) 
VALUES ('danjuna', 'jns123');  -- NOTE: Di production, hash password ini!

-- ============================================
-- View: transaction_timeline
-- Horizontal timeline view untuk dashboard
-- ============================================
CREATE VIEW IF NOT EXISTS `transaction_timeline` AS
SELECT 
    t.id,
    t.customer_name,
    t.hp,
    t.ekspedisi,
    t.total_qty,
    t.total_harga,
    t.status,
    t.created_at,
    t.updated_at,
    pl_checker.pic_name AS checker_name,
    pl_packaging.pic_name AS packaging_name,
    pl_verifikator.pic_name AS verifikator_name,
    pl_delivery.pic_name AS delivery_name,
    inv.jml_karung,
    inv.jml_kardus,
    inv.jml_plastik,
    ph_initial.r2_url AS photo_initial,
    ph_packed.r2_url AS photo_packed,
    ph_delivery_before.r2_url AS photo_delivery_before,
    ph_delivery_after.r2_url AS photo_delivery_after
FROM `transactions` t
LEFT JOIN `pic_logs` pl_checker ON t.id = pl_checker.transaction_id AND pl_checker.role = 'checker'
LEFT JOIN `pic_logs` pl_packaging ON t.id = pl_packaging.transaction_id AND pl_packaging.role = 'packaging'
LEFT JOIN `pic_logs` pl_verifikator ON t.id = pl_verifikator.transaction_id AND pl_verifikator.role = 'verifikator'
LEFT JOIN `pic_logs` pl_delivery ON t.id = pl_delivery.transaction_id AND pl_delivery.role = 'delivery'
LEFT JOIN `inventory_logs` inv ON t.id = inv.transaction_id
LEFT JOIN `photos` ph_initial ON t.id = ph_initial.transaction_id AND ph_initial.photo_type = 'initial'
LEFT JOIN `photos` ph_packed ON t.id = ph_packed.transaction_id AND ph_packed.photo_type = 'packed'
LEFT JOIN `photos` ph_delivery_before ON t.id = ph_delivery_before.transaction_id AND ph_delivery_before.photo_type = 'delivery_before'
LEFT JOIN `photos` ph_delivery_after ON t.id = ph_delivery_after.transaction_id AND ph_delivery_after.photo_type = 'delivery_after';

-- ============================================
-- View: summary_stats
-- Dashboard summary statistics
-- ============================================
CREATE VIEW IF NOT EXISTS `summary_stats` AS
SELECT 
    COUNT(*) AS total_transactions,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
    SUM(CASE WHEN status = 'packed' THEN 1 ELSE 0 END) AS packed_count,
    SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) AS verified_count,
    SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS shipped_count,
    SUM(total_qty) AS total_qty_all,
    SUM(total_harga) AS total_harga_all
FROM `transactions`;

-- ============================================
-- View: karung_ready_count
-- Hitung total karung di status verified (untuk alert)
-- ============================================
CREATE VIEW IF NOT EXISTS `karung_ready_count` AS
SELECT 
    SUM(inv.jml_karung) AS total_karung_ready
FROM `transactions` t
JOIN `inventory_logs` inv ON t.id = inv.transaction_id
WHERE t.status = 'verified';