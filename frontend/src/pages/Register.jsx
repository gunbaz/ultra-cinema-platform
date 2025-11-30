import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';

export default function Register() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        // Validasyon
        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor!');
            return;
        }

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır!');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/register`, {
                firstName,
                lastName,
                email,
                password
            });

            if (response.data.success) {
                alert('Kayıt başarılı! Giriş yapabilirsiniz.');
                navigate('/login');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Kayıt başarısız. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="bg-zinc-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-800">
                <h2 className="text-3xl font-bold text-red-600 text-center mb-2">KAYIT OL</h2>
                <p className="text-zinc-400 text-center mb-8 text-sm">Ultra Sinema'ya hoş geldiniz!</p>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded-lg text-red-300 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-400 mb-2 text-sm">Ad</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-red-600 focus:outline-none transition"
                                placeholder="Adınız"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2 text-sm">Soyad</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-red-600 focus:outline-none transition"
                                placeholder="Soyadınız"
                                required
                            />
                        </div>
                    </div>

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
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 mb-2 text-sm">Şifre Tekrar</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-red-600 focus:outline-none transition"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition duration-300"
                    >
                        {loading ? 'KAYIT YAPILIYOR...' : 'KAYIT OL'}
                    </button>
                </form>

                <p className="text-zinc-500 text-center mt-6 text-sm">
                    Zaten hesabınız var mı?{' '}
                    <Link to="/login" className="text-red-600 hover:text-red-500 font-semibold">
                        Giriş Yap
                    </Link>
                </p>
            </div>
        </div>
    );
}

