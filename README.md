# Smart-Route

## Opis aplikacji

SmartRoute to aplikacja webowa, która zamiast najszybszej trasy z punktu A do B proponuje **ciekawszą alternatywę
z przystankami po drodze** – dopasowaną do zainteresowań użytkownika – i pokazuje ją na mapie obok trasy
standardowej. Ostateczną decyzję zawsze podejmuje użytkownik.

Funkcjonalności:

- **Konto użytkownika** – rejestracja i logowanie (JWT: access + refresh token z rotacją), konta demo
  i rola administratora.
- **Profil preferencji** – zainteresowania (natura, historia, kultura, kulinaria, punkty widokowe, aktywny wypoczynek),
  środek transportu (samochód, motocykl, rower), budżet dodatkowego czasu, maks. liczba przystanków oraz opis
  w języku naturalnym, np. „jadę z dziećmi, lubię zamki”.
- **Dowolny start i cel** – wyszukiwarka miejscowości w Polsce z podpowiedziami (także wsie; przy miejscowościach
  o tej samej nazwie widać powiat i województwo), lista ostatnio wybieranych miejsc.
- **Przystanki wzdłuż prawdziwej trasy** – aplikacja wyznacza przebieg po drogach i szuka atrakcji w „korytarzu”
  wokół niego (zamki, pałace, muzea, pomniki, parki narodowe, rezerwaty, jaskinie, wieże widokowe, zoo…),
  a AI wybiera z nich te, które najlepiej pasują do profilu, i uzasadnia wybór.
- **Podgląd miejsc** – każdy przystanek ma zdjęcie, opis, wskazówkę od AI i link do Wikipedii (na liście
  i w dymku na mapie).
- **Mapa** – obie trasy narysowane po drogach, ponumerowane przystanki, motyw jasny/ciemny.
- **Decyzja i historia** – użytkownik wybiera trasę standardową albo alternatywę; wybory są zapisywane
  i wpływają na kolejne rekomendacje. Historia pozwala zaplanować tę samą trasę ponownie.

## Opis techniczny

### Technologie

| Warstwa | Technologie |
|---|---|
| Backend (API) | Java 21, Spring Boot 3.5 (Web, Data JPA, Validation, Security), jjwt 0.12, H2 (in-memory), Maven |
| Frontend | Angular 22 (standalone components, signals, `OnPush`), TypeScript 6, RxJS, Leaflet 1.9, SCSS |
| AI | Claude API (Anthropic Messages API, domyślnie `claude-haiku-5-5`) |
| Dane zewnętrzne | Wikidata (katalog atrakcji), Photon / OpenStreetMap (wyszukiwanie miejscowości), OSRM (trasy po drogach), CARTO Basemaps (kafelki mapy) |
| Testy | JUnit 5, AssertJ, Spring MockMvc |

### Przepływ planowania trasy

```
Angular ──► TripController ──► TripPlannerService
                                  ├─ RoadRouter (OSRM)        – przebieg trasy po drogach
                                  ├─ PoiCatalog (Wikidata)    – ~10 tys. atrakcji w Polsce
                                  ├─ CandidateFinder          – atrakcje w korytarzu wzdłuż trasy
                                  └─ RecommendationEngine
                                       ├─ ClaudeRouteAdvisor     (gdy jest klucz API)
                                       └─ HeuristicRouteAdvisor  (bez klucza / gdy AI zawiedzie)
                                              │
                                              ▼
                                  ProposalValidator ──► TripPlan (H2)
```

### Ciekawsze rozwiązania

- **AI wybiera, a nie wymyśla.** Model dostaje listę prawdziwych kandydatów (z czasem objazdu, opisem i pozycją
  na trasie) i zwraca JSON z ich identyfikatorami. `ProposalValidator` odrzuca punkty spoza listy i duplikaty,
  pilnuje limitu przystanków i budżetu czasu oraz układa przystanki w kolejności przejazdu. Dzięki temu AI nie może
  „zmyślić” miejsca ani podać złych współrzędnych.
- **Odporność na awarie AI.** Brak klucza, timeout, błąd API albo niepoprawny JSON powodują przełączenie na
  heurystykę (`RecommendationEngine`), a interfejs pokazuje komunikat o błędzie.
