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

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

app.use(cors());
app.use(express.json());

// Detaylı Loglama
app.use((req, res, next) => {
    console.log(`📩 [${req.method}] ${req.path}`);
    next();
});

const pool = new Pool({
    user: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'CinemaDB',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});



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

app.get('/api/seats/:movieId', async (req, res) => {
    const { movieId } = req.params;
    try {
        const query = `SELECT s.row_label || s.seat_number AS seat_label FROM Tickets t JOIN Seats s ON t.seat_id = s.seat_id JOIN Sessions sess ON t.session_id = sess.session_id WHERE sess.movie_id = $1`;
        const result = await pool.query(query, [movieId]);
        const occupiedSeats = result.rows.map(row => row.seat_label);
        res.json({ success: true, occupiedSeats });
    } catch (err) { res.status(500).json({ message: err.message }); }
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
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
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
app.get('/api/admin/movies', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Movies ORDER BY movie_id DESC');
        res.json({ success: true, data: result.rows });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/admin/movies', authenticateToken, async (req, res) => {
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

app.put('/api/admin/movies/:id', authenticateToken, async (req, res) => {
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

app.delete('/api/admin/movies/:id', authenticateToken, async (req, res) => {
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

// 3. Cüzdanla Bilet Satın Alma (%10 İndirimli)
app.post('/api/tickets/buy-with-wallet', async (req, res) => {
    const { userId, movieId, selectedSeats } = req.body; // selectedSeats: ['A1', 'B2']
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Seans ve Fiyat Bilgisini Al
        const sessionRes = await client.query('SELECT session_id, base_price FROM Sessions WHERE movie_id = $1 LIMIT 1', [movieId]);
        if (sessionRes.rows.length === 0) throw new Error('Seans bulunamadı');

        const { session_id, base_price } = sessionRes.rows[0];
        const seatCount = selectedSeats.length;
        const totalAmount = parseFloat(base_price) * seatCount;

        // 3. %10 İndirim Uygula
        const discountedAmount = totalAmount * 0.90;

        // 4. Bakiye Kontrolü
        const walletRes = await client.query('SELECT * FROM Wallets WHERE user_id = $1', [userId]);
        if (walletRes.rows.length === 0) throw new Error('Cüzdan bulunamadı');

        const wallet = walletRes.rows[0];
        if (parseFloat(wallet.balance) < discountedAmount) {
            throw new Error('Yetersiz Bakiye');
        }

        // 5. Bakiye Düş
        await client.query('UPDATE Wallets SET balance = balance - $1 WHERE wallet_id = $2', [discountedAmount, wallet.wallet_id]);

        // 6. İşlem Kaydı
        await client.query(
            'INSERT INTO Wallet_Transactions (wallet_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
            [wallet.wallet_id, discountedAmount, 'PURCHASE', `${seatCount} adet bilet alımı (Film ID: ${movieId})`]
        );

        // 7. Biletleri Oluştur
        for (const seatLabel of selectedSeats) {
            const row = seatLabel.charAt(0);
            const number = seatLabel.slice(1);

            // Koltuk ID bul
            const seatRes = await client.query('SELECT seat_id FROM Seats WHERE row_label = $1 AND seat_number = $2 LIMIT 1', [row, number]);
            if (seatRes.rows.length > 0) {
                const seatId = seatRes.rows[0].seat_id;

                // Bileti Ekle
                await client.query(
                    'INSERT INTO Tickets (user_id, session_id, seat_id, price_paid, payment_method, booking_code) VALUES ($1, $2, $3, $4, $5, $6)',
                    [userId, session_id, seatId, (discountedAmount / seatCount), 'WALLET', 'PNR-' + Date.now() + Math.floor(Math.random() * 1000)]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Biletler başarıyla alındı', newBalance: parseFloat(wallet.balance) - discountedAmount });

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
app.get('/api/admin/backup', authenticateToken, (req, res) => {
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

app.listen(PORT, () => console.log(`🚀 Sunucu ${PORT} portunda çalışıyor...`));
