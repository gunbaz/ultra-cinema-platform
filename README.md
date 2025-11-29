# 🎬 ULTRA CINEMA PLATFORM

> **Üniversite Veritabanı Yönetim Sistemleri Dersi İçin Geliştirilmiş, Full Stack Sinema Rezervasyon ve Yönetim Sistemi.**

![Project Status](https://img.shields.io/badge/Status-Completed-success)
![Tech Stack](https://img.shields.io/badge/Stack-PERN-blue)
![Database](https://img.shields.io/badge/Database-PostgreSQL-336791)

## 📌 Proje Hakkında

**Ultra Cinema Platform**, modern web teknolojileri kullanılarak geliştirilmiş, ölçeklenebilir ve güvenli bir bilet rezervasyon sistemidir. Sıradan bir rezervasyon sisteminin ötesine geçerek; **entegre cüzdan sistemi**, **dinamik fiyatlandırma**, **otomatik veritabanı yedekleme** ve **gelişmiş admin paneli** gibi ticari özellikler barındırır.

Veritabanı mimarisi **3. Normal Form (3NF)** kurallarına tam uyumlu olarak tasarlanmış olup, veri bütünlüğü (Data Integrity) ve ACID prensipleri ön planda tutulmuştur.

## 🚀 Öne Çıkan Özellikler

### 💰 Finansal Sistem & Cüzdan (YENİ)
* **Dijital Cüzdan:** Her kullanıcının kendine ait, veritabanında "Transaction" (İşlem) mantığıyla çalışan bir cüzdanı vardır.
* **Bakiye Yükleme:** Kullanıcılar cüzdanlarına güvenli bir şekilde bakiye yükleyebilir.
* **%10 İndirim Avantajı:** Cüzdan ile yapılan ödemelerde sistem otomatik olarak **%10 indirim** uygular. (Dinamik Fiyatlandırma).
* **İşlem Geçmişi:** Tüm para yükleme ve harcama işlemleri `wallet_transactions` tablosunda kayıt altına alınır (Loglama).

### 🛡️ Güvenlik ve Veri Koruma (YENİ)
* **Otomatik Yedekleme (Cron Job):** Sistem, arka planda her gece veritabanının yedeğini (`.sql` formatında) sunucuya kaydeder.
* **Manuel Yedekleme:** Admin panelinden tek tıkla anlık veritabanı yedeği alınabilir.
* **JWT & Bcrypt:** Kullanıcı şifreleri hashlenerek saklanır ve API güvenliği JSON Web Token ile sağlanır.

### 🎟️ Rezervasyon Sistemi
* **Görsel Koltuk Seçimi:** Salonun doluluk durumu anlık olarak çekilir; dolu koltuklar kırmızı, boşlar yeşil görünür.
* **Akıllı Biletleme:** Bilet alındığı anda ilgili koltuk kilitlenir ve veritabanı tetikleyicileri (Triggers) devreye girer.

### ⚡ Yönetim Paneli (Admin Dashboard)
* **İstatistikler:** Toplam hasılat, satılan bilet sayısı ve aktif film sayısı anlık görüntülenir.
* **CRUD İşlemleri:** Film ekleme, silme, düzenleme ve vizyon tarihi yönetimi.
* **Seans Yönetimi:** Yeni film eklendiğinde sistem otomatik olarak varsayılan seansları oluşturur.

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

1.  **Movies & Sessions:** Film ve seans bilgileri (1-N İlişki).
2.  **Halls & Seats:** Salon ve koltuk haritası.
3.  **Users & Roles:** Yetkilendirme sistemi (Müşteri / Admin).
4.  **Tickets:** Satış kayıtları (User, Session ve Seat tablolarına bağlı).
5.  **Wallets & Transactions:** Finansal kayıtlar ve bakiye geçmişi.

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

Bu işlem tüm tabloları, trigger'ları ve örnek verileri otomatik kuracaktır.

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
