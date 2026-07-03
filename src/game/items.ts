export interface QueueItem { id: string; name: string; costPln: number; sellPricePln: number; timeToBuyMs: number; kartkiCost?: number; }

export const QUEUE_ITEMS: QueueItem[] = [
  { id: 'papier', name: 'Papier Toaletowy', costPln: 0, sellPricePln: 10, timeToBuyMs: 2000 },
  { id: 'mydlo', name: 'Mydło "Biały Jeleń"', costPln: 5, sellPricePln: 30, timeToBuyMs: 5000, kartkiCost: 1 },
  { id: 'cukier', name: 'Cukier (1kg)', costPln: 15, sellPricePln: 75, timeToBuyMs: 12000, kartkiCost: 2 },
  { id: 'maka', name: 'Mąka Pszenna (5kg)', costPln: 25, sellPricePln: 120, timeToBuyMs: 20000, kartkiCost: 1 },
  { id: 'kawa', name: 'Kawa Marago', costPln: 40, sellPricePln: 180, timeToBuyMs: 30000, kartkiCost: 3 },
  { id: 'spirytus', name: 'Spirytus (0.5l)', costPln: 80, sellPricePln: 400, timeToBuyMs: 45000, kartkiCost: 4 },
  { id: 'dzinsy', name: 'Dżinsy "Odra"', costPln: 100, sellPricePln: 450, timeToBuyMs: 60000, kartkiCost: 5 },
  { id: 'relaks', name: 'Buty "Relaks"', costPln: 250, sellPricePln: 1100, timeToBuyMs: 120000 },
  { id: 'predom', name: 'Odkurzacz "Predom"', costPln: 600, sellPricePln: 2600, timeToBuyMs: 250000 },
  { id: 'kasprzak', name: 'Radio "Kasprzak"', costPln: 800, sellPricePln: 3500, timeToBuyMs: 350000 },
  { id: 'frania', name: 'Pralka "Frania"', costPln: 1500, sellPricePln: 6500, timeToBuyMs: 500000 },
  { id: 'kowalski', name: 'Meblościanka "Kowalski"', costPln: 4000, sellPricePln: 18000, timeToBuyMs: 1000000 },
  { id: 'zorki', name: 'Aparat "Zorki"', costPln: 6000, sellPricePln: 28000, timeToBuyMs: 1400000 },
  { id: 'neptun', name: 'TV "Neptun"', costPln: 10000, sellPricePln: 45000, timeToBuyMs: 2000000 },
  { id: 'osa', name: 'Skuter "Osa"', costPln: 18000, sellPricePln: 82000, timeToBuyMs: 3200000 },
  { id: 'wsk', name: 'Motocykl WSK', costPln: 30000, sellPricePln: 140000, timeToBuyMs: 4500000 },
  { id: 'syrena', name: 'Syrena 105', costPln: 100000, sellPricePln: 500000, timeToBuyMs: 12000000 },
  { id: 'fiat125', name: 'Fiat 125p "Duży"', costPln: 400000, sellPricePln: 2000000, timeToBuyMs: 30000000 },
  { id: 'ursus', name: 'Ciągnik "Ursus"', costPln: 1500000, sellPricePln: 8000000, timeToBuyMs: 80000000 },
  { id: 'zis', name: 'Traktor Z.I.S. (Rarytas)', costPln: 8000000, sellPricePln: 45000000, timeToBuyMs: 200000000 },
];

export interface Helper { id: string; name: string; costPln: number; generateId: string; ratePerTick: number; desc: string; }
export const HELPERS: Helper[] = [
  { id: 'wladyslaw', name: 'Emeryt Władysław', costPln: 200, generateId: 'papier', ratePerTick: 0.1, desc: 'Stoi po papier' },
  { id: 'kolega', name: 'Szkolny Kolega', costPln: 1000, generateId: 'mydlo', ratePerTick: 0.05, desc: 'Stoi po mydło' },
  { id: 'halinka', name: 'Sąsiadka Halinka', costPln: 5000, generateId: 'cukier', ratePerTick: 0.02, desc: 'Załatwia cukier' },
  { id: 'basia', name: 'Sklepowa Basia', costPln: 20000, generateId: 'kawa', ratePerTick: 0.01, desc: 'Odkłada kawę' },
  { id: 'spekulant', name: 'Spekulant Giełdowy', costPln: 80000, generateId: 'dzinsy', ratePerTick: 0.005, desc: 'Kombinuje dżinsy' },
  { id: 'staszek', name: 'Złota Rączka Staszek', costPln: 200000, generateId: 'radio_predom', ratePerTick: 0.003, desc: 'Generuje Radio lub Predom' },
  { id: 'zygmunt', name: 'Gierkowiec Zygmunt', costPln: 500000, generateId: 'neptun', ratePerTick: 0.001, desc: 'Generuje Telewizor' },
  { id: 'cinkciarz', name: 'Cinkciarz "Kolega"', costPln: 300000, generateId: 'dollars', ratePerTick: 0.01, desc: 'Skupuje 0.01$/sek' },
  { id: 'widmo', name: 'Handlarz Widmo', costPln: 2000000, generateId: 'dollars_passive', ratePerTick: 0.05, desc: 'Generuje $0.05/sek' },
  { id: 'konspiracja', name: 'Sieć Konspiracyjna', costPln: 8000000, generateId: 'kartki', ratePerTick: 5 / 60, desc: 'Generuje 5 kartek/min' },
];

export interface Business { id: string; name: string; costDollars: number; generateType: 'pln' | 'dollars' | 'gozdziki' | 'czesci' | 'wyroby_hutnicze'; ratePerTick: number; desc: string; }
export const BUSINESSES: Business[] = [
  { id: 'szklarnia', name: 'Szklarnia z goździkami', costDollars: 1000, generateType: 'gozdziki', ratePerTick: 3.0, desc: 'Produkcja goździków (+3.0 szt/sek)' },
  { id: 'warsztat', name: 'Warsztat ślusarski', costDollars: 5000, generateType: 'czesci', ratePerTick: 3.0, desc: 'Produkcja części zamiennych (+3.0 szt/sek)' },
  { id: 'kombinat', name: 'Spółka Polonijna "Kombinat"', costDollars: 20000, generateType: 'wyroby_hutnicze', ratePerTick: 0.05, desc: 'Produkcja wyrobów hutniczych (+0.05 szt/sek)' }
];

export interface SmugglingRoute { id: string; name: string; costPln: number; timeMs: number; riskPercent: number; rewardDesc: string; minDollarsEarned: number; maxDollarsEarned: number; }
export const SMUGGLING_ROUTES: SmugglingRoute[] = [
  { id: 'turcja', name: 'Autobus do Turcji (Stambuł)', costPln: 5000, timeMs: 60000, riskPercent: 15, rewardDesc: 'Handel ciuchami (10$ - 30$)', minDollarsEarned: 10, maxDollarsEarned: 30 },
  { id: 'jugoslawia', name: 'Maluch do Jugosławii', costPln: 20000, timeMs: 180000, riskPercent: 25, rewardDesc: 'Przemyt elektroniki (50$ - 150$)', minDollarsEarned: 50, maxDollarsEarned: 150 },
  { id: 'vhs_route', name: 'Szmugiel kaset VHS', costPln: 50000, timeMs: 300000, riskPercent: 20, rewardDesc: 'Kasety z filmami ($150 - $400)', minDollarsEarned: 150, maxDollarsEarned: 400 },
  { id: 'moskwa', name: 'Pociąg do Moskwy (ZSRR)', costPln: 8000, timeMs: 120000, riskPercent: 10, rewardDesc: 'Szary import towarów ($15 - $40 + 20-50 Rubli)', minDollarsEarned: 15, maxDollarsEarned: 40 },
];

export interface PewexItem { id: string; name: string; costDollars: number; desc: string; }
export const PEWEX_ITEMS: PewexItem[] = [
  { id: 'donald', name: 'Guma Donald', costDollars: 2, desc: '+15% cen sprzedaży' },
  { id: 'toblerone', name: 'Czekolada Toblerone', costDollars: 10, desc: '-15% czasu w kolejce' },
  { id: 'lego', name: 'Klocki Lego', costDollars: 35, desc: 'Pomocnicy szybsi o 30%' },
  { id: 'krakus', name: 'Szynka Krakus', costDollars: 80, desc: '+5% szansy na x2 z kolejki' },
  { id: 'wrangler', name: 'Jeansy Wrangler', costDollars: 200, desc: '+50% zysków z bazaru' },
  { id: 'cola', name: 'Coca-Cola', costDollars: 400, desc: '-20% czasu kolejki' },
  { id: 'sanyo', name: 'Magnetowid Sanyo', costDollars: 1000, desc: 'Pomocnicy szybsi o 50%' },
  { id: 'c64', name: 'Commodore 64', costDollars: 3000, desc: 'Automatycznie pcha kolejkę' },
  { id: 'walkman', name: 'Walkman Sony', costDollars: 5500, desc: 'Praca państwowa daje 2x PLN' },
  { id: 'rubin', name: 'TV Rubin', costDollars: 8000, desc: '+100% ogólnych zysków' },
  { id: 'polaroid', name: 'Kamera Polaroid', costDollars: 12000, desc: '-25% ryzyka przemytu' },
  { id: 'casio', name: 'Kalkulator Casio', costDollars: 18000, desc: 'Widać szczegółowe statystyki i produkcję/s' },
  { id: 'maluch', name: 'Fiat 126p', costDollars: 25000, desc: '-40% czasu kolejki' },
  { id: 'vhs', name: 'Wideo-kasety VHS', costDollars: 40000, desc: 'Odblokuje szmugiel kaset VHS' },
  { id: 'podwojna_kolejka', name: 'Podwójny Komitet', costDollars: 50000, desc: 'Pozwala stać w dwóch kolejkach naraz (dwie niezależne kolejki)' },
  { id: 'm3', name: 'Mieszkanie M3', costDollars: 75000, desc: 'Produkcja offline (50% wydajności)' },
  { id: 'willa', name: 'Willa w Konstancinie', costDollars: 150000, desc: 'Produkcja offline (100% wydajności)' },
  { id: 'szwajcaria', name: 'Konto w Szwajcarii', costDollars: 300000, desc: 'Brak podejrzeń z wymian u Cinkciarza' },
  { id: 'swift', name: 'System SWIFT', costDollars: 20000, desc: 'SWIFT wire transfer prowizja 0.5%, czas 5s' },
  { id: 'transformacja', name: 'Pakiet Prywatyzacyjny (1989)', costDollars: 500000, desc: 'Ostateczne zwycięstwo (Transformacja ustrojowa)' },
];

export interface PartyRank { id: string; name: string; costPln: number; desc: string; }
export const PARTY_RANKS: PartyRank[] = [
  { id: 'czlonek', name: 'Członek PZPR', costPln: 20000, desc: '-10% koszt łapówek' },
  { id: 'sekretarz', name: 'I Sekretarz Komitetu Zakładowego', costPln: 100000, desc: 'Brak Milicji do 50% Podejrzenia' },
  { id: 'dyrektor', name: 'Dyrektor Zjednoczenia', costPln: 500000, desc: 'Pomocnicy tańsi o 50%' },
  { id: 'wiceminister', name: 'Wiceminister Przemysłu', costPln: 2000000, desc: 'Kartki co 30s za darmo (+2/30s)' },
  { id: 'minister', name: 'Minister Gospodarki', costPln: 8000000, desc: 'Całkowity brak Milicji' },
  { id: 'biuro', name: 'Członek Biura Politycznego', costPln: 30000000, desc: 'Wszystkie źródła PLN dają 3x; cel SB!' },
];

export interface PlnUpgrade { id: string; name: string; costPln: number; desc: string; }
export const PLN_UPGRADES: PlnUpgrade[] = [
  { id: 'torba', name: 'Torba Bazarowa (Nylonowa)', costPln: 500, desc: 'Odblokowuje przycisk "Sprzedaj x100"' },
  { id: 'wozek', name: 'Wózek na kółkach', costPln: 2500, desc: 'Odblokowuje przycisk "Sprzedaj x10"' },
  { id: 'zeszyt', name: 'Zeszyt Komitetu', costPln: 150, desc: 'Automatycznie zapisuje ponownie do kolejki' },
  { id: 'kozuch', name: 'Ciepły Kożuch', costPln: 800, desc: 'Skraca czas stania w kolejce o 10%' },
];

