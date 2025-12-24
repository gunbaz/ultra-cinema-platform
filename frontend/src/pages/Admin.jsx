import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';

export default function Admin() {
    const [stats, setStats] = useState({ totalIncome: 0, totalTickets: 0, totalMovies: 0 });
    const [movies, setMovies] = useState([]);

    // Form state'i artık release_date ve imdb_rating'i de tutuyor (hidden fields gibi davranacaklar)
    const initialFormState = {
        title: '', description: '', duration_minutes: '', poster_url: '', language: '', age_restriction: '',
        release_date: '', imdb_rating: 0
    };
    const [formData, setFormData] = useState(initialFormState);
    const [editingMovie, setEditingMovie] = useState(null); // Düzenlenen film
    const [backupLoading, setBackupLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchData(token);
        }
    }, []);

    const fetchData = async (token) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const statsRes = await axios.get(`${API_URL}/api/admin/stats`, config);
            const moviesRes = await axios.get(`${API_URL}/api/movies`);
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

    // Düzenle butonuna basılınca
    const handleEditClick = (movie) => {
        setEditingMovie(movie);
        setFormData({
            title: movie.title,
            description: movie.description,
            duration_minutes: movie.duration_minutes,
            poster_url: movie.poster_url,
            language: movie.language,
            age_restriction: movie.age_restriction,
            release_date: movie.release_date, // Mevcut değeri koru
            imdb_rating: movie.imdb_rating    // Mevcut değeri koru
        });
        // Sayfanın en üstüne (forma) kaydır
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingMovie(null);
        setFormData(initialFormState);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            if (editingMovie) {
                // GÜNCELLEME (PUT)
                await axios.put(`${API_URL}/api/admin/movies/${editingMovie.movie_id}`, formData, config);
                alert('Film Güncellendi!');
            } else {
                // EKLEME (POST)
                await axios.post(`${API_URL}/api/admin/movies`, formData, config);
                alert('Film Eklendi!');
            }

            // Başarılı işlem sonrası temizlik
            handleCancelEdit();
            fetchData(token);
        } catch (err) {
            alert('İşlem Hatası: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteMovie = async (id) => {
        if (!confirm('Bu filmi silmek istediğinize emin misiniz?')) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`${API_URL}/api/admin/movies/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData(token);
        } catch (err) {
            alert('Silme Hatası: ' + err.message);
        }
    };

    const handleBackup = async () => {
        setBackupLoading(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/api/admin/backup`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Yedekleme başarısız');
            }

            // Dosyayı blob olarak al
            const blob = await response.blob();

            // İndirme linki oluştur
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Dosya adını header'dan al veya varsayılan kullan
            const contentDisposition = response.headers.get('Content-Disposition');
            let fileName = 'backup.sql';
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match) fileName = match[1];
            }

            a.download = fileName;
            document.body.appendChild(a);
            a.click();

            // Temizlik
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            alert('✅ Yedekleme başarıyla indirildi!');
        } catch (err) {
            alert('❌ Yedekleme Hatası: ' + err.message);
        } finally {
            setBackupLoading(false);
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

                {/* Backup Button */}
                <div className="mb-10 flex justify-end">
                    <button
                        onClick={handleBackup}
                        disabled={backupLoading}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {backupLoading ? (
                            <>
                                <span className="animate-spin text-xl">↻</span> Yedekleniyor...
                            </>
                        ) : (
                            <>
                                <span className="text-xl">💾</span> VERİTABANINI YEDEKLE
                            </>
                        )}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Add/Edit Movie Form */}
                    <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
                        <h3 className="text-xl font-bold mb-6 border-b border-gray-700 pb-2">
                            {editingMovie ? 'Filmi Düzenle' : 'Yeni Film Ekle'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" name="title" placeholder="Film Adı" value={formData.title} onChange={handleInputChange} className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-red-500 outline-none" required />
                            <input type="text" name="poster_url" placeholder="Afiş URL" value={formData.poster_url} onChange={handleInputChange} className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-red-500 outline-none" required />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" name="duration_minutes" placeholder="Süre (dk)" value={formData.duration_minutes} onChange={handleInputChange} className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-red-500 outline-none" required />
                                <input type="text" name="age_restriction" placeholder="Yaş Sınırı (örn: +13)" value={formData.age_restriction} onChange={handleInputChange} className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-red-500 outline-none" />
                            </div>
                            <input type="text" name="language" placeholder="Dil" value={formData.language} onChange={handleInputChange} className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-red-500 outline-none" required />
                            <textarea name="description" placeholder="Açıklama" value={formData.description} onChange={handleInputChange} className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-red-500 outline-none h-24"></textarea>

                            <div className="flex gap-4">
                                <button type="submit" className={`flex-1 font-bold py-3 rounded transition ${editingMovie ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>
                                    {editingMovie ? 'GÜNCELLE' : 'KAYDET'}
                                </button>
                                {editingMovie && (
                                    <button type="button" onClick={handleCancelEdit} className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded font-bold transition">
                                        İPTAL
                                    </button>
                                )}
                            </div>
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
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditClick(movie)} className="bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white px-3 py-1 rounded text-sm transition">Düzenle</button>
                                        <button onClick={() => handleDeleteMovie(movie.movie_id)} className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1 rounded text-sm transition">Sil</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}