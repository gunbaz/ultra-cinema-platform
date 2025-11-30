const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// --- VERİTABANI BAĞLANTISI (En üste taşındı) ---
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'CinemaDB',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    // Bulut veritabanları için SSL desteği
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

// CORS ayarları - Deploy için güncellendi
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // Geliştirme aşamasında her yerden, production'da belirli domain
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Detaylı Loglama
app.use((req, res, next) => {
    console.log(`📩 [${req.method}] ${req.path}`);
    next();
});

// --- BÜFE ÜRÜNLERİ SEED FONKSİYONU ---
const seedProducts = async () => {
    const defaultProducts = [
        { name: 'Büyük Boy Mısır', price: 80, category: 'Yiyecek', stock: 100 },
        { name: 'Kola (330ml)', price: 40, category: 'İçecek', stock: 100 },
        { name: 'Su', price: 15, category: 'İçecek', stock: 100 }
    ];

    try {
        for (const product of defaultProducts) {
            // Ürün var mı kontrol et
            const existing = await pool.query(
                'SELECT product_id FROM Products WHERE product_name = $1',
                [product.name]
            );

            if (existing.rows.length === 0) {
                // Ürün yoksa ekle
                await pool.query(
                    'INSERT INTO Products (product_name, price, category, stock_quantity, is_active) VALUES ($1, $2, $3, $4, true)',
                    [product.name, product.price, product.category, product.stock]
                );
                console.log(`🍿 Ürün eklendi: ${product.name}`);
            }
        }
        console.log('✅ Büfe ürünleri kontrol edildi/eklendi');
    } catch (err) {
        console.error('❌ Seed hatası:', err.message);
    }
};

