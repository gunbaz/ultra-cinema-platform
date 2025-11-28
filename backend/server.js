const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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

app.post('/api/admin/movies', authenticateToken, async (req, res) => {
    const { title, description, duration_minutes, poster_url, language, age_restriction } = req.body;

    console.log('🎬 Film Ekleme İsteği:', title); // Log

    try {
        // DÜZELTME: release_date eklendi (NOW())
        const query = `
            INSERT INTO Movies (title, description, duration_minutes, poster_url, language, age_restriction, release_date, imdb_rating) 
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), 0.0) 
            RETURNING *
        `;
        const values = [title, description, duration_minutes, poster_url, language, age_restriction];

        const result = await pool.query(query, values);
        console.log('✅ Film Eklendi:', result.rows[0].title);

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('❌ FİLM EKLEME HATASI:', err.message);
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

app.listen(PORT, () => console.log(`🚀 Sunucu ${PORT} portunda çalışıyor...`));