export interface HistoryEvent { id: string; name: string; desc: string; durationSec: number; era?: 'lata2000'; }
export const HISTORY_EVENTS: HistoryEvent[] = [
  {
    id: 'czarnobyl',
    name: 'Awaria w Elektrowni (Czarnobyl)',
    desc: 'Skażenie powietrza! Sklepy skupują towary po zaniżonych cenach (-30% wartości sprzedaży) przez 3 minuty.',
    durationSec: 180
  },
  {
    id: 'stocznia',
    name: 'Strajk w Stoczni Gdańskiej',
    desc: 'Strajki paraliżują kraj! Opozycja drukuje nielegalne kartki. Wymiana talonów na kartki jest o 50% tańsza (1 Talon = 3 Kartki) przez 2 minuty.',
    durationSec: 120
  },
  {
    id: 'papiez',
    name: 'Wizyta Jana Pawła II',
    desc: 'Niezwykłe chwile zjednoczenia i nadziei! Podejrzenie Milicji spada o 20% natychmiast, a do budżetu wpływa jednorazowy dar +500 zł.',
    durationSec: 60
  },
  {
    id: 'podwyzki',
    name: 'Podwyżki Cen (1976/1980)',
    desc: 'Władze ogłaszają "regulację cen"! Koszty rozpoczęcia stania w kolejce rosną o 50% przez 5 minut.',
    durationSec: 300
  },
  {
    id: 'kryzys',
    name: 'Kryzys Paliwowy',
    desc: 'Brak benzyny i ropy! Czas stania we wszystkich kolejkach wzrasta o 20% przez 5 minut.',
    durationSec: 300
  },
  {
    id: 'odwilz',
    name: 'Odwilż Polityczna',
    desc: 'Złagodzenie represji! Podejrzenie Milicji nie wzrasta przez 3 minuty z żadnej czynności.',
    durationSec: 180
  },
  {
    id: 'drozyzna',
    name: 'Drożyzna i Inflacja',
    desc: 'Czarnorynkowy kurs dolara gwałtownie rośnie! Cena dolara w PLN wzrasta o 30% przez 5 minut.',
    durationSec: 300
  },
  {
    id: 'samochod',
    name: 'Bony na Samochód',
    desc: 'Pula państwowych przydziałów motoryzacyjnych! Otrzymujesz bon na losowy polski samochód dostarczony do Twojego garażu (Syrena 105 lub Fiat 125p).',
    durationSec: 60
  },
  {
    id: 'uwolnienie_cen',
    name: 'Uwolnienie Cen Żywności (1989)',
    desc: 'Uwolnienie cen koszyka podstawowego! Inflacja przyśpiesza o +0.8%/s, koszty stania w kolejce rosną o 100%, ale ceny sprzedaży towarów na Bazarze rosną o 150% przez 90 sekund.',
    durationSec: 90
  },
  {
    id: 'reforma_wilczka',
    name: 'Ustawa Wilczka (1989)',
    desc: 'Co nie jest zakazane, jest dozwolone! Wydajność biznesów i pomocników rośnie o +50%, a pasywna dewaluacja PLN jest wstrzymana przez 2 minuty.',
    durationSec: 120
  },
  {
    id: 'czarny_wtorek',
    name: 'Czarny Wtorek (Panika Walutowa)',
    desc: 'Panika na rynku walutowym! Kurs dolara na czarnym rynku rośnie o +100% przez 60 sekund.',
    durationSec: 60
  }
];

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  category: 'ekonomia' | 'polityka' | 'przemyt' | 'prestiz';
  rewardDesc: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  // EKONOMIA
  { id: 'eco_pln_1', name: 'Pierwszy Kombinat', desc: 'Zgromadź łącznie 100 zł', category: 'ekonomia', rewardDesc: '+5% cen sprzedaży towarów' },
  { id: 'eco_pln_2', name: 'Młody Dorobkiewicz', desc: 'Zgromadź łącznie 10 000 zł', category: 'ekonomia', rewardDesc: '+10% cen sprzedaży towarów' },
  { id: 'eco_pln_3', name: 'Papierowy Milioner', desc: 'Zgromadź łącznie 1 000 000 zł', category: 'ekonomia', rewardDesc: '+20% cen sprzedaży towarów' },
  { id: 'eco_sell_1', name: 'Drobny Spekulant', desc: 'Sprzedaj 100 sztuk towaru na Bazarze', category: 'ekonomia', rewardDesc: '+5% zysku z pracy' },
  { id: 'eco_sell_2', name: 'Spekulant Roku', desc: 'Sprzedaj 1 000 sztuk towaru na Bazarze', category: 'ekonomia', rewardDesc: '+15% zysku z pracy' },
  { id: 'eco_queue_1', name: 'Kolejkowicz', desc: 'Spędź łącznie 10 minut (600s) w kolejkach', category: 'ekonomia', rewardDesc: '-5% czasu stania w kolejce' },
  { id: 'eco_queue_2', name: 'Kolejkowy Mistrz', desc: 'Spędź łącznie 1 godzinę (3 600s) w kolejkach', category: 'ekonomia', rewardDesc: '-15% czasu stania w kolejce' },
  { id: 'eco_usd_1', name: 'Walutowy Gangster', desc: 'Posiadaj $10 000 jednocześnie', category: 'ekonomia', rewardDesc: '+10% pasywnego zysku z biznesów' },
  { id: 'eco_cinkciarz_1', name: 'Młody Cinkciarz', desc: 'Wymień walutę u Cinkciarza 10 razy', category: 'ekonomia', rewardDesc: '2% lepszy kurs oficjalnego kantoru' },
  { id: 'eco_cinkciarz_2', name: 'Czarny Cinkciarz', desc: 'Wymień walutę u Cinkciarza 100 razy', category: 'ekonomia', rewardDesc: '5% lepszy kurs oficjalnego kantoru' },

  // POLITYKA
  { id: 'pol_rank_1', name: 'Towarzysz', desc: 'Awansuj na Członka PZPR', category: 'polityka', rewardDesc: '-5% generowanego podejrzenia' },
  { id: 'pol_rank_2', name: 'Partyjniak', desc: 'Awansuj na I Sekretarza', category: 'polityka', rewardDesc: '-10% generowanego podejrzenia' },
  { id: 'pol_rank_3', name: 'Naczelny Dyrektor', desc: 'Awansuj na Dyrektora Zjednoczenia', category: 'polityka', rewardDesc: 'Pomocnicy tańsi o dodatkowe 10%' },
  { id: 'pol_rank_4', name: 'Kolaborant', desc: 'Zostań Ministrem Gospodarki', category: 'polityka', rewardDesc: '+25% do prędkości pomocników' },
  { id: 'pol_bribe_1', name: 'Pierwsza Koperta', desc: 'Daj łapówkę 1 raz', category: 'polityka', rewardDesc: 'Koszty łapówek tańsze o 10%' },
  { id: 'pol_bribe_2', name: 'Towarzysz Sekretarz', desc: 'Przeznacz łącznie 10 000 zł na łapówki', category: 'polityka', rewardDesc: 'Koszty łapówek tańsze o 25%' },
  { id: 'pol_raid_1', name: 'Wróg Ludu', desc: 'Przetrwaj 5 nalotów Milicji', category: 'polityka', rewardDesc: '10% szansy na uniknięcie nalotu i straty' },

  // PRZEMYT
  { id: 'smug_first', name: 'Przemytnik Amator', desc: 'Ukończ pomyślnie 5 transportów', category: 'przemyt', rewardDesc: '+10% zysków z przemytu ($)' },
  { id: 'smug_king', name: 'King of the Road', desc: 'Ukończ pomyślnie 25 transportów', category: 'przemyt', rewardDesc: '+25% zysków z przemytu ($)' },
  { id: 'smug_safe', name: 'Niewidzialny', desc: 'Zarób łącznie $1 000 z przemytu', category: 'przemyt', rewardDesc: '-10% ryzyka wpadki na cle' },
  { id: 'smug_caught', name: 'Ofiara Cła', desc: 'Zostań zatrzymany na cle 5 razy', category: 'przemyt', rewardDesc: 'Ubezpieczenie na cle: +$10 przy wpadce' },
  { id: 'black_market_1', name: 'Klient Czarnego Rynku', desc: 'Kup towar bez kolejki 10 razy', category: 'przemyt', rewardDesc: 'Zakupy bez kolejki tańsze o 10%' },
  { id: 'black_market_2', name: 'Czarny Rynek VIP', desc: 'Dokonaj łącznie 50 zakupów na Czarnym Rynku', category: 'przemyt', rewardDesc: 'Zakupy bez kolejki tańsze o 20%' },
  { id: 'smug_moskwa', name: 'Sowiecki Łącznik', desc: 'Wyślij pociąg do Moskwy 10 razy', category: 'przemyt', rewardDesc: '+2 Ruble nagrody za każdy kurs do Moskwy' },

  // PRESTIŻ
  { id: 'pres_escape_1', name: 'Emigrant', desc: 'Ucieknij do NRF po raz pierwszy', category: 'prestiz', rewardDesc: 'Startujesz z +50 zł w nowej grze' },
  { id: 'pres_escape_2', name: 'Weteran Systemu', desc: 'Ucieknij do NRF 5 razy', category: 'prestiz', rewardDesc: 'Startujesz z dodatkowymi +200 zł' },
  { id: 'pres_time_1', name: 'Kombinator Dekady', desc: 'Graj przez łącznie 1 godzinę (3600s)', category: 'prestiz', rewardDesc: '+10% do zysków z pracy i bazaru' },
  { id: 'pres_time_2', name: 'Legenda PRL-u', desc: 'Graj przez łącznie 3 godziny (10800s)', category: 'prestiz', rewardDesc: '+25% do zysków z pracy i bazaru' },
  { id: 'pres_points', name: 'Kolekcjoner Marek', desc: 'Zgromadź łącznie 50 Marek (DM) z ucieczek', category: 'prestiz', rewardDesc: '+10% do prędkości pomocników' },
  { id: 'pres_transform', name: 'Wolny Rynek', desc: 'Kup Pakiet Prywatyzacyjny (1989)', category: 'prestiz', rewardDesc: 'Zwycięstwo! +50% do wszystkich zysków w nowej grze' },
  
  // SZMUGI MORSKIE
  { id: 'sea_smug_1', name: 'Wilk Morski', desc: 'Ukończ pomyślnie 5 rejsów szmuglerskich', category: 'przemyt', rewardDesc: '+10% zysków w Bonach Baltona' },
  { id: 'sea_smug_2', name: 'Kapitan Floty', desc: 'Ukończ pomyślnie 25 rejsów szmuglerskich', category: 'przemyt', rewardDesc: '+20% zysków w Bonach Baltona' },
  { id: 'sea_smug_3', name: 'Trójkąt Bermudzki', desc: 'Zarób łącznie 500 Bonów Baltona ze szmuglu morskiego', category: 'przemyt', rewardDesc: 'Czas rejsów morskich -15%' },
  // GPW
  { id: 'gpw_wolf', name: 'Wilk z Wall Street (GPW)', desc: 'Zarób łącznie 500 000 zł z zysków na giełdzie', category: 'ekonomia', rewardDesc: 'Brak prowizji maklerskiej (0% zamiast 1%)' },
  { id: 'gpw_investor', name: 'Inwestor Strategiczny', desc: 'Posiadaj 1 000 akcji jednej spółki', category: 'ekonomia', rewardDesc: '+20% do wypłacanych dywidend' },
  { id: 'gpw_crash', name: 'Krach 1991', desc: 'Zanotuj stratę co najmniej 50 000 zł na giełdzie', category: 'ekonomia', rewardDesc: '-15% kosztów zakupu akcji' },
  // NOMENKLATURA
  { id: 'nom_director', name: 'Czerwony Baron', desc: 'Zatrudnij łącznie 10 Czerwonych Dyrektorów we wszystkich spółkach', category: 'ekonomia', rewardDesc: 'Czerwoni dyrektorzy są tańsi o 30%' },
  { id: 'nom_oligarch', name: 'Afera Alkoholowa', desc: 'Zarób łącznie 2 000 000 zł ze spółek nomenklaturowych', category: 'ekonomia', rewardDesc: 'Leasing majątku kombinatów tańszy o 20%' },
  { id: 'nom_corruption', name: 'Brak Śladów', desc: 'Zwerbuj TW we wszystkich 4 spółkach jednocześnie', category: 'ekonomia', rewardDesc: 'Pasywny przyrost Podejrzenia SB zmniejszony o kolejne 30%' },
  // OFFSHORE
  { id: 'offshore_zurich', name: 'Gnom z Zurychu', desc: 'Zgromadź co najmniej $100 000 USD na szwajcarskim koncie', category: 'ekonomia', rewardDesc: 'Pasywne oprocentowanie konta szwajcarskiego wzrasta z 0.1% do 0.15% na minutę' },
  { id: 'offshore_laundry', name: 'Pracz Stulecia', desc: 'Dokonaj legalnego transferu powrotnego (prania) o wartości 1 000 000 PLN', category: 'ekonomia', rewardDesc: 'Zyski ze wszystkich lokat terminowych rosną o +20%' },
  { id: 'offshore_trust', name: 'Tarcza Vaduz', desc: 'Zarejestruj fundację powierniczą w Liechtensteinie', category: 'ekonomia', rewardDesc: 'Fundacja chroni 95% gotówki przed SB (zamiast 80%)' },
  // SYNDYKAT COCOM
  { id: 'cocom_first', name: 'Handlarz COCOM', desc: 'Sprzedaj pierwszy towar objęty embargiem technologicznym', category: 'ekonomia', rewardDesc: '-5% bazowego ryzyka wszystkich transakcji COCOM' },
  { id: 'cocom_magnate', name: 'Człowiek COCOM', desc: 'Sprzedaj łącznie 10 towarów strategicznych', category: 'ekonomia', rewardDesc: 'Automatyczny eksport generuje +25% więcej PLN' },
  { id: 'cocom_nsa', name: 'Szpieg Bez Paszportu', desc: 'Sprzedaj urządzenie kryptograficzne NSA', category: 'ekonomia', rewardDesc: 'Odblokowuje kontrahenta CIA „Fundacja Wolności" (+80% ceny)' },
  // WYBORY 4 CZERWCA
  { id: 'senate_sweep', name: 'W samo południe', desc: 'Zdobądź 99 mandatów w Senacie', category: 'polityka', rewardDesc: '+99% do szybkości generowania prestiżu w III RP' },
  { id: 'propaganda_killer', name: 'Niezależny Dziennikarz', desc: 'Zredukuj propagandę rządową do 0% przed wyborami', category: 'polityka', rewardDesc: 'Gazeta Wyborcza daje podwójne poparcie na stałe' },
  { id: 'church_alliance', name: 'Przymierze Ołtarza z Ludźmi Pracy', desc: 'Osiągnij 100% poparcia Kościoła', category: 'polityka', rewardDesc: '+50% poparcia rolników we wszystkich regionach' },
  { id: 'historical_victory', name: 'Wasz Prezydent, Nasz Premier', desc: 'Sformuj rząd Mazowieckiego z pełną przewagą', category: 'polityka', rewardDesc: '+100% startowych finansów w III RP' }
];
export interface SolidarityLevel { id: string; name: string; threshold: number; effect: string; }
export const SOLIDARITY_LEVELS: SolidarityLevel[] = [
  { id: 'buntownik',   name: 'Buntownik',          threshold: 500,   effect: '+5% do zysków ze sprzedaży na Bazarze' },
  { id: 'sympatyk',   name: 'Sympatyk',          threshold: 1000,  effect: 'Cinkciarz daje 5% lepszy kurs' },
  { id: 'lacznik',    name: 'Łącznik',            threshold: 2000,  effect: '-5% do czasu we wszystkich kolejkach' },
  { id: 'kolporter',  name: 'Kolporter',          threshold: 2500,  effect: 'Po nalocie Milicji tracisz tylko 10% (zamiast 20%)' },
  { id: 'kurier',     name: 'Kurier',             threshold: 3000,  effect: 'Czas realizacji tras przemytniczych krótszy o 15%' },
  { id: 'drukarz',    name: 'Drukarz',            threshold: 4000,  effect: 'Pasywnie generuje 1 Talon co 60 sekund' },
  { id: 'redaktor',   name: 'Redaktor',           threshold: 4500,  effect: 'Pasywnie generuje 200 zł co 30 sekund na cele konspiracyjne' },
  { id: 'dzialacz',   name: 'Działacz',           threshold: 5000,  effect: 'Co 30s pojawia się 1 darmowa Kartka' },
  { id: 'organizator', name: 'Organizator',        threshold: 6500,  effect: 'Koszty łapówek dla Milicji tańsze o 15%' },
  { id: 'opozycjonista', name: 'Opozycjonista',    threshold: 7500,  effect: 'Zwiększa zysk Marek (DM) przy emigracji o +15%' },
  { id: 'przywodca',  name: 'Przywódca Podziemia', threshold: 8000,  effect: 'Cały zysk z Przemytu wzrasta o 50%' },
  { id: 'glos_wolnosci', name: 'Głos Wolności',   threshold: 9000,  effect: '+25% do prędkości pomocników' },
  { id: 'legenda',    name: 'Legenda Podziemia',   threshold: 10000, effect: 'Odblokowuje drogę Okrągłego Stołu' },
];

