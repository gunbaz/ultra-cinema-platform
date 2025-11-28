// Film rotaları (Movies Routes)
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/movies - Tüm filmleri getir
router.get('/', async (req, res) => {
    try {
        // Veritabanından tüm filmleri çek
        const result = await db.query(
            'SELECT * FROM Movies ORDER BY release_date DESC'
        );

        // Başarılı yanıt döndür
        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows,
        });
    } catch (error) {
        console.error('❌ Film listesi getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Filmler getirilirken bir hata oluştu',
            error: error.message,
        });
    }
});

// GET /api/movies/:id - Belirli bir filmi getir
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'SELECT * FROM Movies WHERE movie_id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Film bulunamadı',
            });
        }

        res.status(200).json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('❌ Film detay getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Film detayı getirilirken bir hata oluştu',
            error: error.message,
        });
    }
});

// POST /api/movies - Yeni film ekle (Admin için)
router.post('/', async (req, res) => {
    try {
        const {
            title,
            original_title,
            duration_minutes,
            description,
            release_date,
            imdb_rating,
            age_restriction,
            language,
            poster_url,
            trailer_url,
        } = req.body;

        // SQL injection'a karşı parametreli sorgu kullan
        const result = await db.query(
            `INSERT INTO Movies (
        title, original_title, duration_minutes, description,
        release_date, imdb_rating, age_restriction, language,
        poster_url, trailer_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
            [
                title,
                original_title,
                duration_minutes,
                description,
                release_date,
                imdb_rating,
                age_restriction,
                language,
                poster_url,
                trailer_url,
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Film başarıyla eklendi',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('❌ Film ekleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Film eklenirken bir hata oluştu',
            error: error.message,
        });
    }
});

module.exports = router;
