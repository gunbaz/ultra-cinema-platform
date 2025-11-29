import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';

// Sayfalarımızı içeri alıyoruz (Import)
import Wallet from './pages/Wallet';
import Reservation from './pages/Reservation';
import Admin from './pages/Admin';
import Login from './pages/Login';

// Home (Ana Sayfa) bileşeni
function Home() {
    const [movies, setMovies] = useState([]);
    useEffect(() => {
        axios.get('http://localhost:5000/api/movies').then(res => setMovies(res.data.data));
    }, []);

    return (
        <div className="container mx-auto px-4 py-12">
            <h2 className="text-5xl font-bold text-center mb-16 text-red-600">Vizyondaki Filmler</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                {movies.map(movie => (
                    <div key={movie.movie_id} className="bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl hover:-translate-y-2 transition duration-500">
                        <img src={movie.poster_url} className="w-full h-[450px] object-cover" alt={movie.title} />
                        <div className="p-6">
                            <h3 className="text-2xl font-bold text-white mb-2">{movie.title}</h3>
                            <Link to={`/reservation/${movie.movie_id}`} className="block w-full bg-red-600 text-white text-center py-3 rounded-xl font-bold mt-4">BİLET AL</Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-black text-white font-sans">
                <header className="p-4 border-b border-white/10 flex justify-between items-center bg-black/80 sticky top-0 z-50">
                    <Link to="/" className="text-3xl font-black text-red-600">ULTRA SİNEMA</Link>
                    <nav className="flex gap-4">
                        <Link to="/" className="hover:text-red-500 transition">Ana Sayfa</Link>
                        <Link to="/wallet" className="text-green-400 hover:text-green-300 transition font-bold">Cüzdanım</Link>
                        <Link to="/login" className="bg-white/10 px-4 py-2 rounded hover:bg-white/20 transition">Yönetici Girişi</Link>
                    </nav>
                </header>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/reservation/:id" element={<Reservation />} />
                    <Route path="/wallet" element={<Wallet />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/login" element={<Login />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}