export interface ProducedItem { id: string; name: string; sellPricePln?: number; sellPriceDollars?: number; }
export const PRODUCED_ITEMS: ProducedItem[] = [
  { id: 'gozdziki', name: 'Krajowe Goździki', sellPricePln: 150 },
  { id: 'czesci', name: 'Części Zamienne', sellPricePln: 600 },
  { id: 'wyroby_hutnicze', name: 'Wyroby Hutnicze', sellPriceDollars: 10 },
  // [Claude] naprawa: spółka Inter-Viag (FSO) produkowała 'polonez' do ekwipunku, ale Polonez nie widniał
  // na żadnej liście sprzedaży (Bazar pokazuje tylko QUEUE_ITEMS + PRODUCED_ITEMS) - auta znikały w niewidzialnym
  // magazynie bez możliwości spieniężenia. Cena między Fiatem 125p (2 mln) a Ursusem (8 mln).
  { id: 'polonez', name: 'FSO Polonez', sellPricePln: 2500000 }
];

export interface LuxuryItem {
  id: string;
  name: string;
  desc: string;
  basePrice: number;
  currency: 'dollars' | 'pln';
  prestigeMult: number;
  suspicionReduction: number;
}

export const LUXURY_ITEMS: LuxuryItem[] = [
  { id: 'volkswagen', name: 'Volkswagen Golf I', desc: '+20% do zysku Marek (DM) z ucieczek, -10% generowanego podejrzenia', basePrice: 1200, currency: 'dollars', prestigeMult: 0.20, suspicionReduction: 0.10 },
  { id: 'mebloscianka_rustikal', name: 'Meblościanka dębowa "Eiche Rustikal"', desc: '+10% do zysku Marek (DM) z ucieczek, -5% generowanego podejrzenia', basePrice: 35000, currency: 'pln', prestigeMult: 0.10, suspicionReduction: 0.05 },
  { id: 'panasonic_vhs', name: 'Magnetowid Panasonic NV-G10', desc: '+15% do zysku Marek (DM) z ucieczek, -5% generowanego podejrzenia', basePrice: 600, currency: 'dollars', prestigeMult: 0.15, suspicionReduction: 0.05 },
  { id: 'technics_audio', name: 'Zestaw Audio Technics', desc: '+12% do zysku Marek (DM) z ucieczek, -5% generowanego podejrzenia', basePrice: 400, currency: 'dollars', prestigeMult: 0.12, suspicionReduction: 0.05 },
  { id: 'atari_computer', name: 'Komputer Atari 800XL', desc: '+25% do zysku Marek (DM) z ucieczek, -5% generowanego podejrzenia', basePrice: 25000, currency: 'pln', prestigeMult: 0.25, suspicionReduction: 0.05 },
  { id: 'rolex_watch', name: 'Szwajcarski zegarek Rolex', desc: '+30% do zysku Marek (DM) z ucieczek, -15% generowanego podejrzenia', basePrice: 2000, currency: 'dollars', prestigeMult: 0.30, suspicionReduction: 0.15 },
  { id: 'sinclair_ac', name: 'Klimatyzator Sinclair', desc: '+8% do zysku Marek (DM) z ucieczek, -5% generowanego podejrzenia', basePrice: 15000, currency: 'pln', prestigeMult: 0.08, suspicionReduction: 0.05 },
  { id: 'fur_coat', name: 'Luksusowe futro z norek', desc: '+18% do zysku Marek (DM) z ucieczek, -5% generowanego podejrzenia', basePrice: 8000, currency: 'pln', prestigeMult: 0.18, suspicionReduction: 0.05 },
];

export interface AuctionState {
  itemId: string;
  itemName: string;
  currentBid: number;
  highestBidder: string;
  timeLeft: number;
  basePrice: number;
  currency: 'dollars' | 'pln';
  biddingLog: string[];
}

export interface SeaSmugglingRoute {
  id: string;
  name: string;
  costPln: number;
  timeMs: number;
  riskPercent: number;
  rewardDesc: string;
  minBony: number;
  maxBony: number;
}

export const SEA_SMUGGLING_ROUTES: SeaSmugglingRoute[] = [
  { id: 'hamburg', name: 'Rejs do Hamburga (Niemcy)', costPln: 20000, timeMs: 120000, riskPercent: 15, rewardDesc: 'Bony Baltona (5 - 15)', minBony: 5, maxBony: 15 },
  { id: 'rotterdam', name: 'Kontenerowiec do Rotterdamu', costPln: 50000, timeMs: 300000, riskPercent: 25, rewardDesc: 'Bony Baltona (15 - 45)', minBony: 15, maxBony: 45 },
  { id: 'nowy_jork', name: 'Transatlantyk do Nowego Jorku', costPln: 150000, timeMs: 600000, riskPercent: 35, rewardDesc: 'Bony Baltona (50 - 150)', minBony: 50, maxBony: 150 }
];

export interface BaltonaItem {
  id: string;
  name: string;
  costBony: number;
  desc: string;
}

export const BALTONA_ITEMS: BaltonaItem[] = [
  { id: 'jacobs', name: 'Kawa Jacobs', costBony: 150, desc: '+20% zysków PLN z Pracy, -10% czasu w kolejkach' },
  { id: 'alpia', name: 'Czekolada Alpia', costBony: 300, desc: '+15% szansy na x2 nagrody z kolejki' },
  { id: 'grundig', name: 'Magnetofon Grundig', costBony: 750, desc: 'Pomocnicy szybsi o +40%' },
  { id: 'marlboro', name: 'Papierosy Marlboro', costBony: 1500, desc: 'Czas wszystkich szmugli lądowych i morskich -20%' },
  { id: 'sygnat', name: 'Złoty Sygnet', costBony: 3000, desc: '+25% do prestiżu (DM) przy emigracji' },
  { id: 'import', name: 'Prywatny Import', costBony: 5000, desc: '+35% do wszystkich zysków PLN i USD' },
  { id: 'koniak', name: 'Koniak "Napoleon"', costBony: 2500, desc: 'Pasywnie obniża podejrzenie milicji ze wszystkich źródeł o 25%' },
  { id: 'peklimax', name: 'Szynka Peklimax', costBony: 4000, desc: 'Eksportowa szynka konserwowa. +40% do cen sprzedaży surowców na Bazarze' }
];

export interface StockInfo {
  id: string;
  name: string;
  basePrice: number;
  volatility: number;
  dividendRate: number;
  desc: string;
}

export const GPW_STOCKS: StockInfo[] = [
  { id: 'kghm', name: 'KGHM Polska Miedź S.A.', basePrice: 250, volatility: 0.06, dividendRate: 0.008, desc: 'Miedź i srebro. Stabilny gigant o niskiej zmienności.' },
  { id: 'tonsil', name: 'Tonsil S.A.', basePrice: 15, volatility: 0.25, dividendRate: 0.002, desc: 'Akustyka i głośniki PRL. Ekstremalna zmienność (spółka memowa).' },
  { id: 'exbud', name: 'Exbud S.A.', basePrice: 85, volatility: 0.10, dividendRate: 0.006, desc: 'Klimat budowlany transformacji. Solidny i pewny wzrost.' },
  { id: 'prochnik', name: 'Próchnik S.A.', basePrice: 35, volatility: 0.18, dividendRate: 0.004, desc: 'Zakłady przemysłu odzieżowego. Wysokie ryzyko, wysoka marża.' },
  { id: 'ciech', name: 'Ciech S.A.', basePrice: 150, volatility: 0.08, dividendRate: 0.007, desc: 'Koncern chemiczny. Stabilne dywidendy, średnie ryzyko.' }
];

