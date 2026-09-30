# Super model do wyliczania xG z użyciem zbioru statsbomb

Autorzy:
Wiktor Krocz
Paweł Szuber

# Uruchomienie 

W celu uruchomienia należy

- utworzyć bazę danych PostgreSQL
- umieścić DATABSE_URL w pliku .env w głównym katalogu projektu,
- stworzyć środowisko wirtualne pythona w katalogu głównym projektu i zainstalować wymagane biblioteki,
- zmigrować i zseedować bazę danych
  ```  
  npx prisma migrate dev
  npx prisma db seed
  ```
- uruchomić
  ```
  npm install
  npm run start
  ```
