# 🎬 ULTRA CINEMA PLATFORM

> **Ankara Üniversitesi - Veritabanı Yönetim Sistemleri Dersi Projesi**
> 
> Full Stack Sinema Rezervasyon ve Yönetim Sistemi

![Project Status](https://img.shields.io/badge/Status-Completed-success)
![Tech Stack](https://img.shields.io/badge/Stack-PERN-blue)
![Database](https://img.shields.io/badge/Database-PostgreSQL-336791)
![Security](https://img.shields.io/badge/Security-JWT%20%26%20RBAC-red)

---

## 📌 Proje Hakkında

**Ultra Cinema Platform**, modern web teknolojileri kullanılarak geliştirilmiş, ölçeklenebilir ve güvenli bir sinema bilet rezervasyon sistemidir. 

Proje, sıradan bir rezervasyon sisteminin ötesine geçerek; **entegre cüzdan sistemi**, **büfe satış modülü**, **veritabanı yedekleme** ve **gelişmiş rol tabanlı güvenlik (RBAC)** gibi kurumsal özellikler barındırır.

Veritabanı mimarisi **3. Normal Form (3NF)** kurallarına uygun tasarlanmış olup, veri bütünlüğü ve **ACID** prensipleri ön planda tutulmuştur.

---

## 📸 Ekran Görüntüleri

<details>
<summary><b>🏠 Ana Sayfa</b></summary>
<br>
<!-- Ekran görüntüsü eklenecek -->
<i>Vizyondaki filmler ve modern arayüz</i>
</details>

<details>
<summary><b>🎫 Koltuk Seçimi</b></summary>
<br>
<!-- Ekran görüntüsü eklenecek -->
<i>İnteraktif salon haritası ve koltuk seçim ekranı</i>
</details>

<details>
<summary><b>💰 Cüzdan Sistemi</b></summary>
<br>
<!-- Ekran görüntüsü eklenecek -->
<i>Bakiye yükleme ve işlem geçmişi</i>
</details>

<details>
<summary><b>🛡️ Admin Paneli</b></summary>
<br>
<!-- Ekran görüntüsü eklenecek -->
<i>Yönetim paneli - istatistikler ve film yönetimi</i>
</details>

---

## 🚀 Öne Çıkan Özellikler

### 🔐 Kimlik Doğrulama ve Güvenlik
- **JWT Tabanlı Auth:** Güvenli oturum yönetimi
- **RBAC (Role-Based Access Control):** Rol tabanlı yetkilendirme
  - `Super Admin` → Yönetim paneline tam erişim
  - `Müşteri` → Sadece kullanıcı arayüzü erişimi
- **Route Guards:** Yetkisiz erişim engelleme

### ⭐ Yorum ve Puanlama Sistemi
- **Doğrulanmış İnceleme:** Sadece bilet almış kullanıcılar yorum yapabilir
- **Dinamik Yıldız Gösterimi:** Ortalama puan görsel olarak yansıtılır

### 🍿 Büfe ve Ek Satış Modülü
- **Ürün Entegrasyonu:** Bilet alırken büfe ürünleri sepete eklenebilir
- **İş Kuralları:** "Bilet olmadan sadece mısır alınamaz" gibi kontroller

### 💰 Cüzdan ve Finansal Sistem
- **Dijital Cüzdan:** Transaction mantığıyla çalışan kullanıcı cüzdanları
- **%10 İndirim:** Cüzdan ile ödemelerde otomatik indirim
- **İşlem Geçmişi:** Tüm finansal hareketler `wallet_transactions` tablosunda

### 🛡️ Veri Koruma
- **Manuel Yedekleme:** Admin panelinden tek tıkla `.sql` formatında yedek indirme
- **Cloud Uyumlu:** Render.com gibi platformlarda çalışacak şekilde tasarlandı

### ⚡ Admin Dashboard
- **Anlık İstatistikler:** Toplam hasılat, satılan bilet, aktif film sayısı
- **Film CRUD:** Ekleme, düzenleme, silme işlemleri
- **Veritabanı Yedekleme:** Tek tıkla SQL export

---

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji | Açıklama |
|:-------|:----------|:---------|
| **Frontend** | React.js (Vite) | Modern ve hızlı SPA |
| **Styling** | Tailwind CSS | Dark mode tasarım |
| **Backend** | Node.js & Express | RESTful API |
| **Database** | PostgreSQL | İlişkisel veritabanı |
| **Auth** | JWT & Bcrypt | Kimlik doğrulama ve şifreleme |
| **Tools** | Node-Cron | Otomasyon |

---

## 🗄️ Veritabanı Mimarisi

### ER Diyagramı

```
┌─────────┐     ┌─────────┐     ┌─────────────────┐     ┌──────────┐
│  Roles  │────▶│  Users  │────▶│     Wallets     │────▶│Wallet_Tx │
└─────────┘     └────┬────┘     └─────────────────┘     └──────────┘
                     │
        ┌────────────┼────────────┬─────────────┐
        ▼            ▼            ▼             ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐
   │ Tickets │  │ Reviews │  │  Sales  │  │  Admins  │
   └────┬────┘  └────┬────┘  └────┬────┘  └──────────┘
        │            │            │
        ▼            ▼            ▼
   ┌─────────┐  ┌─────────┐  ┌──────────┐
   │Sessions │  │ Movies  │  │ Products │
   └────┬────┘  └─────────┘  └──────────┘
        │
   ┌────┴────┐
   ▼         ▼
┌──────┐ ┌───────┐
│Halls │ │ Seats │
└──┬───┘ └───────┘
   │
   ▼
┌─────────┐     ┌────────┐
│ Cinemas │────▶│ Cities │
└─────────┘     └────────┘
```

### Tablolar (22 Adet)

| Kategori | Tablolar |
|:---------|:---------|
| **Kullanıcı** | users, roles, wallets, wallet_transactions |
| **Film** | movies, genres, directors, actors, movie_genres, movie_directors, movie_actors |
| **Mekan** | cities, cinemas, halls, seats, seattypes |
| **İşlem** | sessions, tickets, reviews, sales, products |

---

## ⚙️ Kurulum

### Gereksinimler

- Node.js (v18+)
- PostgreSQL (v14+)
- npm veya yarn

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/gunbaz/ultra-cinema-platform.git
cd ultra-cinema-platform
```

### 2. Bağımlılıkları Yükleyin

```bash
# Backend
cd backend
npm install

# Frontend (yeni terminal)
cd frontend
npm install
```

### 3. Veritabanını Kurun

1. PostgreSQL'de `CinemaDB` adında veritabanı oluşturun:

```sql
CREATE DATABASE CinemaDB;
```

2. `backend/backups/` klasöründeki `.sql` dosyasını import edin:

```bash
psql -U postgres -d CinemaDB -f backend/backups/backup_latest.sql
```

Ya da **DBeaver/pgAdmin** ile "Restore" yapın.

### 4. Ortam Değişkenlerini Ayarlayın

`backend/.env` dosyası oluşturun:

```env
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=CinemaDB
JWT_SECRET=your_secret_key
```

### 5. Uygulamayı Başlatın

**Backend:**
```bash
cd backend
npm run dev
# http://localhost:5000
```

**Frontend:**
```bash
cd frontend
npm run dev
# http://localhost:5173
```


---

## 📁 Proje Yapısı

```
ultra-cinema-platform/
├── backend/
│   ├── backups/          # Veritabanı yedekleri
│   ├── server.js         # Ana sunucu dosyası
│   ├── .env              # Ortam değişkenleri
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/   # React bileşenleri
│   │   ├── pages/        # Sayfa bileşenleri
│   │   ├── context/      # Auth context
│   │   └── config/       # API yapılandırması
│   └── package.json
│
└── README.md
```

---

## 🎯 API Endpoints

| Method | Endpoint | Açıklama |
|:-------|:---------|:---------|
| POST | `/api/auth/register` | Kullanıcı kaydı |
| POST | `/api/auth/login` | Giriş |
| GET | `/api/movies` | Film listesi |
| GET | `/api/movies/:id` | Film detayı |
| GET | `/api/movies/:id/reviews` | Film yorumları |
| POST | `/api/reviews` | Yorum ekle |
| GET | `/api/wallet/:userId` | Cüzdan bilgisi |
| POST | `/api/wallet/deposit` | Bakiye yükle |
| POST | `/api/tickets/buy-with-wallet` | Bilet satın al |
| GET | `/api/admin/stats` | Admin istatistikleri |
| GET | `/api/admin/backup` | Veritabanı yedeği indir |

---

## 👥 Proje Ekibi

| İsim | Rol |
|:-----|:----|
| **Furkan Günbaz** | Full Stack Developer & Database Architect |
| **Enes Cabbar Akça** | Full Stack Developer & Database Architect |

---

## 📄 Lisans

Bu proje eğitim amaçlı geliştirilmiştir.

---

<p align="center">
  <b>Ankara Üniversitesi - Veritabanı Yönetim Sistemleri Dersi - 2025</b>
</p>
