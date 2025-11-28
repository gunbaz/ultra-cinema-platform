import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Admin() {
    const [stats, setStats] = useState({ totalIncome: 0, totalTickets: 0, totalMovies: 0 });
    const [movies, setMovies] = useState([]);
    const [formData, setFormData] = useState({
        title: '', description: '', duration_minutes: '', poster_url: '', language: '', age_restriction: ''
    });
    const navigate = useNavigate();

    // Token Kontrolü ve Veri Çekme
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchData(token);
    }, []);

    const fetchData = async (token) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const statsRes = await axios.get('http://localhost:5000/api/admin/stats', config);
            const moviesRes = await axios.get('http://localhost:5000/api/movies'); // Bu public
            setStats(statsRes.data.stats);
            setMovies(moviesRes.data.data);
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                localStorage.removeItem('token');
                navigate('/login');
            }
            console.error(err);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddMovie = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await axios.post('http://localhost:5000/api/admin/movies', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Film Eklendi!');
            setFormData({ title: '', description: '', duration_minutes: '', poster_url: '', language: '', age_restriction: '' });
            fetchData(token);
        } catch (err) {
            alert('Hata: ' + err.message);
        }
    };

    const handleDeleteMovie = async (id) => {
        if (!confirm('Bu filmi silmek istediğinize emin misiniz?')) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:5000/api/admin/movies/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData(token);
        } catch (err) {
            alert('Silme Hatası: ' + err.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 p-6 flex flex-col border-r border-gray-700">
                <h2 className="text-2xl font-bold text-red-500 mb-10 tracking-wider">CMS PANEL</h2>
                <nav className="flex flex-col gap-4 flex-1">
                    <a href="#" className="text-gray-300 hover:text-white hover:bg-gray-700 p-3 rounded transition">📊 Dashboard</a>
                    <a href="#" className="text-gray-300 hover:text-white hover:bg-gray-700 p-3 rounded transition">🎬 Film Yönetimi</a>
                    <a href="#" className="text-gray-300 hover:text-white hover:bg-gray-700 p-3 rounded transition">🎫 Biletler</a>
                </nav>
                <button onClick={handleLogout} className="mt-auto bg-red-600 hover:bg-red-700 text-white p-3 rounded transition">ÇIKIŞ YAP</button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-10 overflow-y-auto">
                <h1 className="text-3xl font-bold mb-8">Yönetim Paneli</h1>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                        <h3 className="text-gray-400 text-sm uppercase font-bold mb-2">Toplam Hasılat</h3>
                        <p className="text-4xl font-bold text-green-400">{parseFloat(stats.totalIncome).toLocaleString()} TL</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                        <h3 className="text-gray-400 text-sm uppercase font-bold mb-2">Satılan Bilet</h3>
                        <p className="text-4xl font-bold text-blue-400">{stats.totalTickets}</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                        <h3 className="text-gray-400 text-sm uppercase font-bold mb-2">Aktif Film</h3>
                        <p className="text-4xl font-bold text-purple-400">{stats.totalMovies}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Add Movie Form */}
                    <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
                        <h3 className="text-xl font-bold mb-6 border-b border-gray-700 pb-2">Yeni Film Ekle</h3>
                        <form onSubmit={handleAddMovie} className="space-y-4">
                            <input type="text" name="title" placeholder="Film Adı" value={formData.title} onChange={handleInputChange} className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-red-500 outline-none" required />
                            <input type="text" name="poster_url" placeholder="Afiş URL" value={formData.poster_url} onChange={handleInputChange} className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-red-500 outline-none" required />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" name="duration_minutes" placeholder="Süre (dk)" value={formData.duration_minutes} onChange={handleInputChange} className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-red-500 outline-none" required />
                                <input type="text" name="age_restriction" placeholder="Yaş Sınırı (örn: +13)" value={formData.age_restriction} onChange={handleInputChange} className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-red-500 outline-none" />
                            </div>
                            <input type="text" name="language" placeholder="Dil" value={formData.language} onChange={handleInputChange} className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-red-500 outline-none" required />
                            <textarea name="description" placeholder="Açıklama" value={formData.description} onChange={handleInputChange} className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-red-500 outline-none h-24"></textarea>
                            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition">KAYDET</button>
                        </form>
                    </div>

                    {/* Movie List */}
                    <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
                        <h3 className="text-xl font-bold mb-6 border-b border-gray-700 pb-2">Film Listesi</h3>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                            {movies.map(movie => (
                                <div key={movie.movie_id} className="flex items-center justify-between bg-gray-700 p-4 rounded hover:bg-gray-600 transition">
                                    <div className="flex items-center gap-4">
                                        <img src={movie.poster_url} alt={movie.title} className="w-12 h-16 object-cover rounded" />
                                        <div>
                                            <h4 className="font-bold">{movie.title}</h4>
                                            <p className="text-xs text-gray-400">{movie.duration_minutes} dk | {movie.language}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteMovie(movie.movie_id)} className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1 rounded text-sm transition">Sil</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
