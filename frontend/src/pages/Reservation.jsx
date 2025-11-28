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

    useEffect(() => {
        axios.get(`http://localhost:5000/api/movies/${id}`).then(res => setMovie(res.data.data));
        axios.get(`http://localhost:5000/api/seats/${id}`).then(res => setOccupiedSeats(res.data.occupiedSeats || []));
    }, [id]);

    const toggleSeat = (sid) => {
        if (occupiedSeats.includes(sid)) return;
        setSelectedSeats(prev => prev.includes(sid) ? prev.filter(s => s !== sid) : [...prev, sid]);
    };

    const handlePayment = async () => {
        if (!confirm('Onaylıyor musunuz?')) return;
        await axios.post('http://localhost:5000/api/tickets', { movieId: id, selectedSeats });
        alert('Bilet Alındı!');
        navigate('/');
    };

    if (!movie) return <div className="text-white text-center mt-20">Yükleniyor...</div>;

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
                <div className="bg-zinc-900 p-8 rounded-2xl h-fit">
                    <h3 className="text-xl font-bold mb-6">Özet</h3>
                    <p className="text-gray-400 mb-4">Koltuklar: {selectedSeats.join(', ') || '-'}</p>
                    <p className="text-2xl font-bold mb-6">{selectedSeats.length * 150} TL</p>
                    <button onClick={handlePayment} disabled={!selectedSeats.length} className="w-full py-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold disabled:opacity-50">ÖDEMEYİ TAMAMLA</button>
                </div>
            </div>
        </div>
    );
}
