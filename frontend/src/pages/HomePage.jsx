import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';

function HomePage() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Backend'den filmleri çek
    useEffect(() => {
        fetchMovies();
    }, []);

    const fetchMovies = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/movies`);

            if (response.data.success) {
                setMovies(response.data.data);
            } else {
                setError('Filmler yüklenemedi');
            }
        } catch (err) {
            console.error('Film getirme hatası:', err);
            setError('Backend bağlantısı kurulamadı. Backend sunucusunun çalıştığından emin olun.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-netflix-black">
            {/* Header / Navbar */}
            <header className="bg-netflix-darkGray shadow-lg sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="text-3xl font-bold text-netflix-red tracking-wider hover:scale-105 transition">
                            🎬 ULTRA SİNEMA
                        </Link>
                        <nav className="hidden md:flex gap-6">
                            <Link to="/" className="text-white hover:text-netflix-red transition">
                                Filmler
                            </Link>
                            <a href="#" className="text-white hover:text-netflix-red transition">
                                Seanslar
                            </a>
                            <a href="#" className="text-white hover:text-netflix-red transition">
                                Biletlerim
                            </a>
                        </nav>
                        <button className="bg-netflix-red hover:bg-red-700 text-white px-6 py-2 rounded-md transition">
                            Giriş Yap
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {/* Hero Section */}
                <div className="mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 animate-fadeIn">
                        Vizyondaki Filmler
                    </h2>
                    <p className="text-netflix-lightGray text-lg animate-fadeIn">
                        En yeni ve popüler filmleri keşfedin, biletinizi hemen alın!
                    </p>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-netflix-red"></div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-900/30 border border-red-500 text-white px-6 py-4 rounded-lg mb-8">
                        <p className="font-semibold">❌ Hata:</p>
                        <p>{error}</p>
                    </div>
                )}

                {/* Movies Grid */}
                {!loading && !error && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {movies.length > 0 ? (
                            movies.map((movie) => (
                                <div
                                    key={movie.movie_id}
                                    className="movie-card bg-netflix-gray rounded-lg overflow-hidden shadow-xl"
                                >
                                    {/* Movie Poster */}
                                    <div className="relative h-80 bg-gradient-to-br from-netflix-red/20 to-netflix-black overflow-hidden">
                                        {movie.poster_url ? (
                                            <img
                                                src={movie.poster_url}
                                                alt={movie.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <span className="text-6xl">🎬</span>
                                            </div>
                                        )}

                                        {/* IMDB Rating Badge */}
                                        {movie.imdb_rating && (
                                            <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full font-bold text-sm">
                                                ⭐ {movie.imdb_rating}
                                            </div>
                                        )}
                                    </div>

                                    {/* Movie Info */}
                                    <div className="p-5">
                                        <h3 className="text-xl font-bold mb-2 truncate">
                                            {movie.title}
                                        </h3>

                                        {movie.original_title && movie.original_title !== movie.title && (
                                            <p className="text-netflix-lightGray text-sm mb-2 truncate">
                                                {movie.original_title}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-4 text-sm text-netflix-lightGray mb-3">
                                            {movie.duration_minutes && (
                                                <span>⏱️ {movie.duration_minutes} dk</span>
                                            )}
                                            {movie.age_restriction && (
                                                <span className="bg-netflix-red px-2 py-1 rounded text-white text-xs">
                                                    {movie.age_restriction}
                                                </span>
                                            )}
                                        </div>

                                        {movie.description && (
                                            <p className="text-netflix-lightGray text-sm mb-4 line-clamp-2">
                                                {movie.description}
                                            </p>
                                        )}

                                        <Link to={`/reservation/${movie.movie_id}`}>
                                            <button className="w-full bg-netflix-red hover:bg-red-700 text-white py-2 rounded-md transition font-semibold">
                                                Bilet Al
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-16">
                                <p className="text-2xl text-netflix-lightGray">
                                    Henüz vizyondaki film bulunmuyor.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-netflix-darkGray mt-16 py-8">
                <div className="container mx-auto px-4 text-center text-netflix-lightGray">
                    <p>🎬 Ultra Sinema Rezervasyon Sistemi © 2025</p>
                    <p className="text-sm mt-2">Developed by Furkan</p>
                </div>
            </footer>
        </div>
    );
}

export default HomePage;