export interface GpwMarketEvent {
  id: string;
  name: string;
  desc: string;
  effect: Record<string, number>;
}

export const GPW_EVENTS: GpwMarketEvent[] = [
  { id: 'hossa_kghm', name: 'Hossa miedziowa w Londynie', desc: 'Ceny miedzi na rynkach światowych rosną! Akcje KGHM szybują w górę.', effect: { kghm: 0.08 } },
  { id: 'krach_tonsil', name: 'Zalanie rynku azjatyckimi głośnikami', desc: 'Tania konkurencja z Azji uderza w Tonsil. Drastyczny spadek zaufania inwestorów.', effect: { tonsil: -0.12 } },
  { id: 'sukces_prywatyzacji', name: 'Debiut nowego giganta', desc: 'Optymistyczne nastroje na giełdzie po udanym debiucie kolejnej prywatyzowanej spółki.', effect: { kghm: 0.03, tonsil: 0.02, exbud: 0.03, prochnik: 0.02, ciech: 0.03 } },
  { id: 'reforma_monetarna', name: 'Restrykcyjna polityka NBP', desc: 'Stopy procentowe idą w górę. Inwestorzy wycofują kapitał z giełdy.', effect: { kghm: -0.04, tonsil: -0.04, exbud: -0.04, prochnik: -0.04, ciech: -0.04 } },
  { id: 'kontrakt_exbud', name: 'Złoty kontrakt Exbudu', desc: 'Exbud wygrywa wielki kontrakt budowlany na zachodzie Europy. Kurs wystrzeliwuje!', effect: { exbud: 0.10 } },
  { id: 'kryzys_ciech', name: 'Katastrofa ekologiczna w zakładach', desc: 'Wyciek chemikaliów zmusza Ciech do wstrzymania produkcji i opłacenia gigantycznych kar.', effect: { ciech: -0.09 } }
];

export interface NomenklaturaCompanyInfo {
  id: string;
  name: string;
  combinationName: string;
  costPln: number;
  baseRate: number;
  generateType: 'pln' | 'dollars' | 'autos' | 'special';
  desc: string;
}

export const NOMENKLATURA_COMPANIES: NomenklaturaCompanyInfo[] = [
  { id: 'huta', name: 'Pol-Hun Co.', combinationName: 'Huta Katowice', costPln: 10000000, baseRate: 4000, generateType: 'pln', desc: 'Drenuje stal i węgiel. Generuje potężny dochód pasywny w PLN.' },
  { id: 'stocznia', name: 'Trans-Pol S.A.', combinationName: 'Stocznia Gdańska', costPln: 20000000, baseRate: 3, generateType: 'dollars', desc: 'Przejmuje zyski dewizowe z budowy statków towarowych. Generuje pasywne USD ($).' },
  { id: 'fso', name: 'Inter-Viag S.A.', combinationName: 'FSO Warszawa', costPln: 40000000, baseRate: 1, generateType: 'autos', desc: 'Reorganizuje montaż aut. Co 60 sekund dostarcza do Twojego garażu darmowy polski samochód.' },
  { id: 'chz', name: 'Universal-S.A.', combinationName: 'Centrala Handlu Zagranicznego', costPln: 30000000, baseRate: 1, generateType: 'special', desc: 'Prywatny obrót licencjami. Pasywnie generuje Ruble transferowe (1/s) i Bony Baltona (2/s).' }
];

export interface OffshoreDepositInfo {
  id: string;
  name: string;
  durationSec: number;
  interestRate: number;
  desc: string;
}

export const OFFSHORE_DEPOSITS: OffshoreDepositInfo[] = [
  { id: 'dobra', name: 'Lokata Dobowa', durationSec: 30, interestRate: 0.015, desc: 'Krótki okres zamrożenia środków. Zysk: +1.5% w 30 sekund.' },
  { id: 'tygodniowa', name: 'Lokata Tygodniowa', durationSec: 180, interestRate: 0.05, desc: 'Optymalny czas dla operacji spekulacyjnych. Zysk: +5% w 3 minuty.' },
  { id: 'miesieczna', name: 'Lokata Miesięczna', durationSec: 600, interestRate: 0.15, desc: 'Średniodystansowe deponowanie dewiz. Zysk: +15% w 10 minut.' },
  { id: 'roczna', name: 'Lokata Roczna', durationSec: 1800, interestRate: 0.50, desc: 'Długoterminowa lokata dla rentierów transformacji. Zysk: +50% w 30 minut.' }
];

// ===== FAZA J: Syndykat Eksportowy i Szmugiel Technologii =====

export interface CocomItem {
  id: string;
  name: string;
  desc: string;
  costUsd: number;
  sellPricePln: number;
  riskPercent: number;
  requiredPartyRank?: string;
}

export const COCOM_ITEMS: CocomItem[] = [
  { id: 'intel_8086', name: 'Procesor Intel 8086', desc: 'Amerykański mikroprocesor 16-bitowy. Podstawa zachodnich systemów komputerowych.', costUsd: 500, sellPricePln: 40000, riskPercent: 25 },
  { id: 'vax_manual', name: 'Dokumentacja VAX/VMS', desc: 'Ściśle tajne instrukcje obsługi systemu VAX firmy DEC. Bezcenne dla wywiadu.', costUsd: 2000, sellPricePln: 150000, riskPercent: 35 },
  { id: 'carbon_fiber', name: 'Włókno węglowe CFRP (25 kg)', desc: 'Kompozyt węglowy klasy lotniczej. Objęty embargiem COCOM jako towar dual-use.', costUsd: 1200, sellPricePln: 90000, riskPercent: 30 },
  { id: 'industrial_laser', name: 'Laser przemysłowy 50W', desc: 'Laser CO₂ do cięcia metali. Zastosowania wojskowe oczywiste.', costUsd: 3000, sellPricePln: 220000, riskPercent: 40 },
  { id: 'night_vision', name: 'Lornetka Night Vision (I gen.)', desc: 'Noktowizor wzmacniający resztkowe światło. Ścisła kontrola eksportowa USA.', costUsd: 8000, sellPricePln: 600000, riskPercent: 55 },
  { id: 'crypto_device', name: 'Urządzenie szyfrujące NSA (replika)', desc: 'Replikacja szyfratora KY-57. Najwyższy priorytet wywiadu.', costUsd: 15000, sellPricePln: 1200000, riskPercent: 65 },
  { id: 'military_radar', name: 'Moduł radaru taktycznego', desc: 'Płytka PCB z radaru AN/TPS-43. Wymaga specjalnego dostępu.', costUsd: 25000, sellPricePln: 2000000, riskPercent: 75, requiredPartyRank: 'dyrektor' },
  { id: 'jet_turbine', name: 'Łopatki turbin lotniczych', desc: 'Niklowe łopatki z silnika GE F404. Towar klasy A — najwyższe ryzyko.', costUsd: 40000, sellPricePln: 3500000, riskPercent: 80, requiredPartyRank: 'minister' }
];

export interface ExportContact {
  id: string;
  name: string;
  country: string;
  priceBonus: number;
  riskBonus: number;
  costUsd: number;
  desc: string;
  unlockRequirement?: string;
}

export const EXPORT_CONTACTS: ExportContact[] = [
  { id: 'moscow_bureau', name: 'Komitet Planowania ZSRR', country: 'ZSRR', priceBonus: 0, riskBonus: 0, costUsd: 0, desc: 'Domyślny odbiorca. Pewny, ale nie nadpłaca.', unlockRequirement: 'default' },
  { id: 'stasi_net', name: 'Sieć Stasi (NRD)', country: 'NRD', priceBonus: 0.15, riskBonus: 0.05, costUsd: 5000, desc: 'Wschodnioniemiecki wywiad techniczny. +15% do ceny, +5% ryzyka.', unlockRequirement: 'sekretarz' },
  { id: 'belgrade_group', name: 'Jugosłowiańska sieć handlowa', country: 'SFRJ', priceBonus: 0.25, riskBonus: 0.10, costUsd: 15000, desc: 'Neutralny pośrednik bałkański. +25% ceny, +10% ryzyka.', unlockRequirement: 'offshore_zurich' },
  { id: 'vienna_contact', name: 'Wiedeński pośrednik neutralny', country: 'Austria', priceBonus: 0.40, riskBonus: 0.15, costUsd: 30000, desc: 'Dyskretny makler w Wiedniu. +40% ceny, +15% ryzyka.', unlockRequirement: 'liechtenstein' },
  { id: 'cia_front', name: 'Agentura „Fundacja Wolności"', country: 'USA', priceBonus: 0.80, riskBonus: 0.20, costUsd: 50000, desc: 'Podwójni agenci CIA. Najwyższa marża, ale niebezpieczne. +80% ceny, +20% ryzyka.', unlockRequirement: 'cocom_nsa' }
];

export interface SyndicateUpgrade {
  id: string;
  name: string;
  costUsd: number;
  desc: string;
  effect: string;
}

export const SYNDICATE_UPGRADES: SyndicateUpgrade[] = [
  { id: 'safe_house', name: 'Konspiracyjna kryjówka', costUsd: 5000, desc: 'Bezpieczne miejsce do składowania towaru przed wysyłką.', effect: '-15% ryzyka przy wszystkich operacjach COCOM' },
  { id: 'fake_docs', name: 'Dokumenty Przewozowe (fałszywe)', costUsd: 10000, desc: 'Profesjonalnie sfałszowane certyfikaty użytkownika końcowego.', effect: '-20% ryzyka + towar nie przepada przy wpadce' },
  { id: 'customs_contact', name: 'Oficer Celny na etacie', costUsd: 20000, desc: 'Przekupiony celnik na przejściu granicznym w Terespolu.', effect: '-25% ryzyka na granicach krajowych' },
  { id: 'embassy_cover', name: 'Dyplomatyczna teczka (placówka dypl.)', costUsd: 50000, desc: 'Dostęp do poczty dyplomatycznej przez zaprzyjaźnioną ambasadę.', effect: 'Immunitet przy wpadce 1x na 5 min + limit prania do 2 mln zł' },
  { id: 'intelligence_net', name: 'Sieć agentów w CIA/BND', costUsd: 100000, desc: 'Informatorzy w zachodnich służbach wywiadowczych.', effect: 'Ujawnia dokładny % ryzyka przed transakcją' },
  { id: 'nuclear_clearance', name: 'Dostęp do towarów klasy A', costUsd: 250000, desc: 'Specjalna autoryzacja na handel towarami najwyższego ryzyka.', effect: 'Odblokuj zakup radaru taktycznego i łopatek turbin bez wymaganej rangi' }
];

export interface GeopoliticalEvent {
  id: string;
  name: string;
  desc: string;
  durationSec: number;
  effect: string;
}

export const GEOPOLITICAL_EVENTS: GeopoliticalEvent[] = [
  { id: 'cocom_audit', name: 'Inspekcja CoCom — kontrola graniczna', desc: 'Zachodnie służby przeprowadzają wzmożoną kontrolę ładunków tranzytowych.', durationSec: 120, effect: 'block_all' },
  { id: 'cia_interest', name: 'Zainteresowanie CIA', desc: 'CIA namierzyła podejrzany kanał dystrybucji. Kontrahent USA pod obserwacją.', durationSec: 90, effect: 'cia_risk_up' },
  { id: 'stasi_crackdown', name: 'Akcja Stasi', desc: 'Ministerstwo Bezpieczeństwa Państwowego NRD przeprowadza czystkę.', durationSec: 60, effect: 'stasi_block' },
  { id: 'diplomatic_incident', name: 'Incydent Dyplomatyczny', desc: 'Skandal na szczeblu ambasadorów. Wiedeński kontakt zrywa współpracę tymczasowo.', durationSec: 180, effect: 'vienna_block' },
  { id: 'cocom_relax', name: 'Chwilowe rozluźnienie CoCom', desc: 'Negocjacje handlowe prowadzą do chwilowego złagodzenia embarga.', durationSec: 120, effect: 'risk_halved' },
  { id: 'arms_scandal', name: 'Skandal Zbrojeniowy w mediach', desc: 'Prasa zachodnia ujawnia nielegalne dostawy technologii za żelazną kurtynę.', durationSec: 90, effect: 'suspicion_up' }
];

