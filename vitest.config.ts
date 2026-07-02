// [Claude] konfiguracja vitest (KIERUNEK.md pkt 7.1). Osobny plik zamiast vite.config.ts,
// żeby testy silnika nie ładowały wtyczki Reacta - engine.ts jest czystym TypeScriptem.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