// --- REVIEWS TABLOSU OLUŞTURMA FONKSİYONU ---
const createReviewsTable = async () => {
    try {
        // Tablo var mı kontrol et
        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'reviews'
            );
        `);

        if (!tableExists.rows[0].exists) {
            // Tablo yoksa oluştur
            await pool.query(`
                CREATE TABLE Reviews (
                    review_id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
                    movie_id INTEGER NOT NULL REFERENCES Movies(movie_id) ON DELETE CASCADE,
                    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                    comment TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, movie_id)
                );
            `);
            console.log('✅ Reviews tablosu oluşturuldu');
        } else {
            console.log('ℹ️ Reviews tablosu zaten mevcut');
        }
    } catch (err) {
        console.error('❌ Reviews tablosu oluşturma hatası:', err.message);
    }
};



// --- JWT Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token Yok!' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Geçersiz Token!' });
        req.user = user;
        next();
    });
};

// --- ADMIN YETKİ KONTROLÜ MIDDLEWARE ---
const verifyAdmin = async (req, res, next) => {
    try {
        // Token'dan gelen user bilgisini al
        const userId = req.user.userId || req.user.id;
        const userRole = req.user.role;

        // Veritabanından kullanıcının gerçek rolünü kontrol et (güvenlik için)
        const userRes = await pool.query(`
            SELECT u.user_id, u.role_id, r.role_name
            FROM Users u
            JOIN Roles r ON u.role_id = r.role_id
            WHERE u.user_id = $1
        `, [userId]);

        if (userRes.rows.length === 0) {
            return res.status(403).json({ message: 'Kullanıcı bulunamadı!' });
        }

        const user = userRes.rows[0];
        
        // Super Admin kontrolü - KESİN GÜVENLİK
        // Rol Standartları:
        // role_id = 1 = Super Admin (Sadece veritabanından elle atanır)
        // role_id = 2 = Müşteri (Varsayılan kayıt rolü)
        // Sadece role_id === 1 olanlar geçebilir
        const isSuperAdmin = user.role_id === 1;
        
        if (!isSuperAdmin) {
            console.log(`🚫 Yetkisiz Admin Erişim Denemesi - User ID: ${userId}, Role ID: ${user.role_id}, Role Name: ${user.role_name}`);
            return res.status(403).json({ message: 'Yetkiniz Yok! Bu işlem için Super Admin yetkisi gereklidir.' });
        }

        // Admin yetkisi var, devam et
        next();
    } catch (err) {
        console.error('❌ verifyAdmin Hatası:', err);
        res.status(500).json({ message: 'Yetki kontrolü hatası: ' + err.message });
    }
};

// --- MÜŞTERİ ROTALARI ---
app.get('/api/movies', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Movies ORDER BY movie_id');
        res.json({ success: true, data: result.rows });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/movies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM Movies WHERE movie_id = $1', [id]);
        if (result.rows.length > 0) res.json({ success: true, data: result.rows[0] });
        else res.status(404).json({ message: 'Film bulunamadı' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- YORUM VE PUANLAMA SİSTEMİ ---

// Bir filmin yorumlarını getir
app.get('/api/movies/:id/reviews', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Yorumları kullanıcı bilgileriyle birlikte getir
        const reviewsResult = await pool.query(`
            SELECT 
                r.review_id,
                r.user_id,
                r.rating,
                r.comment,
                r.created_at,
                u.first_name || ' ' || u.last_name AS user_name
            FROM Reviews r
            JOIN Users u ON r.user_id = u.user_id
            WHERE r.movie_id = $1
            ORDER BY r.created_at DESC
        `, [id]);

        // Ortalama puanı hesapla
        const avgRatingResult = await pool.query(`
            SELECT 
                COALESCE(AVG(rating), 0) as avg_rating,
                COUNT(*) as total_reviews
            FROM Reviews
            WHERE movie_id = $1
        `, [id]);

        res.json({
            success: true,
            reviews: reviewsResult.rows,
            averageRating: parseFloat(avgRatingResult.rows[0].avg_rating) || 0,
            totalReviews: parseInt(avgRatingResult.rows[0].total_reviews) || 0
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Yeni yorum ekle (Bilet kontrolü ile)
app.post('/api/reviews', async (req, res) => {
    const { userId, movieId, rating, comment } = req.body;

    try {
        // 1. Bilet kontrolü: Kullanıcı bu filme bilet almış mı?
        const ticketCheck = await pool.query(`
            SELECT COUNT(*) as ticket_count
            FROM Tickets t
            JOIN Sessions s ON t.session_id = s.session_id
            WHERE t.user_id = $1 AND s.movie_id = $2
        `, [userId, movieId]);

        if (parseInt(ticketCheck.rows[0].ticket_count) === 0) {
            return res.status(403).json({ 
                message: 'Bu filmi izlediğinize dair bilet kaydı bulunamadı. Yorum yapmak için önce bilet almalısınız.' 
            });
        }

        // 2. Daha önce yorum yapmış mı kontrol et (UNIQUE constraint)
        const existingReview = await pool.query(`
            SELECT review_id FROM Reviews WHERE user_id = $1 AND movie_id = $2
        `, [userId, movieId]);

        if (existingReview.rows.length > 0) {
            // Mevcut yorumu güncelle
            await pool.query(`
                UPDATE Reviews 
                SET rating = $1, comment = $2, created_at = CURRENT_TIMESTAMP
                WHERE review_id = $3
            `, [rating, comment, existingReview.rows[0].review_id]);
            
            res.json({ success: true, message: 'Yorumunuz güncellendi' });
        } else {
            // Yeni yorum ekle
            await pool.query(`
                INSERT INTO Reviews (user_id, movie_id, rating, comment)
                VALUES ($1, $2, $3, $4)
            `, [userId, movieId, rating, comment]);
            
            res.json({ success: true, message: 'Yorumunuz başarıyla eklendi' });
        }
    } catch (err) {
        if (err.code === '23505') { // Unique constraint violation
            res.status(400).json({ message: 'Bu film için zaten bir yorumunuz var' });
        } else {
            res.status(500).json({ message: err.message });
        }
    }
});

app.get('/api/seats/:movieId', async (req, res) => {
    const { movieId } = req.params;
    try {
        const query = `SELECT s.row_label || s.seat_number AS seat_label FROM Tickets t JOIN Seats s ON t.seat_id = s.seat_id JOIN Sessions sess ON t.session_id = sess.session_id WHERE sess.movie_id = $1`;
        const result = await pool.query(query, [movieId]);
        const occupiedSeats = result.rows.map(row => row.seat_label);
        res.json({ success: true, occupiedSeats });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- BÜFE ÜRÜNLERİ LİSTELEME ---
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT product_id, product_name, price, category, stock_quantity FROM Products WHERE is_active = true ORDER BY category, product_name'
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/tickets', async (req, res) => {
    const { movieId, selectedSeats } = req.body;
    try {
        const sessionRes = await pool.query('SELECT session_id, base_price FROM Sessions WHERE movie_id = $1 LIMIT 1', [movieId]);
        if (sessionRes.rows.length === 0) return res.status(404).json({ message: 'Seans yok' });
        const { session_id, base_price } = sessionRes.rows[0];

        for (const seatLabel of selectedSeats) {
            const row = seatLabel.charAt(0);
            const number = seatLabel.slice(1);
            const seatRes = await pool.query('SELECT seat_id FROM Seats WHERE row_label = $1 AND seat_number = $2 LIMIT 1', [row, number]);
            if (seatRes.rows.length > 0) {
                await pool.query('INSERT INTO Tickets (user_id, session_id, seat_id, price_paid, payment_method, booking_code) VALUES ($1, $2, $3, $4, $5, $6)', [1, session_id, seatRes.rows[0].seat_id, base_price, 'CREDIT_CARD', 'PNR-' + Date.now()]);
            }
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- KULLANICI KAYIT (REGISTER) ---
app.post('/api/register', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Email kontrolü
        const existingUser = await client.query('SELECT user_id FROM Users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor.' });
        }

        // Şifreyi hashle
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Kullanıcıyı ekle (role_id = 2 = Müşteri)
        // ÖNEMLİ: role_id = 1 = Super Admin (sadece veritabanından elle atanır)
        // role_id = 2 = Müşteri (varsayılan kayıt rolü)
        const userResult = await client.query(`
            INSERT INTO Users (role_id, first_name, last_name, email, password_hash)
            VALUES (2, $1, $2, $3, $4)
            RETURNING user_id, first_name, last_name, email
        `, [firstName, lastName, email, passwordHash]);

        const newUser = userResult.rows[0];

        // Otomatik Wallet oluştur
        await client.query(`
            INSERT INTO Wallets (user_id, balance)
            VALUES ($1, 0.00)
        `, [newUser.user_id]);

        await client.query('COMMIT');
        
        res.json({ 
            success: true, 
            message: 'Kayıt başarılı! Giriş yapabilirsiniz.',
            user: {
                user_id: newUser.user_id,
                first_name: newUser.first_name,
                last_name: newUser.last_name,
                email: newUser.email
            }
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ REGISTER HATASI:', err);
        res.status(500).json({ message: 'Kayıt hatası: ' + err.message });
    } finally {
        client.release();
    }
});

// --- GENEL GİRİŞ (LOGIN) - Hem Admin hem Müşteri ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('🔑 Giriş Denemesi:', email);

    try {
        // Kullanıcıyı Bul
        const userRes = await pool.query(`
            SELECT u.user_id, u.first_name, u.last_name, u.password_hash, u.role_id, r.role_name
            FROM Users u
            JOIN Roles r ON u.role_id = r.role_id
            WHERE u.email = $1
        `, [email]);

        if (userRes.rows.length === 0) {
            console.log('❌ Kullanıcı Bulunamadı');
            return res.status(400).json({ message: 'Kullanıcı bulunamadı.' });
        }

        const user = userRes.rows[0];
        console.log('👤 Kullanıcı Bulundu, Şifre Kontrol Ediliyor...');

        // Şifre Kontrolü
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            console.log('❌ Şifre Yanlış');
            return res.status(400).json({ message: 'Şifre yanlış.' });
        }

        console.log('✅ Giriş Başarılı, Token Üretiliyor...');
        const fullName = `${user.first_name} ${user.last_name}`;
        const token = jwt.sign({ 
            userId: user.user_id, 
            role: user.role_name,
            fullName: fullName
        }, JWT_SECRET, { expiresIn: '24h' });

        res.json({ 
            success: true, 
            token,
            user: {
                user_id: user.user_id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: email,
                role_id: user.role_id,
                role: user.role_name,
                fullName: fullName
            },
            message: 'Giriş başarılı' 
        });

    } catch (err) {
        console.error('💥 LOGIN PATLADI:', err);
        res.status(500).json({ message: 'Sunucu Hatası: ' + err.message });
    }
});

// --- ADMIN LOGIN (BURASI DÜZELTİLDİ) ---
app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('🔑 Giriş Denemesi:', email); // LOG 1

    try {
        // Kullanıcıyı Bul
        const userRes = await pool.query(`
            SELECT u.user_id, u.password_hash, r.role_name
            FROM Users u
            JOIN Roles r ON u.role_id = r.role_id
            WHERE u.email = $1
        `, [email]);

        if (userRes.rows.length === 0) {
            console.log('❌ Kullanıcı Bulunamadı');
            return res.status(400).json({ message: 'Kullanıcı bulunamadı.' });
        }

        const user = userRes.rows[0];
        console.log('👤 Kullanıcı Bulundu, Şifre Kontrol Ediliyor...'); // LOG 2

        // Şifre Kontrolü
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            console.log('❌ Şifre Yanlış');
            return res.status(400).json({ message: 'Şifre yanlış.' });
        }

        console.log('✅ Giriş Başarılı, Token Üretiliyor...'); // LOG 3
        const token = jwt.sign({ id: user.user_id, role: user.role_name }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ success: true, token, message: 'Giriş başarılı' });

    } catch (err) {
        console.error('💥 LOGIN PATLADI:', err); // LOG 4 (Asıl Hatayı Burda Göreceğiz)
        res.status(500).json({ message: 'Sunucu Hatası: ' + err.message });
    }
});

// --- ADMIN İSTATİSTİKLERİ ---
app.get('/api/admin/stats', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const incomeRes = await pool.query('SELECT SUM(price_paid) as total_income FROM Tickets');
        const ticketRes = await pool.query('SELECT COUNT(*) as total_tickets FROM Tickets');
        const movieRes = await pool.query('SELECT COUNT(*) as total_movies FROM Movies');
        res.json({
            success: true,
            stats: {
                totalIncome: incomeRes.rows[0].total_income || 0,
                totalTickets: ticketRes.rows[0].total_tickets || 0,
                totalMovies: movieRes.rows[0].total_movies || 0
            }
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- ADMIN FİLM LİSTESİ (YENİ EKLENDİ) ---
app.get('/api/admin/movies', authenticateToken, verifyAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Movies ORDER BY movie_id DESC');
        res.json({ success: true, data: result.rows });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/admin/movies', authenticateToken, verifyAdmin, async (req, res) => {
    const { title, description, duration_minutes, poster_url, language, age_restriction } = req.body;

    console.log('🎬 Film Ekleme İsteği:', title);

    try {
        // 1. Filmi Ekle
        const queryMovie = `
            INSERT INTO Movies (title, description, duration_minutes, poster_url, language, age_restriction, release_date, imdb_rating) 
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), 0.0) 
            RETURNING *
        `;
        const valuesMovie = [title, description, duration_minutes, poster_url, language, age_restriction];

        const resultMovie = await pool.query(queryMovie, valuesMovie);
        const newMovie = resultMovie.rows[0];
        console.log('✅ Film Eklendi:', newMovie.title);

        // 2. Otomatik Seans Ekle (Varsayılan)
        const querySession = `
            INSERT INTO Sessions (movie_id, cinema_id, hall_id, session_datetime, base_price)
            VALUES ($1, 1, 1, NOW(), 150)
        `;
        await pool.query(querySession, [newMovie.movie_id]);
        console.log('✅ Otomatik Seans Oluşturuldu (Salon 1, 150 TL)');

        res.json({ success: true, data: newMovie });
    } catch (err) {
        console.error('❌ FİLM EKLEME HATASI:', err.message);
        res.status(500).json({ message: 'Veritabanı Hatası: ' + err.message });
    }
});

app.put('/api/admin/movies/:id', authenticateToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    const { title, description, duration_minutes, poster_url, language, age_restriction, release_date, imdb_rating } = req.body;

    console.log('🎬 Film Güncelleme İsteği:', title, 'ID:', id);

    try {
        const query = `
            UPDATE Movies 
            SET title = $1, description = $2, duration_minutes = $3, poster_url = $4, language = $5, age_restriction = $6, release_date = $7, imdb_rating = $8
            WHERE movie_id = $9
            RETURNING *
        `;
        const values = [title, description, duration_minutes, poster_url, language, age_restriction, release_date, imdb_rating, id];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Film bulunamadı.' });
        }

        console.log('✅ Film Güncellendi:', result.rows[0].title);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('❌ FİLM GÜNCELLEME HATASI:', err.message);
        res.status(500).json({ message: 'Veritabanı Hatası: ' + err.message });
    }
});

app.delete('/api/admin/movies/:id', authenticateToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM Movies WHERE movie_id = $1', [id]);
        res.json({ success: true, message: 'Film silindi' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- CÜZDAN İŞLEMLERİ ---

// 1. Bakiye Sorgulama (Yoksa oluşturur)
app.get('/api/wallet/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        let result = await pool.query('SELECT * FROM Wallets WHERE user_id = $1', [userId]);
        if (result.rows.length === 0) {
            // Cüzdan yoksa oluştur
            result = await pool.query('INSERT INTO Wallets (user_id, balance) VALUES ($1, 0.00) RETURNING *', [userId]);
        }
        res.json({ success: true, wallet: result.rows[0] });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. Para Yükleme (Transaction ile)
app.post('/api/wallet/deposit', async (req, res) => {
    const { userId, amount } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Bakiyeyi Güncelle
        const updateRes = await client.query(
            'UPDATE Wallets SET balance = balance + $1, last_updated = NOW() WHERE user_id = $2 RETURNING *',
            [amount, userId]
        );

        if (updateRes.rows.length === 0) {
            throw new Error('Cüzdan bulunamadı');
        }

        const wallet = updateRes.rows[0];

        // 2. İşlem Kaydı At
        await client.query(
            'INSERT INTO Wallet_Transactions (wallet_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
            [wallet.wallet_id, amount, 'DEPOSIT', 'Bakiye Yükleme']
        );

        await client.query('COMMIT');
        res.json({ success: true, wallet });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: err.message });
    } finally {
        client.release();
    }
});

// 3. Cüzdanla Bilet + Büfe Satın Alma (%10 İndirimli)
app.post('/api/tickets/buy-with-wallet', async (req, res) => {
    const { userId, movieId, selectedSeats, products } = req.body; 
    // selectedSeats: ['A1', 'B2']
    // products: [{productId: 1, quantity: 2}, {productId: 2, quantity: 1}]
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Seans ve Fiyat Bilgisini Al
        const sessionRes = await client.query('SELECT session_id, base_price, cinema_id FROM Sessions WHERE movie_id = $1 LIMIT 1', [movieId]);
        if (sessionRes.rows.length === 0) throw new Error('Seans bulunamadı');

        const { session_id, base_price, cinema_id } = sessionRes.rows[0];
        const seatCount = selectedSeats.length;
        let ticketTotal = parseFloat(base_price) * seatCount;

        // 2. Ürün Toplam Tutarını Hesapla
        let productTotal = 0;
        const productDetails = [];

        if (products && products.length > 0) {
            for (const item of products) {
                const productRes = await client.query(
                    'SELECT product_id, product_name, price, stock_quantity FROM Products WHERE product_id = $1 AND is_active = true',
                    [item.productId]
                );
                
                if (productRes.rows.length === 0) {
                    throw new Error(`Ürün bulunamadı: ${item.productId}`);
                }

                const product = productRes.rows[0];
                
                // Stok kontrolü
                if (product.stock_quantity < item.quantity) {
                    throw new Error(`Yetersiz stok: ${product.product_name}`);
                }

                const itemTotal = parseFloat(product.price) * item.quantity;
                productTotal += itemTotal;
                
                productDetails.push({
                    productId: product.product_id,
                    name: product.product_name,
                    quantity: item.quantity,
                    unitPrice: parseFloat(product.price),
                    total: itemTotal
                });
            }
        }

        // 3. Toplam Tutar ve %10 İndirim Uygula
        const grandTotal = ticketTotal + productTotal;
        const discountedAmount = grandTotal * 0.90;

        // 4. Bakiye Kontrolü
        const walletRes = await client.query('SELECT * FROM Wallets WHERE user_id = $1', [userId]);
        if (walletRes.rows.length === 0) throw new Error('Cüzdan bulunamadı');

        const wallet = walletRes.rows[0];
        if (parseFloat(wallet.balance) < discountedAmount) {
            throw new Error('Yetersiz Bakiye');
        }

        // 5. Bakiye Düş
        await client.query('UPDATE Wallets SET balance = balance - $1 WHERE wallet_id = $2', [discountedAmount, wallet.wallet_id]);

        // 6. İşlem Kaydı (Bilet + Büfe)
        const description = productDetails.length > 0 
            ? `${seatCount} bilet + ${productDetails.map(p => `${p.quantity}x ${p.name}`).join(', ')} (Film ID: ${movieId})`
            : `${seatCount} adet bilet alımı (Film ID: ${movieId})`;
            
        await client.query(
            'INSERT INTO Wallet_Transactions (wallet_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
            [wallet.wallet_id, discountedAmount, 'PURCHASE', description]
        );

        // 7. Biletleri Oluştur
        const discountedTicketPrice = (ticketTotal * 0.90) / seatCount; // Her bilet için indirimli fiyat
        
        for (const seatLabel of selectedSeats) {
            const row = seatLabel.charAt(0);
            const number = seatLabel.slice(1);

            const seatRes = await client.query('SELECT seat_id FROM Seats WHERE row_label = $1 AND seat_number = $2 LIMIT 1', [row, number]);
            if (seatRes.rows.length > 0) {
                const seatId = seatRes.rows[0].seat_id;

                await client.query(
                    'INSERT INTO Tickets (user_id, session_id, seat_id, price_paid, payment_method, booking_code) VALUES ($1, $2, $3, $4, $5, $6)',
                    [userId, session_id, seatId, discountedTicketPrice, 'WALLET', 'PNR-' + Date.now() + Math.floor(Math.random() * 1000)]
                );
            }
        }

        // 8. Ürün Satışlarını Kaydet (Sales tablosuna)
        if (productDetails.length > 0) {
            for (const item of productDetails) {
                const discountedUnitPrice = item.unitPrice * 0.90;
                const discountedTotal = item.total * 0.90;

                await client.query(
                    'INSERT INTO Sales (user_id, product_id, cinema_id, quantity, unit_price, total_price, payment_method) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [userId, item.productId, cinema_id, item.quantity, discountedUnitPrice, discountedTotal, 'WALLET']
                );
            }
        }

        await client.query('COMMIT');
        res.json({ 
            success: true, 
            message: productDetails.length > 0 
                ? 'Biletler ve büfe ürünleri başarıyla alındı' 
                : 'Biletler başarıyla alındı', 
            newBalance: parseFloat(wallet.balance) - discountedAmount,
            ticketTotal: ticketTotal * 0.90,
            productTotal: productTotal * 0.90,
            grandTotal: discountedAmount
        });

    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ message: err.message });
    } finally {
        client.release();
    }
});

// --- YEDEKLEME SİSTEMİ ---

const backupDatabase = () => {
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    const date = new Date();
    const formattedDate = date.toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + date.getHours() + '-' + date.getMinutes();
    const fileName = `backup_${formattedDate}.sql`;
    const filePath = path.join(backupDir, fileName);

    // 1. pg_dump Tam Yolu (Windows için)
    const pgDumpPath = `"C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe"`;

    // 2. Komut Yapısı (Redirection > kullanarak)
    const command = `${pgDumpPath} -U ${process.env.DB_USER || 'postgres'} -h ${process.env.DB_HOST || 'localhost'} -p ${process.env.DB_PORT || 5432} ${process.env.DB_NAME || 'CinemaDB'} > "${filePath}"`;

    // 3. Env ile şifre (exec options içinde)
    exec(command, { env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD } }, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Yedekleme Hatası: ${error.message}`);
            return;
        }
        // pg_dump bazen stderr'e bilgi basar, bu bir hata olmayabilir
        if (stderr) {
            console.log(`ℹ️ Yedekleme Bilgisi: ${stderr}`);
        }
        console.log(`✅ Veritabanı Yedeği Alındı: ${fileName}`);
    });

    return fileName;
};

// Manuel Yedekleme Tetikleyici (Admin)
app.get('/api/admin/backup', authenticateToken, verifyAdmin, (req, res) => {
    try {
        const fileName = backupDatabase();
        res.json({ success: true, message: 'Yedekleme işlemi başlatıldı.', fileName });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Otomatik Yedekleme (Her gece 03:00)
cron.schedule('0 3 * * *', () => {
    console.log('🕒 Otomatik Yedekleme Başlatılıyor...');
    backupDatabase();
});

// Backend başladığında seed çalıştır (pool tanımlandıktan sonra)
createReviewsTable();
seedProducts();

app.listen(PORT, () => console.log(`🚀 Sunucu ${PORT} portunda çalışıyor...`));
