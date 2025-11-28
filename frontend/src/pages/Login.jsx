import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/admin/login', { email, password });
            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                alert('Giriş Başarılı! Yönlendiriliyorsunuz...');
                navigate('/admin');
            }
        } catch (err) {
            alert('Giriş Başarısız: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="bg-zinc-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-800">
                <h2 className="text-3xl font-bold text-red-600 text-center mb-8">YÖNETİCİ GİRİŞİ</h2>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-gray-400 mb-2 text-sm">E-Posta Adresi</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-red-600 focus:outline-none transition"
                            placeholder="admin@sinema.com"
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
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition duration-300"
                    >
                        GİRİŞ YAP
                    </button>
                </form>
                <p className="text-zinc-500 text-center mt-6 text-sm">
                    © 2024 Ultra Sinema Yönetim Paneli
                </p>
            </div>
        </div>
    );
}
