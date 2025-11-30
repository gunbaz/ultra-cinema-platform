import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import { API_URL } from './config/api';

// Sayfalarımızı içeri alıyoruz (Import)
import Wallet from './pages/Wallet';
import Reservation from './pages/Reservation';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminRoute from './components/AdminRoute';

// Home (Ana Sayfa) bileşeni
function Home() {
    const [movies, setMovies] = useState([]);
    useEffect(() => {
        axios.get(`${API_URL}/api/movies`).then(res => setMovies(res.data.data));
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

// Navbar Bileşeni
function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();

    // Admin yetkisi kontrolü - KESİN GÜVENLİK
    // Rol Standartları: role_id = 1 = Super Admin, role_id = 2 = Müşteri
    // Sadece role_id === 1 olanlar admin butonunu görebilir
    const isAdmin = user && Number(user.role_id) === 1;

    return (
        <header className="p-4 border-b border-white/10 flex justify-between items-center bg-black/80 sticky top-0 z-50">
            <Link to="/" className="text-3xl font-black text-red-600">ULTRA SİNEMA</Link>
            <nav className="flex gap-4 items-center">
                <Link to="/" className="hover:text-red-500 transition">Ana Sayfa</Link>
                
                {isAuthenticated ? (
                    <>
                        <span className="text-zinc-400">Merhaba, <span className="text-white font-semibold">{user?.fullName || user?.first_name}</span></span>
                        <Link to="/wallet" className="text-green-400 hover:text-green-300 transition font-bold">Cüzdanım</Link>
                        {isAdmin && (
                            <Link to="/admin" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition">Yönetim Paneli</Link>
                        )}
                        <button
                            onClick={logout}
                            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
                        >
                            Çıkış Yap
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="bg-white/10 px-4 py-2 rounded hover:bg-white/20 transition">Giriş Yap</Link>
                        <Link to="/register" className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition">Kayıt Ol</Link>
                    </>
                )}
            </nav>
        </header>
    );
}

// Protected Route Bileşeni
function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center">Yükleniyor...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <div className="min-h-screen bg-black text-white font-sans">
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/reservation/:id" element={<ProtectedRoute><Reservation /></ProtectedRoute>} />
                        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
                        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                    </Routes>
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}