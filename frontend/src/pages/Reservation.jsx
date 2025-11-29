import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const COLS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function Reservation() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [occupiedSeats, setOccupiedSeats] = useState([]);
    const [wallet, setWallet] = useState(null);
    const userId = 1; // Şimdilik sabit

    useEffect(() => {
        axios.get(`http://localhost:5000/api/movies/${id}`).then(res => setMovie(res.data.data));
        axios.get(`http://localhost:5000/api/seats/${id}`).then(res => setOccupiedSeats(res.data.occupiedSeats || []));
        axios.get(`http://localhost:5000/api/wallet/${userId}`).then(res => setWallet(res.data.wallet));
    }, [id]);

    const toggleSeat = (sid) => {
        if (occupiedSeats.includes(sid)) return;
        setSelectedSeats(prev => prev.includes(sid) ? prev.filter(s => s !== sid) : [...prev, sid]);
    };

    const handleCreditCardPayment = async () => {
        if (!confirm('Kredi Kartı ile ödemeyi onaylıyor musunuz?')) return;
        try {
            await axios.post('http://localhost:5000/api/tickets', { movieId: id, selectedSeats });
            alert('Bilet Alındı! (Kredi Kartı)');
            navigate('/');
        } catch (err) {
            alert('Hata: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleWalletPayment = async () => {
        // Yetersiz bakiye kontrolü
        if (!canAfford) {
            if (confirm('Bakiyeniz yetersiz. Cüzdan sayfasına gidip yükleme yapmak ister misiniz?')) {
                navigate('/wallet');
            }
            return;
        }

        if (!confirm('Cüzdan ile ödemeyi onaylıyor musunuz? (%10 İndirimli)')) return;
        try {
            await axios.post('http://localhost:5000/api/tickets/buy-with-wallet', { userId, movieId: id, selectedSeats });
            alert('Biletler Cüzdanla Alındı!');
            navigate('/');
        } catch (err) {
            alert('Hata: ' + (err.response?.data?.message || err.message));
        }
    };

    if (!movie || !wallet) return <div className="text-white text-center mt-20">Yükleniyor...</div>;

    const normalPrice = selectedSeats.length * 150;
    const discountedPrice = normalPrice * 0.90;
    const canAfford = parseFloat(wallet.balance) >= discountedPrice;

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
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
                <div className="bg-zinc-900 p-8 rounded-2xl h-fit border border-zinc-800 shadow-xl">
                    <h3 className="text-xl font-bold mb-6 border-b border-gray-700 pb-4">Özet</h3>

                    <div className="mb-6 space-y-2">
                        <p className="text-gray-400 text-sm">Cüzdan Bakiyeniz: <span className="text-white font-bold">{parseFloat(wallet.balance).toLocaleString('tr-TR')} TL</span></p>
                        <p className="text-gray-400">Koltuklar: <span className="text-white">{selectedSeats.join(', ') || '-'}</span></p>
                    </div>

                    <div className="mb-8">
                        <p className="text-lg text-gray-500 line-through">Normal Tutar: {normalPrice.toLocaleString('tr-TR')} TL</p>
                        <p className="text-3xl font-bold text-green-500">İndirimli: {discountedPrice.toLocaleString('tr-TR')} TL</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handleCreditCardPayment}
                            disabled={!selectedSeats.length}
                            className="w-full py-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            KREDİ KARTI İLE ÖDE
                        </button>

                        <button
                            onClick={handleWalletPayment}
                            disabled={!selectedSeats.length}
                            className={`w-full py-4 font-bold rounded-xl transition flex flex-col items-center justify-center ${!canAfford
                                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                    : 'bg-yellow-600 hover:bg-yellow-500 text-black'
                                }`}
                        >
                            <span>{!canAfford ? 'YETERSİZ BAKİYE - YÜKLE' : 'CÜZDANLA ÖDE (%10 İNDİRİM)'}</span>
                            {!canAfford && selectedSeats.length > 0 && <span className="text-xs mt-1 opacity-80">(Eksik: {(discountedPrice - parseFloat(wallet.balance)).toLocaleString('tr-TR')} TL)</span>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