// ===== FAZA K: Wybory 4 Czerwca — Kampania Wyborcza KO „Solidarność" =====

export interface ElectionRegion {
  id: string;
  name: string;
  desc: string;
  baseSupportRate: number;      // bazowy przyrost głosów/s
  workerWeight: number;         // waga grupy robotników (0-1)
  intellectualWeight: number;   // waga grupy inteligencji (0-1)
  farmerWeight: number;         // waga grupy rolników (0-1)
  churchInfluence: number;      // 0-1, mnożnik wpływu Kościoła
  sbBaseActivity: number;       // bazowa aktywność SB (0-100)
  committeeCostPln: number;     // koszt otwarcia komitetu
  sejmSeats: number;            // mandaty sejmowe w regionie (pula KO)
  senateSeats: number;          // mandaty senackie w regionie
}

export const ELECTION_REGIONS: ElectionRegion[] = [
  { id: 'gdansk', name: 'Gdańsk & Pomorze', desc: 'Bastion Solidarności. Stocznie, Wałęsa i tradycja oporu.', baseSupportRate: 80, workerWeight: 0.5, intellectualWeight: 0.2, farmerWeight: 0.3, churchInfluence: 0.6, sbBaseActivity: 30, committeeCostPln: 500000, sejmSeats: 27, senateSeats: 17 },
  { id: 'slask', name: 'Górny Śląsk', desc: 'Region górniczy. Klucz do poparcia robotników.', baseSupportRate: 40, workerWeight: 0.7, intellectualWeight: 0.1, farmerWeight: 0.2, churchInfluence: 0.4, sbBaseActivity: 50, committeeCostPln: 800000, sejmSeats: 30, senateSeats: 17 },
  { id: 'wielkopolska', name: 'Wielkopolska', desc: 'Silny sektor rolniczy. Trudny teren dla Solidarności.', baseSupportRate: 25, workerWeight: 0.2, intellectualWeight: 0.2, farmerWeight: 0.6, churchInfluence: 0.5, sbBaseActivity: 25, committeeCostPln: 400000, sejmSeats: 26, senateSeats: 16 },
  { id: 'mazowsze', name: 'Mazowsze (Warszawa)', desc: 'Centrum akademickie i urzędnicze. Baza inteligencji.', baseSupportRate: 60, workerWeight: 0.2, intellectualWeight: 0.6, farmerWeight: 0.2, churchInfluence: 0.3, sbBaseActivity: 60, committeeCostPln: 1000000, sejmSeats: 28, senateSeats: 17 },
  { id: 'malopolska', name: 'Małopolska (Kraków)', desc: 'Silne wpływy Kościoła i młodzieży akademickiej.', baseSupportRate: 55, workerWeight: 0.3, intellectualWeight: 0.3, farmerWeight: 0.4, churchInfluence: 0.9, sbBaseActivity: 35, committeeCostPln: 600000, sejmSeats: 25, senateSeats: 16 },
  { id: 'wschodnia', name: 'Ściana Wschodnia', desc: 'Konserwatywna, nieufna wobec zmian. Wymaga wsparcia parafii.', baseSupportRate: 15, workerWeight: 0.2, intellectualWeight: 0.1, farmerWeight: 0.7, churchInfluence: 0.8, sbBaseActivity: 20, committeeCostPln: 300000, sejmSeats: 25, senateSeats: 17 }
];

export interface CampaignMaterial {
  id: string;
  name: string;
  desc: string;
  costPln: number;
  paperCost: number;        // ryzy papieru
  inkCost: number;           // litry tuszu
  workerBonus: number;       // poparcie robotników/tick
  intellectualBonus: number; // poparcie inteligencji/tick
  farmerBonus: number;       // poparcie rolników/tick
  sbRiskPercent: number;     // szansa wpadki z SB (%)
}

export const CAMPAIGN_MATERIALS: CampaignMaterial[] = [
  { id: 'ulotka', name: 'Ulotka KO (A5)', desc: 'Prosta ulotka z logo Solidarności i apelem do wyborców.', costPln: 200, paperCost: 0.1, inkCost: 0.05, workerBonus: 15, intellectualBonus: 5, farmerBonus: 3, sbRiskPercent: 1 },
  { id: 'plakat_cooper', name: 'Plakat „W Samo Południe"', desc: 'Kultowy plakat Gary\'ego Coopera z odznaką Solidarności i datą 4 CZERWCA.', costPln: 1500, paperCost: 0.5, inkCost: 0.2, workerBonus: 50, intellectualBonus: 150, farmerBonus: 80, sbRiskPercent: 5 },
  { id: 'zdjecie_walesa', name: 'Zdjęcie z Wałęsą', desc: 'Fotografia kandydata z Lechem Wałęsą. Uniwersalne poparcie.', costPln: 800, paperCost: 0.3, inkCost: 0.1, workerBonus: 100, intellectualBonus: 80, farmerBonus: 70, sbRiskPercent: 3 },
  { id: 'broszura', name: 'Broszura Programowa', desc: 'Szczegółowy program reform KO. Trafia do inteligencji.', costPln: 8000, paperCost: 2, inkCost: 0.5, workerBonus: 20, intellectualBonus: 500, farmerBonus: 10, sbRiskPercent: 10 },
  { id: 'kaseta', name: 'Kaseta Magnetofonowa', desc: 'Nagranie przemówień liderów KO na kasetach. Dociera do młodzieży.', costPln: 25000, paperCost: 0, inkCost: 0, workerBonus: 300, intellectualBonus: 800, farmerBonus: 200, sbRiskPercent: 25 },
  { id: 'gazeta_wyborcza', name: 'Gazeta Wyborcza (Nr 1)', desc: 'Pierwszy numer niezależnego dziennika. Potężne narzędzie propagandowe KO.', costPln: 50000, paperCost: 5, inkCost: 1.5, workerBonus: 500, intellectualBonus: 1500, farmerBonus: 300, sbRiskPercent: 15 }
];

export interface CampaignLeader {
  id: string;
  name: string;
  desc: string;
  costPln: number;
  costUsd: number;
  durationSec: number;
  cooldownSec: number;
  workerMult: number;
  intellectualMult: number;
  farmerMult: number;
  sbRiskBonus: number;       // dodatkowe ryzyko SB w regionie
  specialRegion?: string;     // region z ekstra bonusem
  specialRegionMult: number;  // ekstra mnożnik w spec. regionie
}

export const CAMPAIGN_LEADERS: CampaignLeader[] = [
  { id: 'kuron', name: 'Jacek Kuroń', desc: 'Ikona opozycji. Porywa tłumy robotników, ale irytuje SB.', costPln: 50000, costUsd: 0, durationSec: 30, cooldownSec: 90, workerMult: 3.0, intellectualMult: 1.5, farmerMult: 1.0, sbRiskBonus: 30, specialRegion: 'slask', specialRegionMult: 2.0 },
  { id: 'geremek', name: 'Bronisław Geremek', desc: 'Historyk-mediewista, strateg Okrągłego Stołu. Perfekcyjny do debat.', costPln: 80000, costUsd: 0, durationSec: 30, cooldownSec: 90, workerMult: 1.0, intellectualMult: 3.5, farmerMult: 1.2, sbRiskBonus: 10, specialRegion: 'mazowsze', specialRegionMult: 2.0 },
  { id: 'mazowiecki', name: 'Tadeusz Mazowiecki', desc: 'Katolicki intelektualista, przyszły premier. Zyskuje poparcie Kościoła.', costPln: 100000, costUsd: 0, durationSec: 30, cooldownSec: 90, workerMult: 1.2, intellectualMult: 2.0, farmerMult: 2.5, sbRiskBonus: 5, specialRegion: 'malopolska', specialRegionMult: 2.5 },
  { id: 'walesa', name: 'Lech Wałęsa', desc: 'Legenda żywego oporu. Super-lider wymagający ochrony w USD.', costPln: 200000, costUsd: 500, durationSec: 45, cooldownSec: 180, workerMult: 3.0, intellectualMult: 2.5, farmerMult: 2.5, sbRiskBonus: 20, specialRegion: 'gdansk', specialRegionMult: 3.0 }
];

export interface DebateOption {
  id: string;
  round: number;
  text: string;
  workerEffect: number;
  intellectualEffect: number;
  farmerEffect: number;
  propagandaReduction: number;    // obniżenie propagandy rządowej
  sbRisk: number;                 // ryzyko SB
}

export const DEBATE_OPTIONS: DebateOption[] = [
  // Runda 1: Gospodarka
  { id: 'd1_aggressive', round: 1, text: '„Wasza gospodarka to ruina! Ludzie stoją w kolejkach po chleb!"', workerEffect: 3000, intellectualEffect: 500, farmerEffect: 1000, propagandaReduction: 10, sbRisk: 15 },
  { id: 'd1_moderate', round: 1, text: '„Proponujemy reformy rynkowe z osłoną socjalną dla najsłabszych."', workerEffect: 1000, intellectualEffect: 3000, farmerEffect: 1500, propagandaReduction: 5, sbRisk: 0 },
  { id: 'd1_compromise', round: 1, text: '„Chcemy współpracować z każdym, komu leży na sercu dobro Polski."', workerEffect: 800, intellectualEffect: 1200, farmerEffect: 2500, propagandaReduction: 3, sbRisk: 0 },
  // Runda 2: Wolność
  { id: 'd2_aggressive', round: 2, text: '„Żądamy pełnej wolności słowa i zgromadzeń! Koniec z cenzurą!"', workerEffect: 2500, intellectualEffect: 2000, farmerEffect: 500, propagandaReduction: 15, sbRisk: 20 },
  { id: 'd2_moderate', round: 2, text: '„Wolność prasy to fundament demokracji. Wolne media — wolni ludzie."', workerEffect: 1500, intellectualEffect: 3500, farmerEffect: 1000, propagandaReduction: 10, sbRisk: 5 },
  { id: 'd2_compromise', round: 2, text: '„Stopniowe otwieranie mediów przyniesie korzyści całemu społeczeństwu."', workerEffect: 1000, intellectualEffect: 1500, farmerEffect: 2000, propagandaReduction: 5, sbRisk: 0 },
  // Runda 3: Przyszłość
  { id: 'd3_aggressive', round: 3, text: '„Wasz system się skończył! Nadchodzi nowa Polska — wolna i demokratyczna!"', workerEffect: 4000, intellectualEffect: 1000, farmerEffect: 1500, propagandaReduction: 20, sbRisk: 25 },
  { id: 'd3_moderate', round: 3, text: '„Budujmy razem Polskę, w której prawo stoi ponad partią."', workerEffect: 2000, intellectualEffect: 4000, farmerEffect: 2000, propagandaReduction: 12, sbRisk: 5 },
  { id: 'd3_compromise', round: 3, text: '„Okrągły Stół udowodnił, że dialog jest możliwy. Kontynuujmy go."', workerEffect: 1500, intellectualEffect: 2000, farmerEffect: 3500, propagandaReduction: 8, sbRisk: 0 },
  // Runda 4: Konkluzja
  { id: 'd4_aggressive', round: 4, text: '„4 czerwca zagłosujcie na Solidarność — albo nigdy się nie uwolnimy!"', workerEffect: 5000, intellectualEffect: 2000, farmerEffect: 2000, propagandaReduction: 25, sbRisk: 30 },
  { id: 'd4_moderate', round: 4, text: '„Nasz program to praca, godność i wolność. Oddajcie głos na przyszłość."', workerEffect: 3000, intellectualEffect: 5000, farmerEffect: 3000, propagandaReduction: 15, sbRisk: 5 },
  { id: 'd4_compromise', round: 4, text: '„Wspólnie jesteśmy w stanie dokonać pokojowej zmiany dla naszych dzieci."', workerEffect: 2500, intellectualEffect: 3000, farmerEffect: 4500, propagandaReduction: 10, sbRisk: 0 }
];

