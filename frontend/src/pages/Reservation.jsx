import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const COLS = [1, 2, 3, 4, 5, 6, 7, 8];

// StarRating Bileşeni - Overlay (Katman) Mantığı ile Hassas Gösterim
const StarRating = ({ rating = 0, interactive = false, onChange, size = 'text-2xl' }) => {
    const [hoveredStar, setHoveredStar] = useState(0);
    const [displayRating, setDisplayRating] = useState(rating);

    useEffect(() => {
        setDisplayRating(rating);
    }, [rating]);

    // Size prop'una göre boyut belirleme
    const getSizeClasses = () => {
        switch (size) {
            case 'text-lg':
                return 'w-5 h-5';
            case 'text-2xl':
                return 'w-6 h-6';
            case 'text-3xl':
                return 'w-8 h-8';
            default:
                return 'w-6 h-6';
        }
    };

    const containerSize = getSizeClasses();

    // Yıldız SVG'si (sabit, tekrar kullanılabilir)
    const StarSVG = () => (
        <svg
            className="w-full h-full"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                fill="currentColor"
            />
        </svg>
    );

    const handleStarClick = (starIndex) => {
        if (interactive && onChange) {
            onChange(starIndex);
            setDisplayRating(starIndex);
        }
    };

    const handleStarHover = (starIndex) => {
        if (interactive) {
            setHoveredStar(starIndex);
        }
    };

    const handleMouseLeave = () => {
        if (interactive) {
            setHoveredStar(0);
        }
    };

    // Her yıldız için doluluk yüzdesini hesapla
    const getStarFillPercentage = (index) => {
        if (interactive) {
            // İnteraktif mod: hover veya seçili puan
            const activeRating = hoveredStar || displayRating;
            if (index <= activeRating) return 100;
            return 0;
        } else {
            // Gösterim modu: hassas puan gösterimi
            if (index <= Math.floor(displayRating)) return 100;
            if (index === Math.ceil(displayRating) && displayRating % 1 !== 0) {
                // Kısmi yıldız: ondalık kısmı yüzdeye çevir
                return (displayRating % 1) * 100;
            }
            return 0;
        }
    };

    return (
        <div 
            className="flex items-center gap-1"
            onMouseLeave={handleMouseLeave}
        >
            {[1, 2, 3, 4, 5].map((starIndex) => {
                const fillPercentage = getStarFillPercentage(starIndex);
                
                return (
                    <div
                        key={starIndex}
                        onClick={() => handleStarClick(starIndex)}
                        onMouseEnter={() => handleStarHover(starIndex)}
                        className={`relative ${containerSize} ${interactive ? 'cursor-pointer transform hover:scale-110 transition-transform' : ''}`}
                    >
                        {/* Altta: Gri yıldız (sabit) */}
                        <div className="absolute inset-0 text-zinc-700">
                            <StarSVG />
                        </div>
                        
                        {/* Üstte: Sarı yıldız (width ile kontrol ediliyor) */}
                        <div 
                            className="absolute inset-0 text-yellow-400 overflow-hidden"
                            style={{ width: `${fillPercentage}%` }}
                        >
                            <StarSVG />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default function Reservation() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [occupiedSeats, setOccupiedSeats] = useState([]);
    const [wallet, setWallet] = useState(null);
    const [products, setProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState({}); // { productId: quantity }
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const { user } = useAuth();
    const userId = user?.user_id;

    useEffect(() => {
        if (!userId) return;
        
        axios.get(`${API_URL}/api/movies/${id}`).then(res => setMovie(res.data.data));
        axios.get(`${API_URL}/api/seats/${id}`).then(res => setOccupiedSeats(res.data.occupiedSeats || []));
        axios.get(`${API_URL}/api/wallet/${userId}`).then(res => setWallet(res.data.wallet));
        axios.get(`${API_URL}/api/products`).then(res => setProducts(res.data.data || []));
        
        // Yorumları yükle
        axios.get(`${API_URL}/api/movies/${id}/reviews`)
            .then(res => {
                setReviews(res.data.reviews || []);
                setAverageRating(res.data.averageRating || 0);
                setTotalReviews(res.data.totalReviews || 0);
            })
            .catch(err => console.error('Yorumlar yüklenemedi:', err));
    }, [id, userId]);

    const toggleSeat = (sid) => {
        if (occupiedSeats.includes(sid)) return;
        setSelectedSeats(prev => prev.includes(sid) ? prev.filter(s => s !== sid) : [...prev, sid]);
    };

    // Ürün miktarını artır
    const increaseProduct = (productId) => {
        setSelectedProducts(prev => ({
            ...prev,
            [productId]: (prev[productId] || 0) + 1
        }));
    };

    // Ürün miktarını azalt
    const decreaseProduct = (productId) => {
        setSelectedProducts(prev => {
            const current = prev[productId] || 0;
            if (current <= 1) {
                const { [productId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [productId]: current - 1 };
        });
    };

    const handleCreditCardPayment = async () => {
        // Sepet kontrolü
        const hasProducts = Object.keys(selectedProducts).length > 0;
        
        if (selectedSeats.length === 0 && !hasProducts) {
            alert('Lütfen rezervasyon yapmak için koltuk seçiniz.');
            return;
        }
        
        if (selectedSeats.length === 0 && hasProducts) {
            alert('Lütfen önce bilet seçiniz! Bilet olmadan sadece büfe ürünü alınamaz.');
            return;
        }

        if (!confirm('Kredi Kartı ile ödemeyi onaylıyor musunuz?')) return;
        try {
            await axios.post(`${API_URL}/api/tickets`, { movieId: id, selectedSeats });
            alert('Bilet Alındı! (Kredi Kartı)');
            navigate('/');
        } catch (err) {
            alert('Hata: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleWalletPayment = async () => {
        // Sepet kontrolü
        const hasProducts = Object.keys(selectedProducts).length > 0;
        
        if (selectedSeats.length === 0 && !hasProducts) {
            alert('Lütfen rezervasyon yapmak için koltuk seçiniz.');
            return;
        }
        
        if (selectedSeats.length === 0 && hasProducts) {
            alert('Lütfen önce bilet seçiniz! Bilet olmadan sadece büfe ürünü alınamaz.');
            return;
        }

        // Yetersiz bakiye kontrolü
        if (!canAfford) {
            if (confirm('Bakiyeniz yetersiz. Cüzdan sayfasına gidip yükleme yapmak ister misiniz?')) {
                navigate('/wallet');
            }
            return;
        }

        const productText = Object.keys(selectedProducts).length > 0 
            ? ' ve büfe ürünlerini' 
            : '';
        if (!confirm(`Cüzdan ile bilet${productText} ödemeyi onaylıyor musunuz? (%10 İndirimli)`)) return;

        // Ürünleri API formatına çevir
        const productsPayload = Object.entries(selectedProducts).map(([productId, quantity]) => ({
            productId: parseInt(productId),
            quantity
        }));

        try {
            const response = await axios.post(`${API_URL}/api/tickets/buy-with-wallet`, { 
                userId, 
                movieId: id, 
                selectedSeats,
                products: productsPayload
            });
            
            const message = productsPayload.length > 0 
                ? 'Biletler ve büfe ürünleri Cüzdanla Alındı!' 
                : 'Biletler Cüzdanla Alındı!';
            alert(message);
            navigate('/');
        } catch (err) {
            alert('Hata: ' + (err.response?.data?.message || err.message));
        }
    };

    // Yorum gönderme fonksiyonu
    const handleSubmitReview = async () => {
        if (userRating === 0) {
            alert('Lütfen bir puan seçiniz (1-5 yıldız)');
            return;
        }

        if (!userComment.trim()) {
            alert('Lütfen yorumunuzu yazınız');
            return;
        }

        setIsSubmittingReview(true);
        try {
            await axios.post(`${API_URL}/api/reviews`, {
                userId,
                movieId: id,
                rating: userRating,
                comment: userComment.trim()
            });

            // Yorumları yeniden yükle
            const res = await axios.get(`${API_URL}/api/movies/${id}/reviews`);
            setReviews(res.data.reviews || []);
            setAverageRating(res.data.averageRating || 0);
            setTotalReviews(res.data.totalReviews || 0);

            // Formu temizle
            setUserRating(0);
            setUserComment('');
            alert('Yorumunuz başarıyla eklendi!');
        } catch (err) {
            alert('Hata: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmittingReview(false);
        }
    };

    if (!movie || !wallet) return <div className="text-white text-center mt-20">Yükleniyor...</div>;

    // Bilet fiyatı hesaplama
    const ticketPrice = selectedSeats.length * 150;
    
    // Ürün fiyatı hesaplama
    const productPrice = Object.entries(selectedProducts).reduce((total, [productId, quantity]) => {
        const product = products.find(p => p.product_id === parseInt(productId));
        return total + (product ? parseFloat(product.price) * quantity : 0);
    }, 0);

    // Toplam fiyat
    const normalPrice = ticketPrice + productPrice;
    const discountedPrice = normalPrice * 0.90;
    const canAfford = parseFloat(wallet.balance) >= discountedPrice;

    // Ürünleri kategorilere göre grupla
    const productsByCategory = products.reduce((acc, product) => {
        const category = product.category || 'Diğer';
        if (!acc[category]) acc[category] = [];
        acc[category].push(product);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sol: Koltuk Seçimi */}
                <div className="lg:col-span-2">
                    <h2 className="text-4xl font-bold mb-10 text-red-600">{movie.title}</h2>
                    <div className="w-full h-16 bg-white/10 rounded-t-[50%] mb-12 flex items-center justify-center text-sm tracking-[1em]">PERDE</div>
                    <div className="grid grid-cols-8 gap-3 justify-center max-w-md mx-auto">
                        {ROWS.map(row => COLS.map(col => {
                            const sid = `${row}${col}`;
                            const isSel = selectedSeats.includes(sid);
                            const isOcc = occupiedSeats.includes(sid);
                            return <button key={sid} onClick={() => toggleSeat(sid)} disabled={isOcc} className={`h-10 w-full rounded text-xs font-bold ${isOcc ? 'bg-red-900 cursor-not-allowed' : isSel ? 'bg-green-500 text-black' : 'bg-gray-800 hover:bg-gray-700'}`}>{sid}</button>
                        }))}
                    </div>
                </div>

                {/* Sağ: Büfe + Özet Panel */}
                <div className="space-y-6">
                    {/* Büfe Bölümü */}
                    <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl">
                        <div className="flex items-center gap-3 mb-5 border-b border-zinc-700 pb-4">
                            <span className="text-2xl">🍿</span>
                            <h3 className="text-xl font-bold text-amber-500">Büfe Ekle</h3>
                        </div>

                        {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                            <div key={category} className="mb-4">
                                <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2 font-semibold">
                                    {category === 'Yiyecek' ? '🌽 Yiyecek' : '🥤 İçecek'}
                                </p>
                                <div className="space-y-2">
                                    {categoryProducts.map(product => {
                                        const quantity = selectedProducts[product.product_id] || 0;
                                        return (
                                            <div key={product.product_id} className="flex items-center justify-between bg-zinc-800/50 rounded-xl p-3 hover:bg-zinc-800 transition">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{product.product_name}</p>
                                                    <p className="text-amber-500 font-bold text-sm">{parseFloat(product.price).toLocaleString('tr-TR')} TL</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {quantity > 0 && (
                                                        <button
                                                            onClick={() => decreaseProduct(product.product_id)}
                                                            className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center transition"
                                                        >
                                                            −
                                                        </button>
                                                    )}
                                                    <span className={`w-8 text-center font-bold ${quantity > 0 ? 'text-green-400' : 'text-zinc-600'}`}>
                                                        {quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => increaseProduct(product.product_id)}
                                                        className="w-8 h-8 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold flex items-center justify-center transition"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {products.length === 0 && (
                            <p className="text-zinc-500 text-sm text-center py-4">Büfe ürünleri yükleniyor...</p>
                        )}
                    </div>

                    {/* Özet Panel */}
                    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl">
                        <h3 className="text-xl font-bold mb-5 border-b border-gray-700 pb-4">📋 Sipariş Özeti</h3>

                        <div className="mb-5 space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Cüzdan Bakiyeniz:</span>
                                <span className="text-white font-bold">{parseFloat(wallet.balance).toLocaleString('tr-TR')} TL</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Koltuklar:</span>
                                <span className="text-white">{selectedSeats.join(', ') || '-'}</span>
                            </div>

                            {selectedSeats.length > 0 && (
                                <div className="flex justify-between items-center text-green-400">
                                    <span>Bilet ({selectedSeats.length}x150 TL):</span>
                                    <span>{ticketPrice.toLocaleString('tr-TR')} TL</span>
                                </div>
                            )}

                            {/* Seçili Ürünler */}
                            {Object.entries(selectedProducts).map(([productId, quantity]) => {
                                const product = products.find(p => p.product_id === parseInt(productId));
                                if (!product) return null;
                                const itemTotal = parseFloat(product.price) * quantity;
                                return (
                                    <div key={productId} className="flex justify-between items-center text-amber-400">
                                        <span>{product.product_name} ({quantity}x):</span>
                                        <span>{itemTotal.toLocaleString('tr-TR')} TL</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mb-6 pt-4 border-t border-zinc-700">
                            <p className="text-base text-gray-500 line-through">Normal Tutar: {normalPrice.toLocaleString('tr-TR')} TL</p>
                            <p className="text-2xl font-bold text-green-500 mt-1">
                                İndirimli: {discountedPrice.toLocaleString('tr-TR')} TL
                                <span className="text-xs text-green-400 ml-2 font-normal">(%10 Cüzdan İndirimi)</span>
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleCreditCardPayment}
                                className="w-full py-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold transition"
                            >
                                💳 KREDİ KARTI İLE ÖDE
                            </button>

                            <button
                                onClick={handleWalletPayment}
                                className={`w-full py-4 font-bold rounded-xl transition flex flex-col items-center justify-center ${!canAfford
                                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                        : 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black'
                                    }`}
                            >
                                <span>{!canAfford ? '⚠️ YETERSİZ BAKİYE - YÜKLE' : '👛 CÜZDANLA ÖDE (%10 İNDİRİM)'}</span>
                                {!canAfford && selectedSeats.length > 0 && <span className="text-xs mt-1 opacity-80">(Eksik: {(discountedPrice - parseFloat(wallet.balance)).toLocaleString('tr-TR')} TL)</span>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Yorumlar ve Değerlendirmeler Bölümü */}
            <div className="max-w-7xl mx-auto mt-16">
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl p-8">
                    <h3 className="text-3xl font-bold mb-6 text-red-600 flex items-center gap-3">
                        <span>⭐</span>
                        Yorumlar ve Değerlendirmeler
                    </h3>

                    {/* Genel Puan Ortalaması */}
                    <div className="mb-8 p-6 bg-zinc-800 rounded-xl border border-zinc-700">
                        <div className="flex items-center gap-4">
                            <div className="text-5xl font-bold text-yellow-400">
                                {averageRating.toFixed(1)}
                            </div>
                            <div className="flex-1">
                                <div className="mb-2">
                                    <StarRating 
                                        rating={averageRating} 
                                        interactive={false} 
                                        size="text-2xl"
                                    />
                                </div>
                                <p className="text-zinc-400 text-sm">
                                    {totalReviews} değerlendirme
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Yorum Formu */}
                    <div className="mb-8 p-6 bg-zinc-800 rounded-xl border border-zinc-700">
                        <h4 className="text-xl font-bold mb-4 text-white">Yorumunuzu Paylaşın</h4>
                        
                        {/* Yıldız Seçimi */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Puanınız (1-5 yıldız)
                            </label>
                            <div className="flex items-center gap-3">
                                <StarRating 
                                    rating={userRating} 
                                    interactive={true} 
                                    onChange={setUserRating}
                                    size="text-3xl"
                                />
                                {userRating > 0 && (
                                    <span className="ml-2 text-yellow-400 font-semibold text-lg">
                                        {userRating}/5
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Yorum Yazma Alanı */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Yorumunuz
                            </label>
                            <textarea
                                value={userComment}
                                onChange={(e) => setUserComment(e.target.value)}
                                placeholder="Filminiz hakkında düşüncelerinizi paylaşın..."
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                                rows="4"
                            />
                        </div>

                        {/* Gönder Butonu */}
                        <button
                            onClick={handleSubmitReview}
                            disabled={isSubmittingReview || userRating === 0 || !userComment.trim()}
                            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-bold transition"
                        >
                            {isSubmittingReview ? 'Gönderiliyor...' : 'Yorum Yap'}
                        </button>
                    </div>

                    {/* Yorum Listesi */}
                    <div className="space-y-4">
                        <h4 className="text-xl font-bold mb-4 text-white">
                            Tüm Yorumlar ({reviews.length})
                        </h4>
                        
                        {reviews.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500">
                                <p>Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
                            </div>
                        ) : (
                            reviews.map((review) => (
                                <div
                                    key={review.review_id}
                                    className="bg-zinc-800 rounded-xl border border-zinc-700 p-6"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-bold text-white">{review.user_name}</p>
                                            <p className="text-xs text-zinc-400">
                                                {new Date(review.created_at).toLocaleDateString('tr-TR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StarRating 
                                                rating={review.rating} 
                                                interactive={false} 
                                                size="text-lg"
                                            />
                                            <span className="ml-2 text-yellow-400 font-semibold">
                                                {review.rating}/5
                                            </span>
                                        </div>
                                    </div>
                                    {review.comment && (
                                        <p className="text-zinc-300 leading-relaxed">{review.comment}</p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
