Proje Bağlamı (Memory Bank)

Ders / Konu



Bu proje "Database Management Systems" (Veritabanı Yönetim Sistemleri / DBMS) dersi içindir.



Hedef: Bir veritabanı tasarlamak ve bu veritabanı üzerinde temel SQL işlemlerini gerçekleştiren küçük bir uygulama yazmak.



Projenin Adı



"Sinema Rezervasyon Sistemi"



Teknik Seçimler



Veritabanı yönetim sistemi: PostgreSQL



Uygulama tarafı: PostgreSQL’e bağlanan bir uygulama (örnek: komut satırı / küçük servis).



Önemli: Uygulama mutlaka veritabanıyla konuşacak. Sadece ER diyagram çizip bırakmak yetmez.



Minimum Gereksinimler (Hocanın İstediği Şeyler)



Veritabanında en az 5 adet tablo olacak.



Bu tablolar birbiriyle ilişkili olacak (yani foreign key’ler olacak).



Uygulama şu temel işlemleri yapabilmeli (CRUD):



EKLE (INSERT)



SİL (DELETE)



GÜNCELLE (UPDATE)



LİSTELE / SORGULA (SELECT)



Bu CRUD işlemleri gerçek tablo alanlarında çalışmalı. Sadece örnek kod veya pseudo kod değil, gerçek SQL üretilecek.



Copilot bu gereksinimlerin dışına çıkmamalı:



ORM kullanıp her şeyi gizleme, SQL sorguları net ve görünür olsun.



Çok karmaşık mimari (microservice, Docker swarm, message queue vb.) istemiyoruz.



Amaç: Basit, anlaşılır, eğitim amaçlı sistem.



Sistem Açıklaması



Bu sistem bir sinema salonunda bilet rezervasyon yönetimi yapar. Temel varlıklar:



Film: Gösterime giren filmler.



Salon: Fiziksel sinema salonları (örnek: Salon 1, Salon 2).



Seans: Hangi film hangi salonda hangi tarihte/saatte oynuyor.



Müşteri: Bilet alan kişi.



Bilet: Müşterinin belirli bir seans için aldığı koltuk.



Bu tablolar birbirine bağlı olacak.

Örnek ilişkiler:



1 film → birçok seans



1 salon → birçok seans



1 seans → birçok bilet



1 müşteri → birçok bilet



Tablo Taslakları (İsimler ve ana alanlar)



Not: Copilot bu isimleri ve ilişkileri korumaya çalışsın. Gereksiz alan eklemesin.



1\. film



film\_id (PRIMARY KEY)



ad (film adı)



süre\_dk (kaç dakika)



tür (örneğin aksiyon, komedi, vb.)



yas\_siniri (örnek: 13+, 18+)



2\. salon



salon\_id (PRIMARY KEY)



ad (ör: "Salon 1")



kapasite (koltuk sayısı)



3\. seans



seans\_id (PRIMARY KEY)



film\_id (FOREIGN KEY → film.film\_id)



salon\_id (FOREIGN KEY → salon.salon\_id)



tarih\_saat (timestamp)



Not: Bir seans, tek bir film ve tek bir salona bağlıdır.



4\. musteri



musteri\_id (PRIMARY KEY)



ad\_soyad



email



telefon



5\. bilet



bilet\_id (PRIMARY KEY)



seans\_id (FOREIGN KEY → seans.seans\_id)



musteri\_id (FOREIGN KEY → musteri.musteri\_id)



koltuk\_no (ör: "B12")



fiyat



satin\_alma\_zamani (timestamp)



Not: Bir müşteri aynı seans için birden fazla bilet alabilir, ama aynı koltuk\_no iki kez satılmamalı (unique constraint: seans\_id + koltuk\_no birlikte unique olmalı).



Uygulama Seviyesinde Yapılacak İşlemler



Copilot’un üretmesi gereken fonksiyonlar / endpointler / menü komutları şunları desteklemeli:



Yeni film ekle, sil, güncelle, listele.



Yeni salon ekle, sil, güncelle, listele.



Yeni seans oluştur (film + salon + tarih/saat bağla), sil, güncelle, listele.



Yeni müşteri kaydet, sil, güncelle, listele.



Bilet sat:



Girdi: musteri\_id, seans\_id, koltuk\_no



Çıktı: bilet kaydı oluştur



Biletleri listele:



Tüm biletler veya belirli bir müşterinin biletleri



Belirli bir seansın dolu koltukları



Bilet iptal et (bilet sil)



Bütün bu işlemler, PostgreSQL üzerinde INSERT / SELECT / UPDATE / DELETE çalıştırmalıdır.



Proje Tesliminde Beklenenler



PostgreSQL için tablo oluşturma komutları (CREATE TABLE ...)



İlişkilerde FOREIGN KEY tanımları



Örnek veri ekleme komutları (INSERT INTO ...)



CRUD fonksiyonları (uygulama kodu tarafında)



Temel raporlama sorguları (örneğin: “Belirli bir filme ait toplam satılan bilet sayısı nedir?” gibi SELECT + JOIN kullanan sorgular)



Tarz / Kodlama İlkeleri



Türkçe tablo ve sütun adları kullanılması kabul edilebilir.



Kod mümkün olduğunca sade olmalı. Aşırı abstraction yok.



Bağımlılık listesi minimal olsun.



Copilot gereksiz framework önermesin. (Spring Boot, NestJS, React admin panel vs. zorunlu değil.)



Burada amaç: veritabanını anlamak, full-stack şov yapmak değil.