export interface ElectionUpgrade {
  id: string;
  name: string;
  desc: string;
  costPln: number;
  costUsd: number;
  effect: string;
}

export const ELECTION_UPGRADES: ElectionUpgrade[] = [
  { id: 'printing_press', name: 'Offset drukarski „Romayora"', desc: 'Profesjonalna maszyna drukarska. Podwaja produkcję materiałów.', costPln: 500000, costUsd: 0, effect: 'Podwójna produkcja materiałów' },
  { id: 'rwe_antenna', name: 'Anteny kierunkowe RWE', desc: 'Wzmocnienie sygnału Radia Wolna Europa na terytorium PRL.', costPln: 0, costUsd: 5000, effect: 'Odblokowuje RWE: +1000 poparcia/s ogólnokrajowo' },
  { id: 'church_fund', name: 'Fundusz Parafialny', desc: 'Stała dotacja na odczyty w kościołach i pomoc dla internowanych.', costPln: 200000, costUsd: 0, effect: '+25% poparcia Kościoła, +50% skuteczności na Ścianie Wschodniej' },
  { id: 'guard_squad', name: 'Straż Obywatelska', desc: 'Ochrona wieców i drukarni przed prowokacjami SB.', costPln: 300000, costUsd: 0, effect: '-40% skuteczności sabotaży SB' },
  { id: 'telex_cipher', name: 'Szyfrator Telex', desc: 'Szyfrowanie komunikacji sztabu. Kurierzy bezpieczniejsi.', costPln: 0, costUsd: 2000, effect: '-35% ryzyka przechwycenia kurierów' },
  { id: 'msw_informer', name: 'TW w strukturach MSW', desc: 'Kosztowny informator ostrzegający o planowanych rewizjach.', costPln: 0, costUsd: 8000, effect: 'Ostrzeżenia o rewizjach SB (10s na reakcję)' }
];

// Faza K — Nowe osiągnięcia
// Dodane do ACHIEVEMENTS:
// { id: 'senate_sweep', name: 'W samo południe', desc: 'Zdobądź 99 mandatów w Senacie.' },
// { id: 'propaganda_killer', name: 'Niezależny Dziennikarz', desc: 'Zredukuj propagandę rządową do 0% przed wyborami.' },
// { id: 'church_alliance', name: 'Przymierze Ołtarza z Ludźmi Pracy', desc: 'Osiągnij 100% poparcia Kościoła.' },
// { id: 'historical_victory', name: 'Wasz Prezydent, Nasz Premier', desc: 'Sformuj rząd Mazowieckiego z pełną przewagą.' },

// ===== FAZA L: Globalne Imperium Przemytnicze =====

// [Claude] usunięto martwy kod: interfejs CocomNode i stała COCOM_NODES nie były nigdzie importowane,
// a powiązane pole stanu unlockedCocomNodes nie było czytane w żadnym miejscu UI ani logiki
// (mapa węzłów przemytniczych nigdy nie powstała - trasy COCOM_SMUGGLING_ROUTES działają bez niej).

export interface CocomSmugglingRoute {
  id: string;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  baseTravelTimeSec: number;
  baseRiskPercent: number;
  borderPatrolName: string;
  desc: string;
  payoutMultiplier: number;
}

export const COCOM_SMUGGLING_ROUTES: CocomSmugglingRoute[] = [
  { id: 'warszawa_berlin', name: 'Szosa Poznańska (Świecko)', fromNodeId: 'warszawa', toNodeId: 'berlin', baseTravelTimeSec: 60, baseRiskPercent: 20, borderPatrolName: 'Świecko (Drogowe)', desc: 'Standardowa trasa ciężarowa do Berlina. Średnie ryzyko, przyzwoita płatność.', payoutMultiplier: 1.25 },
  { id: 'warszawa_wieden', name: 'Magistrala Południowa (Cieszyn)', fromNodeId: 'warszawa', toNodeId: 'wieden', baseTravelTimeSec: 90, baseRiskPercent: 30, borderPatrolName: 'Cieszyn (Drogowe)', desc: 'Górzysta trasa na południe. Czesi i Austriacy wnikliwie kontrolują bagaże.', payoutMultiplier: 1.5 },
  { id: 'wieden_zurych', name: 'Alpejska Przełęcz (Vaduz)', fromNodeId: 'wieden', toNodeId: 'zurych', baseTravelTimeSec: 120, baseRiskPercent: 15, borderPatrolName: 'Szwajcarska Straż Graniczna', desc: 'Bezpieczna, górska trasa tranzytowa. Wymaga uprzedniego odblokowania Wiednia.', payoutMultiplier: 1.7 },
  { id: 'warszawa_moskwa', name: 'Kolej Transsyberyjska (Terespol)', fromNodeId: 'warszawa', toNodeId: 'moskwa', baseTravelTimeSec: 45, baseRiskPercent: 10, borderPatrolName: 'Terespol (Kolejowe)', desc: 'Szybki przerzut pociągiem na Wschód. Niskie ryzyko wpadki, ale gorszy zarobek.', payoutMultiplier: 1.1 },
  { id: 'warszawa_zurych_direct', name: 'Lot Czarterowy LOT (Okęcie)', fromNodeId: 'warszawa', toNodeId: 'zurych', baseTravelTimeSec: 30, baseRiskPercent: 60, borderPatrolName: 'Okęcie (Kontrola Lotnicza)', desc: 'Błyskawiczny transport lotniczy dla najcenniejszych towarów. Ekstremalnie wysokie ryzyko wpadki.', payoutMultiplier: 2.1 }
];

export interface CocomVehicle {
  id: string;
  name: string;
  desc: string;
  costPln: number;
  costUsd: number;
  capacity: number;         // ile sztuk COCOM może zabrać na raz
  speedMult: number;        // mnożnik czasu trwania podróży (np. 0.8 = 20% szybciej)
  stealthBonus: number;     // redukcja ryzyka wpadki (np. 15 oznacza -15% ryzyka)
}

export const COCOM_VEHICLES: CocomVehicle[] = [
  { id: 'fiat_126p', name: 'Maluch (Fiat 126p) ze skrytką', desc: 'Mały, niepozorny samochód z przerobionym bakiem. Mieści niewiele, ale rzadko go podejrzewają.', costPln: 25000, costUsd: 0, capacity: 1, speedMult: 1.1, stealthBonus: 15 },
  { id: 'polonez_caro', name: 'Polonez Caro (Wzmocniony)', desc: 'Klasyczna limuzyna PRL ze wzmocnionym zawieszeniem do przewozu cięższego sprzętu.', costPln: 80000, costUsd: 0, capacity: 2, speedMult: 0.95, stealthBonus: 5 },
  { id: 'star_200', name: 'Star 200 (Chłodnia plandeka)', desc: 'Ciężarówka średniej wielkości. Idealna do średniej skali szmuglu w pudłach po owocach.', costPln: 250000, costUsd: 0, capacity: 5, speedMult: 1.3, stealthBonus: -5 },
  { id: 'jelcz_tir', name: 'Jelcz 317 (TIR z podwójnym dnem)', desc: 'Prawdziwy król szos. Przemysłowa skala szmuglu, ale rzuca się w oczy na granicy.', costPln: 600000, costUsd: 1000, capacity: 15, speedMult: 1.2, stealthBonus: -15 },
  { id: 'an2_plane', name: 'Kukuruźnik (An-2) — cichy przelot', desc: 'Dwupłatowiec lecący tuż nad drzewami. Całkowite ominięcie drogowych przejść granicznych.', costPln: 0, costUsd: 25000, capacity: 8, speedMult: 0.5, stealthBonus: 25 }
];

export interface CocomPersonnel {
  id: string;
  name: string;
  role: string;
  desc: string;
  costPln: number;
  costUsd: number;
  speedBonus: number;       // redukcja czasu podróży (np. 0.1 = -10% czasu)
  stealthBonus: number;     // redukcja ryzyka wpadki (np. 10 = -10% ryzyka)
  salaryPerRunPln: number;  // pensja wypłacana za każdy pomyślny transport
}

export const COCOM_PERSONNEL: CocomPersonnel[] = [
  { id: 'student_mrowka', name: 'Student „Mrówka”', role: 'Kurier pieszy', desc: 'Tani kurier przenoszący małe ilości w bagażu podręcznym. W razie wpadki nikogo nie wyda.', costPln: 5000, costUsd: 0, speedBonus: 0.0, stealthBonus: 5, salaryPerRunPln: 1000 },
  { id: 'kierowca_pks', name: 'Pan Heniek', role: 'Kierowca PKS/TIR', desc: 'Doświadczony kierowca, który zna celników na pamięć i wie, kiedy wręczyć „prezent”.', costPln: 20000, costUsd: 0, speedBonus: -0.05, stealthBonus: 10, salaryPerRunPln: 5000 },
  { id: 'diplomat_friend', name: 'Radca Ambasady (Kraj Neutralny)', role: 'Kurier dyplomatyczny', desc: 'Korzysta z immunitetu i paszportu dyplomatycznego. Ekstremalnie wysoka skuteczność, ale drogi w utrzymaniu.', costPln: 100000, costUsd: 2000, speedBonus: -0.15, stealthBonus: 35, salaryPerRunPln: 30000 }
];

// ===== FAZA M: Transformacja Ustrojowa (Lata 90.) =====

export interface BazarItem {
  id: string;
  name: string;
  desc: string;
  buyPricePln: number;
  sellPricePln: number;
  demandRate: number; // szansa na sprzedaż w jednym ticku (np. 0.2 = 20%)
}

export const BAZAR_ITEMS: BazarItem[] = [
  { id: 'vhs_tapes', name: 'Kasety VHS z filmami akcji', desc: 'Hity ze wschodu i zachodu z lektorem ze stadionu.', buyPricePln: 20000, sellPricePln: 45000, demandRate: 0.6 },
  { id: 'turkey_sweaters', name: 'Swetry z Turcji', desc: 'Kolorowe, akrylowe swetry. Krzyk mody wczesnego kapitalizmu.', buyPricePln: 50000, sellPricePln: 120000, demandRate: 0.4 },
  { id: 'taiwan_electronics', name: 'Kalkulatory z Tajwanu', desc: 'Zegarki z melodyjką i kalkulatory. Nowinki techniczne.', buyPricePln: 100000, sellPricePln: 300000, demandRate: 0.3 }
];

export interface NfiCompany {
  id: string;
  name: string;
  desc: string;
  vouchersRequired: number; // liczba "Świadectw Udziałowych" (Kuponów) do przejęcia
  dividendPerSecPln: number; // dywidenda wypłacana co sekundę z przejętej fabryki
  baseEmployment: number; // zatrudnienie początkowe
  baseInfrastructure: number; // stan maszyn początkowy (0-100)
  baseUnionStrength: number; // siła związków zawodowych początkowa (0-100)
}

export const NFI_COMPANIES: NfiCompany[] = [
  { id: 'fso', name: 'FSO Warszawa', desc: 'Fabryka Samochodów Osobowych. Wymaga restrukturyzacji, ale generuje stały zysk z montowni.', vouchersRequired: 50, dividendPerSecPln: 100000, baseEmployment: 12000, baseInfrastructure: 40, baseUnionStrength: 50 },
  { id: 'ursus', name: 'Zakłady Ursus', desc: 'Produkcja ciągników. Rynek wschodni wciąż zgłasza zapotrzebowanie.', vouchersRequired: 150, dividendPerSecPln: 400000, baseEmployment: 18000, baseInfrastructure: 30, baseUnionStrength: 75 },
  { id: 'huta_katowice', name: 'Huta Katowice', desc: 'Kombinat metalurgiczny. Gigantyczny biznes dla prawdziwego oligarchy.', vouchersRequired: 500, dividendPerSecPln: 2000000, baseEmployment: 25000, baseInfrastructure: 25, baseUnionStrength: 90 }
];

export interface MafiaProtection {
  id: string;
  name: string;
  desc: string;
  costPln: number;
  protectionLevel: number; // redukuje szansę na skuteczny atak mafii (0-100)
}

