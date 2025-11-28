// Koltuk ve Bilet rotaları (Seats & Tickets Routes)
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/seats/:movieId - Belirli bir filme ait satılmış koltukları getir
router.get('/:movieId', async (req, res) => {
    try {
        const { movieId } = req.params;

        // Önce bu filme ait aktif seansları bul (şimdilik ilk seansı kullanıyoruz)
        const sessionQuery = `
      SELECT session_id FROM Sessions 
      WHERE movie_id = $1 AND is_active = TRUE 
      LIMIT 1
    `;
        const sessionResult = await db.query(sessionQuery, [movieId]);

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bu film için aktif seans bulunamadı',
            });
        }

        const sessionId = sessionResult.rows[0].session_id;

        // Bu seansta satılmış koltukları getir
        const ticketsQuery = `
      SELECT s.row_label, s.seat_number
      FROM Tickets t
      JOIN Seats s ON t.seat_id = s.seat_id
      WHERE t.session_id = $1
    `;
        const ticketsResult = await db.query(ticketsQuery, [sessionId]);

        // Koltuk etiketlerini oluştur (A1, B3 formatında)
        const occupiedSeats = ticketsResult.rows.map(
            (row) => `${row.row_label}${row.seat_number}`
        );

        res.status(200).json({
            success: true,
            sessionId: sessionId,
            occupiedSeats: occupiedSeats,
            count: occupiedSeats.length,
        });
    } catch (error) {
        console.error('❌ Satılmış koltuklar getirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Koltuk bilgileri alınırken hata oluştu',
            error: error.message,
        });
    }
});

// POST /api/tickets - Yeni bilet kaydet
router.post('/', async (req, res) => {
    try {
        const { movieId, selectedSeats } = req.body;

        // Validasyon
        if (!movieId || !selectedSeats || selectedSeats.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Film ID ve koltuk seçimi gerekli',
            });
        }

        // Önce bu filme ait aktif seansı bul
        const sessionQuery = `
      SELECT s.session_id, s.base_price, h.hall_id
      FROM Sessions s
      JOIN Halls h ON s.hall_id = h.hall_id
      WHERE s.movie_id = $1 AND s.is_active = TRUE
      LIMIT 1
    `;
        const sessionResult = await db.query(sessionQuery, [movieId]);

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bu film için aktif seans bulunamadı',
            });
        }

        const { session_id, base_price, hall_id } = sessionResult.rows[0];

        // Her seçilen koltuk için bilet oluştur
        const tickets = [];
        const userId = 1; // Şimdilik sabit kullanıcı ID (giriş sistemi sonra eklenecek)

        for (const seatLabel of selectedSeats) {
            // Koltuk etiketini ayrıştır (A1 -> row: A, number: 1)
            const row = seatLabel.charAt(0);
            const number = parseInt(seatLabel.substring(1));

            // Bu koltuk etiketine ait seat_id'yi bul
            const seatQuery = `
        SELECT s.seat_id, st.price_multiplier
        FROM Seats s
        JOIN SeatTypes st ON s.seat_type_id = st.seat_type_id
        WHERE s.hall_id = $1 
        AND s.row_label = $2 
        AND s.seat_number = $3
        AND s.is_active = TRUE
      `;
            const seatResult = await db.query(seatQuery, [hall_id, row, number]);

            if (seatResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `Koltuk ${seatLabel} bulunamadı`,
                });
            }

            const { seat_id, price_multiplier } = seatResult.rows[0];

            // Fiyatı hesapla (temel fiyat * koltuk tipi çarpanı)
            const finalPrice = base_price * price_multiplier;

            // Rezervasyon kodu oluştur (benzersiz)
            const bookingCode = `UCS${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

            // Bu koltuk zaten satılmış mı kontrol et
            const checkQuery = `
        SELECT ticket_id FROM Tickets 
        WHERE session_id = $1 AND seat_id = $2
      `;
            const checkResult = await db.query(checkQuery, [session_id, seat_id]);

            if (checkResult.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: `Koltuk ${seatLabel} zaten satılmış`,
                });
            }

            // Bileti veritabanına kaydet
            const insertQuery = `
        INSERT INTO Tickets (
          user_id, session_id, seat_id, price_paid, 
          payment_method, booking_code
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING ticket_id, booking_code
      `;
            const insertResult = await db.query(insertQuery, [
                userId,
                session_id,
                seat_id,
                finalPrice,
                'WALLET', // Şimdilik sabit ödeme metodu
                bookingCode,
            ]);

            tickets.push({
                ticketId: insertResult.rows[0].ticket_id,
                bookingCode: insertResult.rows[0].booking_code,
                seat: seatLabel,
                price: finalPrice,
            });
        }

        res.status(201).json({
            success: true,
            message: 'Biletler başarıyla oluşturuldu',
            tickets: tickets,
            totalPrice: tickets.reduce((sum, t) => sum + parseFloat(t.price), 0),
        });
    } catch (error) {
        console.error('❌ Bilet oluşturma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Bilet oluşturulurken hata oluştu',
            error: error.message,
        });
    }
});

module.exports = router;