- **Korytarz wzdłuż trasy po drogach.** `CandidateFinder` liczy odległość atrakcji od łamanej z OSRM (a nie od prostej
  A–B), szerokość korytarza zależy od budżetu czasu i środka transportu. Ranking łączy dopasowanie do zainteresowań,
  popularność miejsca (liczba wersji językowych Wikipedii), obecność zdjęcia i koszt objazdu; punkty leżące
  obok siebie (np. zamek i muzeum w zamku) nie dublują się.
- **Katalog atrakcji z Wikidata.** Zapytania przestrzenne SPARQL okazały się zbyt wolne (ponad minutę), więc
  `PoiCatalog` pobiera atrakcje **według typu** (38 typów, `PoiType`) dla całej Polski – w tle, z przerwami
  i ponawianiem przy błędach 429/502 – i zapisuje je w `data/poi-catalog.json`. Kolejne starty wczytują plik
  w ułamku sekundy, a katalog odświeża się co 30 dni. Planowanie działa już w trakcie pierwszego pobierania.
- **Bezpieczne uwierzytelnianie.** Osobne sekrety dla access i refresh tokenów (walidowane przy starcie),
  refresh tokeny przechowywane w bazie jako skrót SHA-256 z rotacją przy każdym odświeżeniu; ponowne użycie
  unieważnionego tokenu unieważnia wszystkie sesje użytkownika. Błędy API w formacie RFC 7807 (`ProblemDetail`).
- **Cache zewnętrznych usług.** Trasy OSRM i podpowiedzi miejscowości są buforowane (LRU), więc publiczne serwery
  nie są odpytywane wielokrotnie o to samo.

### API

| Metoda | Ścieżka | Opis |
|---|---|---|
| POST | `/auth/register`, `/auth/login` | rejestracja / logowanie → access + refresh token |
| POST | `/auth/refresh` | nowa para tokenów (rotacja) |
| GET | `/auth/me` | zalogowany użytkownik |
| GET | `/admin/users` | lista użytkowników (rola ADMIN) |
| GET | `/api/meta` | zainteresowania, środki transportu, status AI i katalogu atrakcji |
| GET | `/api/places?q=` | podpowiedzi miejscowości w Polsce `{name, region, lat, lon}` |
| POST | `/api/profiles` | utworzenie profilu preferencji |
| GET/PUT | `/api/profiles/{id}` | odczyt / aktualizacja profilu |
| POST | `/api/trips` | `{profileId, origin: {name, region, lat, lon}, destination: {…}}` → trasa standardowa + propozycja |
| GET | `/api/trips/{id}/geometry` | przebieg obu tras po drogach (punkty `[lat, lon]`) |
| POST | `/api/trips/{id}/decision` | `{decision: "ALTERNATIVE" \| "DIRECT"}` |
| GET | `/api/trips?profileId=` | historia ostatnich 20 planów |

### Struktura projektu

```
Smart-Route/
├── src/main/java/pl/wardiusz/smartroute/
│   ├── ai/            doradcy tras (Claude, heurystyka), prompt, walidacja odpowiedzi
│   ├── config/        konfiguracja (@ConfigurationProperties), konta demo
│   ├── controller/    REST API
│   ├── dto/           żądania i odpowiedzi API
│   ├── entity/        encje JPA
│   ├── mapper/        encje/model ⇄ DTO
│   ├── model/         model domenowy niezależny od JPA
│   ├── repository/    Spring Data JPA
│   ├── security/      Spring Security + filtr JWT
│   └── service/       logika: planowanie, profile, auth, poi/ (katalog), routing/ (geometria, OSRM)
├── src/main/resources/static/   prosty frontend w czystym JS (wersja pierwotna)
├── src/test/                    testy jednostkowe i integracyjne
└── smartroute-web/              główny frontend (Angular)
```

### Uproszczenia

- Dystans i czas przejazdu to szacunek (odległość w linii prostej × współczynnik krętości drogi, średnia prędkość
  zależna od środka transportu); przebieg z OSRM służy do mapy i wyznaczania korytarza.
- Baza H2 działa w pamięci – po restarcie znikają konta (poza demo), profile i historia. Katalog atrakcji zostaje,
  bo jest w pliku.