export const MAFIA_PROTECTIONS: MafiaProtection[] = [
  { id: 'bramkarze', name: 'Bramkarze z dyskoteki', desc: 'Lokalni mięśniacy. Odstraszą drobną patologię, ale nie prawdziwą mafię.', costPln: 500000, protectionLevel: 25 },
  { id: 'byli_milicjanci', name: 'Byli Milicjanci', desc: 'Znają procedury i mają broń. Solidna ochrona.', costPln: 2000000, protectionLevel: 55 },
  { id: 'agencja_sb', name: 'Agencja Ochrony "Grom" (byli SB)', desc: 'Profesjonaliści z dawnych służb. Mafia woli z nimi nie zadzierać.', costPln: 10000000, protectionLevel: 95 }
];

// ===== FAZA N: Wojny Gangów i Szara Strefa =====

export interface District {
  id: string;
  name: string;
  desc: string;
  baseIncomePln: number; // Dochód z dzielnicy na sekundę (jeśli mamy 100% kontroli)
  startingOwner: 'pruszkow' | 'wolomin' | 'player'; // Kto domyślnie kontroluje (w % startowym)
}

export const WARSAW_DISTRICTS: District[] = [
  { id: 'praga', name: 'Praga-Północ', desc: 'Bazar, meliny i ciemne bramy. Królestwo wymuszeń.', baseIncomePln: 50000, startingOwner: 'wolomin' },
  { id: 'wola', name: 'Wola', desc: 'Zanikający przemysł, place budowy zachodnich biurowców.', baseIncomePln: 80000, startingOwner: 'pruszkow' },
  { id: 'srodmiescie', name: 'Śródmieście', desc: 'Kluby nocne, kasyna, luksusowe hotele i najwięksi gracze.', baseIncomePln: 250000, startingOwner: 'pruszkow' },
  { id: 'mokotow', name: 'Mokotów', desc: 'Mieszanka willi, starych osiedli i nowobogackich elit.', baseIncomePln: 150000, startingOwner: 'player' },
  { id: 'ursynow', name: 'Ursynów', desc: 'Sypialnia Warszawy, ale i rynek lokalnych dilerów i złodziei aut.', baseIncomePln: 100000, startingOwner: 'wolomin' }
];

export interface GangsterUnit {
  id: string;
  name: string;
  desc: string;
  costPln: number;
  combatPower: number; // Siła bojowa (do walk ulicznych)
  upkeepPln: number; // Koszt utrzymania co tick
}

export const GANGSTER_UNITS: GangsterUnit[] = [
  { id: 'kark', name: 'Łysy kark w dresie', desc: 'Więcej mięśni niż mózgu. Podstawa każdej bojówki.', costPln: 10000, combatPower: 5, upkeepPln: 100 },
  { id: 'zlodziej', name: 'Złodziej samochodowy', desc: 'Kradnie, legalizuje, sprzedaje na giełdzie.', costPln: 30000, combatPower: 2, upkeepPln: 300 },
  { id: 'cyngiel', name: 'Cyngiel (Egzekutor)', desc: 'Profesjonalista. Sprzęt i determinacja zza wschodniej granicy.', costPln: 150000, combatPower: 25, upkeepPln: 1500 },
];

export interface BlackMarketWeapon {
  id: string;
  name: string;
  desc: string;
  costPln: number;
  costUsd: number;
  powerBonus: number; // Premia procentowa do siły bojowej (np. 0.1 = 10%)
}

export const BLACK_MARKET_WEAPONS: BlackMarketWeapon[] = [
  { id: 'kij_baseball', name: 'Kije Baseballowe', desc: 'Podstawowe wyposażenie wyjazdowe na osiedle.', costPln: 25000, costUsd: 0, powerBonus: 0.05 },
  { id: 'tt_pepsza', name: 'Pistolet TT / Rak', desc: 'Pozostałości z dawnych magazynów wojskowych.', costPln: 200000, costUsd: 100, powerBonus: 0.15 },
  { id: 'kalasznikow', name: 'AK-47 (Kaftan)', desc: 'Niezawodny sprzęt do argumentacji zza pancernej szyby Mercedesa.', costPln: 1000000, costUsd: 1500, powerBonus: 0.40 },
  { id: 'materialy_wybuchowe', name: 'Materiały Wybuchowe (Semtex)', desc: 'Do zakładania własnych restauracji w pobliżu konkurencji.', costPln: 5000000, costUsd: 5000, powerBonus: 1.00 }
];

// ===== FAZA P: Imperium Logistyczne "Jarmark Europa" =====

export interface BazarLogisticsRoute {
  id: string;
  name: string;
  desc: string;
  durationSec: number;
  costPln: number;
  costUsd: number;
  importedItems: Record<string, number>;
}

export const BAZAR_LOGISTICS_ROUTES: BazarLogisticsRoute[] = [
  { 
    id: 'szlak_moskiewski', 
    name: 'Szlak Moskiewski (Moskwa)', 
    desc: 'Transport drobnego AGD i pirackich kaset VHS. Szybki, tani, ale mały załadunek.', 
    durationSec: 15, 
    costPln: 500000, 
    costUsd: 50, 
    importedItems: { 'vhs_tapes': 50 } 
  },
  { 
    id: 'szlak_turecki', 
    name: 'Szlak Turecki (Stambuł)', 
    desc: 'Kultowe swetry akrylowe sprowadzane bezpośrednio z bazarów w Stambule. Solidna marża.', 
    durationSec: 30, 
    costPln: 1500000, 
    costUsd: 150, 
    importedItems: { 'turkey_sweaters': 40 } 
  },
  { 
    id: 'szlak_berlinski', 
    name: 'Szlak Berliński (Berlin)', 
    desc: 'Najnowsza elektronika użytkowa i zegarki z Tajwanu z rynków hurtowych w Berlinie Zachodnim. Najdroższy import.', 
    durationSec: 50, 
    costPln: 4000000, 
    costUsd: 400, 
    importedItems: { 'taiwan_electronics': 25 } 
  }
];

export interface WarehouseUpgrade {
  id: string;
  name: string;
  desc: string;
  costPln: number;
  capacity: number;
}

export const WAREHOUSE_UPGRADES: WarehouseUpgrade[] = [
  { id: 'bazar_szczeka', name: 'Metalowa "Szczęka" na stadionie', desc: 'Podstawowe blaszane stoisko. Zwiększa pojemność magazynową.', costPln: 5000000, capacity: 200 },
  { id: 'bazar_kontener', name: 'Prywatny Kontener Morski', desc: 'Blaszany kontener ustawiony na koronie stadionu. Dużo przestrzeni.', costPln: 25000000, capacity: 1000 },
  { id: 'bazar_hala', name: 'Hurtowa Hala Magazynowa', desc: 'Hala pod Warszawą do rozładunku całych transportów TIR.', costPln: 150000000, capacity: 10000 }
];

// ===== FAZA R: Wolne Media, Reklama i Prywatna Telewizja =====

export interface MediaStation {
  id: string;
  name: string;
  desc: string;
  type: 'tv' | 'radio' | 'press';
  costPln: number;
  baseRating: number;
}

export const MEDIA_STATIONS: MediaStation[] = [
  { 
    id: 'gazeta_bazarowa', 
    name: 'Głos Stadionu (Prasa)', 
    desc: 'Tygodnik informacyjno-ogłoszeniowy sprzedawany prosto ze szczęk. Tani start w branży.', 
    type: 'press', 
    costPln: 2000000, 
    baseRating: 10 
  },
  { 
    id: 'radio_szum', 
    name: 'Radio SZUM (Radio)', 
    desc: 'Lokalne radio nadające pirackie nagrania disco-polo i ogłoszenia matrymonialne.', 
    type: 'radio', 
    costPln: 12000000, 
    baseRating: 30 
  },
  { 
    id: 'tv_kombinator', 
    name: 'TV Kombinator (Telewizja)', 
    desc: 'Ogólnokrajowa prywatna telewizja nadająca z prowizorycznego studia. Prawdziwa żyła złota.', 
    type: 'tv', 
    costPln: 80000000, 
    baseRating: 100 
  }
];

export interface MediaProgram {
  id: string;
  name: string;
  desc: string;
  costPln: number;
  ratingBonus: number;
  trustImpact: number; // wpływ na zaufanie widzów/czytelników co tick
  incomeMult: number;  // mnożnik dochodu z reklam
}

export const MEDIA_PROGRAMS: MediaProgram[] = [
  { 
    id: 'telezakupy', 
    name: 'Telezakupy Mango', 
    desc: 'Emisja pasma z prezentacją cudownych noży kuchennych i odkurzaczy. Wysokie przychody, ale irytuje widzów.', 
    costPln: 500000, 
    ratingBonus: 5, 
    trustImpact: -0.2, 
    incomeMult: 3.5 
  },
  { 
    id: 'disco_polo_koncert', 
    name: 'Koncert Życzeń Disco Polo', 
    desc: 'Muzyczna śmietanka wczesnych lat 90. Widzowie to uwielbiają, świetna oglądalność.', 
    costPln: 3000000, 
    ratingBonus: 25, 
    trustImpact: -0.05, 
    incomeMult: 1.8 
  },
  { 
    id: 'moda_na_sukces', 
    name: 'Moda na Sukces', 
    desc: 'Telenowela z tysiącami odcinków. Przykuwa przed ekrany emerytów w całym kraju.', 
    costPln: 15000000, 
    ratingBonus: 60, 
    trustImpact: 0.0, 
    incomeMult: 1.2 
  },
  { 
    id: 'kolo_szczescia', 
    name: 'Koło Szczęścia (Teleturniej)', 
    desc: 'Rozrywka na najwyższym poziomie z cennymi nagrodami (np. mikser lub Polonez). Buduje zaufanie stacji.', 
    costPln: 25000000, 
    ratingBonus: 100, 
    trustImpact: 0.1, 
    incomeMult: 1.0 
  },
  { 
    id: 'wiadomosci_bazarowe', 
    name: 'Wiadomości Śledcze', 
    desc: 'Najświeższe wieści o inflacji, aferach alkoholowych i wojnach gangów. Buduje pełen prestiż.', 
    costPln: 50000000, 
    ratingBonus: 180, 
    trustImpact: 0.2, 
    incomeMult: 0.7 
  }
];

export interface MediaAntennaRegion {
  id: string;
  name: string;
  desc: string;
  costPln: number;
  coverageMultiplier: number; // np. 0.3 = +30% do całkowitej oglądalności
}

export const MEDIA_ANTENNA_REGIONS: MediaAntennaRegion[] = [
  { id: 'ant_mazowsze', name: 'Nadajnik Pałac Kultury (Mazowsze)', desc: 'Pokrycie sygnałem stolicy i okolic. Kluczowy rynek reklamowy.', costPln: 15000000, coverageMultiplier: 0.30 },
  { id: 'ant_slask', name: 'Maszt Chorzów (Śląsk)', desc: 'Najbardziej zaludniony region w Polsce. Ogromna baza odbiorców.', costPln: 35000000, coverageMultiplier: 0.50 },
  { id: 'ant_pomorze', name: 'Antena Gdańsk (Pomorze)', desc: 'Dostęp do Trójmiasta i północnej Polski.', costPln: 60000000, coverageMultiplier: 0.25 }
];

// ===== FAZA S: LATA 2000. - INTEGRACJA I DOTACJE =====

export interface EuProject {
  id: string;
  name: string;
  desc: string;
  costPln: number;
  durationSec: number;
  euGrantPercent: number; // np. 0.75 oznacza 75% kosztów zwracanych
}

export const EU_PROJECTS: EuProject[] = [
  { id: 'e_burak', name: 'Portal "E-Burak"', desc: 'Innowacyjna platforma dla rolników. 85% dofinansowania z UE!', costPln: 500000, durationSec: 60, euGrantPercent: 0.85 },
  { id: 'wirtualny_kurnik', name: 'Wirtualny Kurnik 3D', desc: 'Aplikacja VR do symulacji hodowli drobiu. Unia kocha takie innowacje.', costPln: 2000000, durationSec: 120, euGrantPercent: 0.80 },
  { id: 'aquapark_podlasie', name: 'Aquapark na Podlasiu', desc: 'Ogromna inwestycja infrastrukturalna w środku lasu. Potężny zwrot.', costPln: 15000000, durationSec: 300, euGrantPercent: 0.70 }
];

export interface DotcomUpgrade {
  id: string;
  name: string;
  desc: string;
  costPln: number;
  userCapacityBonus: number;
  ratingBonus: number;
}

