import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/api/login`, { email, password });
            if (response.data.success) {
                login(response.data.user, response.data.token);
                
                // Role göre akıllı yönlendirme
                // Rol Standartları: role_id = 1 = Super Admin, role_id = 2 = Müşteri
                const roleId = Number(response.data.user.role_id);
                if (roleId === 1) {
                    // Super Admin ise admin paneline yönlendir
                    navigate('/admin');
                } else {
                    // Müşteri veya diğer roller ana sayfaya yönlendir
                    navigate('/');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Giriş başarısız. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="bg-zinc-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-800">
                <h2 className="text-3xl font-bold text-red-600 text-center mb-2">GİRİŞ YAP</h2>
                <p className="text-zinc-400 text-center mb-8 text-sm">Ultra Sinema'ya hoş geldiniz!</p>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded-lg text-red-300 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-gray-400 mb-2 text-sm">E-Posta Adresi</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-red-600 focus:outline-none transition"
                            placeholder="ornek@email.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-2 text-sm">Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-red-600 focus:outline-none transition"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition duration-300"
                    >
                        {loading ? 'GİRİŞ YAPILIYOR...' : 'GİRİŞ YAP'}
                    </button>
                </form>
                
                <p className="text-zinc-500 text-center mt-6 text-sm">
                    Hesabınız yok mu?{' '}
                    <Link to="/register" className="text-red-600 hover:text-red-500 font-semibold">
                        Kayıt Ol
                    </Link>
                </p>
            </div>
        </div>
    );
}