- Katalog obejmuje tylko Polskę i wybrane typy obiektów z Wikidata.

## Uruchomienie lokalnie

### Wymagania

- **Java 21+** i **Maven 3.9+** (`java -version`, `mvn -v`)
- **Node.js 22+** z npm (`node -v`)
- dostęp do internetu (mapa, wyszukiwarka miejscowości, trasy i katalog atrakcji korzystają z publicznych serwerów)
- opcjonalnie: klucz **Anthropic API** (bez niego rekomendacje działają heurystycznie)
- klucz **CARTO Basemaps** do kafelków mapy

### 1. Konfiguracja backendu

W katalogu głównym projektu skopiuj plik ze zmiennymi środowiskowymi:

```bash
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
```

Uzupełnij w `.env`:

- `JWT_ACCESS_SECRET` i `JWT_REFRESH_SECRET` – **dwa różne** sekrety, każdy min. 32 znaki
  (np. `openssl rand -base64 48`). Bez nich aplikacja nie wystartuje.
- `ANTHROPIC_API_KEY` – opcjonalnie, włącza rekomendacje Claude.

Pozostałe zmienne mają sensowne wartości domyślne (opis w `.env.example`).

### 2. Uruchomienie API

```bash
mvn spring-boot:run
```

- API działa pod <http://localhost:8080>.
- Przy **pierwszym** starcie w tle pobiera się katalog atrakcji z Wikidata (kilka minut, postęp w logach:
  `Pobieram katalog atrakcji…` → `Katalog atrakcji gotowy: … miejsc`). Aplikacja jest gotowa do pracy od razu.
- Konta demo: `demo@smartroute.pl` / `demo1234` (USER) oraz `admin@smartroute.pl` / `admin1234` (ADMIN).
- Konsola bazy: <http://localhost:8080/h2-console> (JDBC URL `jdbc:h2:mem:smartroute`, użytkownik `sa`, bez hasła).

### 3. Konfiguracja frontendu

W pliku `smartroute-web/src/environments/environment.ts` wpisz klucz CARTO Basemaps:

```ts
export const environment = {
  cartoBasemapsKey: 'twój-klucz',
};
```

### 4. Uruchomienie frontendu

W drugim terminalu:

```bash
cd smartroute-web
npm install
npm start
```

Aplikacja: <http://localhost:4200>. Serwer deweloperski przekierowuje `/api` i `/auth` na `localhost:8080`
(`proxy.conf.json`), więc API musi być uruchomione.

### 5. Pierwsze kroki

1. Zaloguj się kontem demo (lub załóż nowe).
2. Uzupełnij profil preferencji.
3. Wybierz miejscowość startową i docelową, kliknij **Znajdź trasy**.
4. Kliknij przystanek, by zobaczyć zdjęcie i opis; wybierz trasę standardową albo alternatywę.

### Testy

```bash
mvn test                     # backend – nie łączy się z zewnętrznymi serwerami (stały katalog testowy)
cd smartroute-web && npm run build   # kompilacja i sprawdzenie typów frontendu
```

## Wykorzystanie narzędzi AI

- **Cursor (agent z modelem Claude)** – główne narzędzie pracy nad projektem. Agent analizował istniejący kod
  i proponował plan zmian przed ich wprowadzeniem, a następnie implementował m.in.:
  - integrację mapy z CARTO Basemaps i rysowanie tras po drogach (OSRM),
  - implementacja wyszukiwarki miejscowości (Photon) i katalogu
    z Wikidata – łącznie z porównaniem źródeł danych (Overpass API okazał się zbyt wolny) i strojeniem zapytań SPARQL,
  - podgląd przystanków ze zdjęciami oraz aktualizację dokumentacji.
  Zmiany weryfikowałem testami (`mvn test`), kompilacją frontendu i zrzutami ekranu z przeglądarki.
- **Claude jako część aplikacji** – w działającej aplikacji model Claude (`ClaudeRouteAdvisor`) dobiera przystanki
  z listy kandydatów do profilu użytkownika i pisze uzasadnienie trasy; jego odpowiedź jest zawsze walidowana
  przez kod.