export const DOTCOM_UPGRADES: DotcomUpgrade[] = [
  { id: 'serwery_pentium', name: 'Klastry Pentium III', desc: 'Zwiększa przepustowość portalu, pozwalając na więcej odwiedzin.', costPln: 250000, userCapacityBonus: 50000, ratingBonus: 10 },
  { id: 'agresywne_seo', name: 'Katalogi SEO i Spam', desc: 'Pompujemy sztuczny ruch przez farmy linków.', costPln: 1000000, userCapacityBonus: 0, ratingBonus: 50 },
  { id: 'lacze_swiatlowod', name: 'Łącze Światłowodowe', desc: 'Nowoczesna infrastruktura od Telekomunikacji Polskiej.', costPln: 5000000, userCapacityBonus: 250000, ratingBonus: 100 }
];

export interface RealEstateProject {
  id: string;
  name: string;
  desc: string;
  costPln: number;
  buildTimeSec: number;
  sellRevenuePln: number;
  minChfMortgage: number;
}

export const REAL_ESTATE_PROJECTS: RealEstateProject[] = [
  { id: 'dzialka_rolna', name: 'Grunty Rolne (Odrolnienie)', desc: 'Kupujesz ziemię od chłopa, dajesz łapówkę wójtowi i masz działkę budowlaną.', costPln: 2000000, buildTimeSec: 30, sellRevenuePln: 4500000, minChfMortgage: 0 },
  { id: 'segmenty_zabki', name: 'Szeregowce pod Warszawą', desc: 'Tanie w budowie segmenty z kartongipsu dla klasy średniej.', costPln: 10000000, buildTimeSec: 90, sellRevenuePln: 25000000, minChfMortgage: 1000000 },
  { id: 'mikro_wola', name: 'Mikroapartamenty na Woli', desc: 'Prestiżowe osiedle grodzone. Apartamenty po 15m2. Ogromne zyski.', costPln: 50000000, buildTimeSec: 180, sellRevenuePln: 140000000, minChfMortgage: 5000000 }
];

// ===== FAZA T: WIELKA RECESJA 2008 =====

export interface CrisisRealEstate {
  id: string;
  name: string;
  desc: string;
  buyCostPln: number;
  finishCostPln: number;
  sellRevenuePln: number;
}

export const CRISIS_REAL_ESTATE: CrisisRealEstate[] = [
  { id: 'szkieletor_krak', name: '"Szkieletor" w Krakowie', desc: 'Niedokończony wieżowiec. Strach w oczach inwestorów. Odkupujesz od syndyka i kończysz budowę.', buyCostPln: 5000000, finishCostPln: 15000000, sellRevenuePln: 65000000 },
  { id: 'apartamenty_baltyk', name: 'Apartamenty nad Bałtykiem', desc: 'Luksusowy kurort, w którym deweloper stracił płynność finansową.', buyCostPln: 12000000, finishCostPln: 25000000, sellRevenuePln: 110000000 },
  { id: 'wilanow_blok', name: 'Miasteczko Wilanów (Dziura w ziemi)', desc: 'Rozgrzebany wykop pod fundamenty w prestiżowej dzielnicy.', buyCostPln: 25000000, finishCostPln: 60000000, sellRevenuePln: 260000000 }
];

export interface CurrencyOptionPreset {
  id: string;
  name: string;
  desc: string;
  type: 'call' | 'put' | 'toxic';
  strikeRate: number;
  premiumPln: number;
  amountChf: number;
  durationSec: number;
}

export const CURRENCY_OPTION_PRESETS: CurrencyOptionPreset[] = [
  { id: 'put_safeguard', name: 'Opcja PUT (Zabezpieczenie CHF)', desc: 'Zabezpieczenie przed wzrostem franka. Kurs wykonania: 3.50 PLN.', type: 'put', strikeRate: 3.50, premiumPln: 150000, amountChf: 1000000, durationSec: 60 },
  { id: 'call_speculate', name: 'Opcja CALL (Spekulacja CHF)', desc: 'Zarabiasz gdy frank drożeje. Kurs wykonania: 3.00 PLN.', type: 'call', strikeRate: 3.00, premiumPln: 250000, amountChf: 1500000, durationSec: 90 },
  { id: 'toxic_asymmetric', name: 'Toksyczna Opcja Asymetryczna', desc: 'Brak kosztu wstępnego. Zyski przy niskim franku, podwójna kara powyżej 4.20!', type: 'toxic', strikeRate: 4.20, premiumPln: 0, amountChf: 3000000, durationSec: 120 }
];

// Faza U: Polityka 2.0
export interface LobbyBill {
  id: string;
  name: string;
  desc: string;
  bribeCostPerSec: number;
  corruptionPerSec: number;
  effectDesc: string;
}

export const LOBBY_BILLS: LobbyBill[] = [
  { id: 'ustawa_liniowa', name: 'Ustawa Liniowa (19%)', desc: 'Przepchnij jednolitą stawkę podatkową dla przedsiębiorstw.', bribeCostPerSec: 50000, corruptionPerSec: 0.2, effectDesc: '+50% zysków z fabryk NFI' },
  { id: 'zamowienia_publiczne', name: 'Ustawa o Zamówieniach Publicznych', desc: 'Ustaw przetargi pod swoje systemy informatyczne.', bribeCostPerSec: 100000, corruptionPerSec: 0.4, effectDesc: '+100% zysków z portali Dot-com' },
  { id: 'ustawa_hazardowa', name: 'Nowa Ustawa Hazardowa', desc: 'Zdejmij podatki i restrykcje z automatów do gier.', bribeCostPerSec: 150000, corruptionPerSec: 0.6, effectDesc: '+200% zysków ze Zmywaka i Klubów' }
];

export interface CommissionQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    aggressionChange: number;
    evidenceChange: number;
    toastTitle: string;
    toastDesc: string;
  }[];
}

export const COMMISSION_QUESTIONS: CommissionQuestion[] = [
  {
    id: 'q1',
    question: 'Wysoka Komisjo, skąd świadek miał gotówkę na zakup pierwszych akcji NFI za 20 mln PLN?',
    options: [
      { id: 'o1_1', text: 'Zaoszczędziłem stojąc w kolejkach w PRL.', aggressionChange: 15, evidenceChange: 5, toastTitle: 'Śledczy kpią', toastDesc: '„Z handlu mydłem i kawą dorobił się pan milionów?”' },
      { id: 'o1_2', text: 'Zasłaniam się tajemnicą handlową.', aggressionChange: -5, evidenceChange: 15, toastTitle: 'Komisja notuje', toastDesc: 'Śledczy podejrzewają ukrywanie nielegalnego kapitału.' },
      { id: 'o1_3', text: 'Wziąłem pożyczkę od cinkciarzy na słowo honoru.', aggressionChange: 20, evidenceChange: -10, toastTitle: 'Oburzenie w Sejmie', toastDesc: '„Świadek przyznaje się do konszachtów z półświatkiem!”' }
    ]
  },
  {
    id: 'q2',
    question: 'Dlaczego w ministerstwie finansów znaleziono notatki z logo pana firmy deweloperskiej?',
    options: [
      { id: 'o2_1', text: 'To prowokacja opozycji i mediów.', aggressionChange: -10, evidenceChange: 15, toastTitle: 'Polityczna linia obrony', toastDesc: 'Zmniejszasz presję przesłuchujących, lecz dowody leżą na stole.' },
      { id: 'o2_2', text: 'Nie pamiętam takiego spotkania ani żadnych notatek.', aggressionChange: 10, evidenceChange: 5, toastTitle: 'Śledczy naciskają', toastDesc: '„Pana pamięć jest bardzo wybiórcza...”' },
      { id: 'o2_3', text: 'To były niezobowiązujące konsultacje społeczne.', aggressionChange: 5, evidenceChange: 10, toastTitle: 'Komisja powątpiewa', toastDesc: 'Śledczy badają księgi wejść do ministerstwa.' }
    ]
  },
  {
    id: 'q3',
    question: 'Świadek lobbował za ustawą hazardową. Czy spotkał się pan z ministrem na cmentarzu w nocy?',
    options: [
      { id: 'o3_1', text: 'Zasłaniam się prawem do odmowy odpowiedzi.', aggressionChange: -15, evidenceChange: 20, toastTitle: 'Milczenie kombinatora', toastDesc: 'Presja spada, ale dowody obciążające rosną.' },
      { id: 'o3_2', text: 'Odwiedzałem groby przodków. Minister był tam przypadkiem.', aggressionChange: 25, evidenceChange: 5, toastTitle: 'Śmiech na sali', toastDesc: 'Nikt nie uwierzył w tę bajkę. Agresja komisji rośnie.' },
      { id: 'o3_3', text: 'Rozmawialiśmy o sporcie i rekreacji ruchowej.', aggressionChange: 15, evidenceChange: 15, toastTitle: 'Protokół spisany', toastDesc: 'Śledczy wytykają absurdalność zeznań.' }
    ]
  }
];


// ===== FAZA V: Raje Podatkowe i Karuzela VAT =====

export interface VatGoodsInfo {
  type: 'electronics' | 'steel' | 'fuel';
  name: string;
  vatRate: number;
  turnoverMult: number;
  riskPerSec: number;
  desc: string;
}

export const VAT_GOODS: VatGoodsInfo[] = [
  { type: 'steel', name: 'Stal zbrojeniowa', vatRate: 0.22, turnoverMult: 0.05, riskPerSec: 0.1, desc: 'Bezpieczny handel hurtowy wyrobami stalowymi. Niski przyrost ryzyka.' },
  { type: 'electronics', name: 'Elektronika (odtwarzacze, CPU)', vatRate: 0.22, turnoverMult: 0.10, riskPerSec: 0.25, desc: 'Średniej skali obrót sprzętem RTV i podzespołami. Umiarkowane ryzyko.' },
  { type: 'fuel', name: 'Paliwa płynne (oleje)', vatRate: 0.22, turnoverMult: 0.20, riskPerSec: 0.6, desc: 'Agresywny handel cysternami paliwowymi. Gigantyczny zysk, ale natychmiast przyciąga uwagę skarbowców.' }
];

export interface VatUpgradeInfo {
  id: string;
  name: string;
  desc: string;
  costPln?: number;
  costUsd?: number;
}

export const VAT_UPGRADES: VatUpgradeInfo[] = [
  { id: 'slup_podlasie', name: 'Słup z Podlasia', desc: 'Zarejestruj spółki na bezdomnego. Zmniejsza bazowe ryzyko kontroli o 30%.', costPln: 250000 },
  { id: 'doradca_vat', name: 'Kancelaria Prawa Podatkowego', desc: 'Profesjonalne doradztwo skraca weryfikację VAT-7 o 5 sekund i zmniejsza karę o połowę.', costPln: 500000 },
  { id: 'naczelnik_us', name: 'Przekupny Naczelnik US', desc: 'Naczelnik Urzędu Skarbowego przymyka oko. Zmniejsza bazowe ryzyko kontroli o kolejne 30%.', costUsd: 100000 },
  { id: 'holding_cypryjski', name: 'Cypryjska Spółka Matka', desc: 'Optymalizacja offshore. Zmniejsza prowizję za transfer środków na Cypr z 10% do 2%.', costUsd: 250000 }
];

// [Claude] KIERUNEK 1.2: przeniesione z App.tsx - dane (koszty ulepszen pomocnikow),
// nie logika komponentu; zakladki importuja je bez cyklu z App.
export const HELPER_UPGRADE_COSTS: Record<string, { resource: string; label: string }> = {
  wladyslaw: { resource: 'gozdziki', label: 'Goździki' },
  kolega: { resource: 'czesci', label: 'Części' },
  halinka: { resource: 'gozdziki', label: 'Goździki' },
  basia: { resource: 'czesci', label: 'Części' },
  spekulant: { resource: 'gozdziki', label: 'Goździki' },
  staszek: { resource: 'czesci', label: 'Części' },
  zygmunt: { resource: 'wyroby_hutnicze', label: 'Wyroby Hutnicze' },
  cinkciarz: { resource: 'wyroby_hutnicze', label: 'Wyroby Hutnicze' },
  widmo: { resource: 'wyroby_hutnicze', label: 'Wyroby Hutnicze' },
  konspiracja: { resource: 'czesci', label: 'Części' },
};
