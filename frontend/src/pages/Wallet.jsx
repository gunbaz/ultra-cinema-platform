import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Wallet() {
    const [wallet, setWallet] = useState(null);
    const [amount, setAmount] = useState('');
    const userId = 1; // Şimdilik sabit kullanıcı

    useEffect(() => {
        fetchWallet();
    }, []);

    const fetchWallet = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/wallet/${userId}`);
            setWallet(res.data.wallet);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeposit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/wallet/deposit', {
                userId,
                amount: parseFloat(amount)
            });
            alert('Para Yükleme Başarılı!');
            setAmount('');
            fetchWallet(); // Bakiyeyi güncelle
        } catch (err) {
            alert('Hata: ' + err.message);
        }
    };

    if (!wallet) return <div className="text-white text-center mt-20 text-xl">Cüzdan Bilgileri Yükleniyor...</div>;

    return (
        <div className="container mx-auto px-4 py-12 text-white">
            <h1 className="text-4xl font-bold mb-12 text-center text-red-600">CÜZDANIM</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                {/* Bakiye Kartı */}
                <div className="bg-zinc-900 p-10 rounded-xl shadow-2xl border border-zinc-800 flex flex-col justify-center items-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 to-red-900"></div>
                    <h2 className="text-2xl font-medium mb-6 text-gray-400">Mevcut Bakiye</h2>
                    <p className="text-7xl font-bold text-white tracking-tight mb-4">
                        {parseFloat(wallet.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-4xl text-red-600">₺</span>
                    </p>
                    <div className="mt-4 text-sm text-gray-500">
                        Son İşlem: {new Date(wallet.last_updated).toLocaleDateString()}
                    </div>
                </div>

                {/* Para Yükleme Formu */}
                <div className="bg-zinc-900 p-10 rounded-xl border border-zinc-800 shadow-2xl">
                    <h3 className="text-2xl font-bold mb-8 text-white border-l-4 border-red-600 pl-4">
                        Bakiye Yükle
                    </h3>
                    <form onSubmit={handleDeposit} className="space-y-8">
                        <div>
                            <label className="block text-sm text-gray-400 mb-3 font-medium">YÜKLENECEK TUTAR (TL)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded-lg p-5 text-3xl font-bold text-white focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none transition placeholder-zinc-800"
                                placeholder="0.00"
                                required
                                min="1"
                            />
                        </div>
                        <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-5 rounded-lg transition duration-300 transform hover:scale-[1.02] shadow-lg shadow-red-900/20 text-lg">
                            GÜVENLİ ÖDE VE YÜKLE
                        </button>
                    </form>
                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Ödemeleriniz 256-bit SSL ile korunmaktadır.
                    </div>
                </div>
            </div>
        </div>
    );
}
