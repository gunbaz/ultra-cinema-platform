"""Helpers for connecting to the PostgreSQL database via psycopg2."""

import psycopg2

import db_config


def film_ekle(ad: str, sure_dk: int, tur: str, yas_siniri: str) -> None:
	"""Insert a new film record into the database."""
	connection = None
	try:
		connection = psycopg2.connect(
			host=db_config.host,
			database=db_config.database,
			user=db_config.user,
			password=db_config.password,
			port=db_config.port,
		)
		with connection.cursor() as cursor:
			cursor.execute(
				"""
				INSERT INTO film (ad, sure_dk, tur, yas_siniri)
				VALUES (%s, %s, %s, %s)
				""",
				(ad, sure_dk, tur, yas_siniri),
			)
		connection.commit()
		print("Film eklendi.")
	except Exception as exc:
		if connection is not None:
			connection.rollback()
		print(f"Film eklenemedi: {exc}")
	finally:
		if connection is not None:
			connection.close()


def film_listele() -> None:
	"""Retrieve and display all film records."""
	connection = None
	try:
		connection = psycopg2.connect(
			host=db_config.host,
			database=db_config.database,
			user=db_config.user,
			password=db_config.password,
			port=db_config.port,
		)
		with connection.cursor() as cursor:
			cursor.execute("SELECT * FROM film")
			rows = cursor.fetchall()
			if not rows:
				print("Kayıtlı film bulunamadı.")
			for row in rows:
				print(row)
	except Exception as exc:
		print(f"Filmler listelenemedi: {exc}")
	finally:
		if connection is not None:
			connection.close()


def film_guncelle(film_id: int, yeni_ad: str, yeni_sure_dk: int, yeni_tur: str, yeni_yas_siniri: str) -> None:
	"""Update an existing film record by its identifier."""
	connection = None
	try:
		connection = psycopg2.connect(
			host=db_config.host,
			database=db_config.database,
			user=db_config.user,
			password=db_config.password,
			port=db_config.port,
		)
		with connection.cursor() as cursor:
			cursor.execute(
				"""
				UPDATE film
				SET ad = %s,
					sure_dk = %s,
					tur = %s,
					yas_siniri = %s
				WHERE film_id = %s
				""",
				(yeni_ad, yeni_sure_dk, yeni_tur, yeni_yas_siniri, film_id),
			)
			updated_rows = cursor.rowcount
		if updated_rows == 0:
			print("Güncellenecek film bulunamadı.")
		else:
			connection.commit()
			print("Film güncellendi.")
	except Exception as exc:
		if connection is not None:
			connection.rollback()
		print(f"Film güncellenemedi: {exc}")
	finally:
		if connection is not None:
			connection.close()


def film_sil(film_id: int) -> None:
	"""Delete a film record by its identifier."""
	connection = None
	try:
		connection = psycopg2.connect(
			host=db_config.host,
			database=db_config.database,
			user=db_config.user,
			password=db_config.password,
			port=db_config.port,
		)
		with connection.cursor() as cursor:
			cursor.execute("DELETE FROM film WHERE film_id = %s", (film_id,))
			deleted_rows = cursor.rowcount
		if deleted_rows == 0:
			print("Silinecek film bulunamadı.")
		else:
			connection.commit()
			print("Film silindi.")
	except Exception as exc:
		if connection is not None:
			connection.rollback()
		print(f"Film silinemedi: {exc}")
	finally:
		if connection is not None:
			connection.close()


def main() -> None:
	"""Attempt to connect to PostgreSQL and report the outcome."""
	connection = None
	try:
		connection = psycopg2.connect(
			host=db_config.host,
			database=db_config.database,
			user=db_config.user,
			password=db_config.password,
			port=db_config.port,
		)
		print("Bağlantı başarılı")
	except Exception as exc:
		print(f"Bağlantı başarısız: {exc}")
	finally:
		if connection is not None:
			connection.close()


if __name__ == "__main__":
    main()

    # 1) Güncel listeyi gör
    film_listele()

    # 2) Bir filmi sil (örnek: film_id=4)
    film_sil(4)

    # 3) Tekrar listele, gerçekten silindi mi kontrol et
    film_listele()




