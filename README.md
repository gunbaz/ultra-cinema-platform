# 🎬 ULTRA CINEMA PLATFORM

> **Üniversite Veritabanı Yönetim Sistemleri Dersi İçin Geliştirilmiş, Full Stack Sinema Rezervasyon ve Yönetim Sistemi.**

![Project Status](https://img.shields.io/badge/Status-Major%20Update-blue)

![Tech Stack](https://img.shields.io/badge/Stack-PERN-blue)

![Database](https://img.shields.io/badge/Database-PostgreSQL-336791)

![Security](https://img.shields.io/badge/Security-JWT%20%26%20RBAC-red)

## 📌 Proje Hakkında

**Ultra Cinema Platform**, modern web teknolojileri kullanılarak geliştirilmiş, ölçeklenebilir ve güvenli bir bilet rezervasyon sistemidir. Sıradan bir rezervasyon sisteminin ötesine geçerek; **entegre cüzdan sistemi**, **büfe satış modülü**, **otomatik veritabanı yedekleme** ve **gelişmiş rol tabanlı güvenlik (RBAC)** gibi ticari özellikler barındırır.

Veritabanı mimarisi **3. Normal Form (3NF)** kurallarına tam uyumlu tasarlanmış olup, veri bütünlüğü (Data Integrity) ve ACID prensipleri ön planda tutulmuştur.

## 🚀 Öne Çıkan Özellikler

### 🔐 Kimlik ve Güvenlik (YENİ)

* **Kullanıcı Sistemi:** Ziyaretçiler kayıt olabilir, giriş yapabilir ve kendi profillerini yönetebilir.

* **RBAC (Role-Based Access Control):** Gelişmiş yetkilendirme sistemi.

    * **Super Admin:** Yönetim paneline tam erişim sağlar.

    * **Müşteri:** Sadece arayüzü kullanabilir, admin paneline erişimi engellenir.

* **Route Guards:** Yetkisiz kullanıcıların URL üzerinden korumalı sayfalara (Admin Dashboard vb.) erişmesi engellenir.

### ⭐ Yorum ve Puanlama Sistemi (YENİ)

* **Doğrulanmış İnceleme:** Sadece ilgili filme **bilet almış kullanıcılar** yorum yapabilir ve puan verebilir. (Fake yorum engelleme).

* **Görsel Puanlama:** Filmlerin ortalama puanı, dinamik yıldız bileşeni ile (örn: 3.5 puan yarım yıldız) gösterilir.

### 🍿 Büfe ve Ek Satış (YENİ)

* **Ürün Entegrasyonu:** Bilet alırken Mısır, Kola gibi büfe ürünleri sepete eklenebilir.

* **Akıllı Sepet Kontrolü:** "Bilet olmadan sadece mısır alınamaz" gibi ticari kurallar (Business Logic) kodlanmıştır.

### 💰 Finansal Sistem & Cüzdan

* **Dijital Cüzdan:** Her kullanıcının veritabanında "Transaction" mantığıyla çalışan şahsi bir cüzdanı vardır.

* **Dinamik Fiyatlandırma (%10 İndirim):** Cüzdan ile yapılan ödemelerde (Bilet + Büfe) sistem otomatik indirim uygular.

* **İşlem Geçmişi (Logs):** Para yükleme ve harcama işlemleri `wallet_transactions` tablosunda kayıt altına alınır.

### 🛡️ Veri Koruma ve Otomasyon

* **Otomatik Yedekleme (Cron Job):** Sistem, arka planda her gece veritabanının yedeğini (`.sql`) sunucuya kaydeder.

* **Manuel Yedekleme:** Admin panelinden tek tıkla anlık veritabanı yedeği alınabilir.

### ⚡ Yönetim Paneli (Admin Dashboard)

* **İstatistikler:** Hasılat, bilet sayısı ve aktif film sayısı anlık görüntülenir.

* **CRUD İşlemleri:** Film ekleme, silme, düzenleme ve vizyon tarihi yönetimi.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

| Alan | Teknoloji | Açıklama |
| :--- | :--- | :--- |
| **Frontend** | React.js (Vite) | Modern, hızlı ve reaktif arayüz. |
| **Styling** | Tailwind CSS | Netflix tarzı "Dark Mode" tasarım dili. |
| **Backend** | Node.js & Express | RESTful API mimarisi. |
| **Database** | PostgreSQL | İlişkisel veritabanı (Relational DB). |
| **Security** | JWT & Bcrypt | Kimlik doğrulama ve şifreleme. |
| **Tools** | Node-Cron & pg_dump | Otomasyon ve Yedekleme araçları. |

---

## 🗄️ Veritabanı Mimarisi

Veritabanı **PostgreSQL** üzerinde kurgulanmış olup, aşağıdaki temel tabloları ve ilişkileri içerir:

1.  **Users & Roles:** Yetkilendirme sistemi (1: Admin, 2: Müşteri).

2.  **Movies & Sessions:** Film ve seans bilgileri (1-N İlişki).

3.  **Halls & Seats:** Salon ve koltuk haritası.

4.  **Tickets & Sales:** Bilet ve ürün satış kayıtları.

5.  **Wallets & Transactions:** Finansal kayıtlar.

6.  **Reviews:** Kullanıcı yorumları ve puanları.

7.  **Products:** Büfe ürünleri stoğu.

---

## ⚙️ Kurulum (Localhost)

Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin:

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/gunbaz/ultra-cinema-platform.git
cd ultra-cinema-platform
```

### 2. Bağımlılıkları Yükleyin

Hem Backend hem Frontend klasörlerinde kütüphaneleri yükleyin:

```bash
# Backend için
cd backend
npm install

# Frontend için (Yeni terminalde)
cd frontend
npm install
```

### 3. Veritabanını Hazırlayın (PostgreSQL)

PostgreSQL'de `CinemaDB` adında bir veritabanı oluşturun.

`backend/backups` klasöründeki en güncel `.sql` dosyasını DBeaver veya pgAdmin ile import edin (Restore).

Bu işlem tüm tabloları, verileri ve rolleri otomatik kuracaktır.

### 4. Çevre Değişkenlerini Ayarlayın (.env)

`backend` klasöründe `.env` dosyası oluşturun ve bilgilerinizi girin:

```env
DB_USER=postgres
DB_PASSWORD=sifreniz
DB_HOST=localhost
DB_PORT=5432
DB_NAME=CinemaDB
JWT_SECRET=gizli_anahtar
```

### 5. Uygulamayı Başlatın

**Backend:**

```bash
npm run dev
# Server 5000 portunda çalışacak ve otomatik yedekleme servisi başlayacaktır.
```

**Frontend:**

```bash
npm run dev
# Localhost:5173 adresinden siteye erişebilirsiniz.
```

## 👥 Proje Ekibi

* **Furkan Günbaz** - Full Stack Developer & Database Architect
* **Enes Cabbar Akça** - Full Stack Developer & Database Architect
