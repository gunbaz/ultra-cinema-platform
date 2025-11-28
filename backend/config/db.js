// PostgreSQL Veritabanı Bağlantı Konfigürasyonu
const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL Connection Pool oluştur
// Pool: Birden fazla istemcinin aynı anda veritabanına bağlanmasını sağlar
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20, // Maksimum bağlantı sayısı
  idleTimeoutMillis: 30000, // Boşta bekleyebileceği maksimum süre
  connectionTimeoutMillis: 2000, // Bağlantı timeout süresi
});

// Bağlantı testi
pool.on('connect', () => {
  console.log('✅ PostgreSQL veritabanına başarıyla bağlanıldı!');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL bağlantı hatası:', err.message);
  process.exit(-1);
});

// Pool'u export et (diğer dosyalarda kullanmak için)
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
