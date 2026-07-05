import { tick } from './src/game/engine';
import { INITIAL_STATE } from './src/hooks/useGameState';
import { coiBondYieldPerSec, edoBondYieldPerSec } from './src/game/formulas';

const start = {
  ...structuredClone(INITIAL_STATE),
  fazaZUnlocked: true,
  coiBondsPLN: 1000000,
  edoBondsPLN: 2000000,
  inflationPercent: 10,
  pln: 10000,
  lastMarketRefresh: 1750000000000
};

console.log("Start PLN:", start.pln);
const result = tick(start, 1, { now: 1750000000000, activeQueue: null });
console.log("End PLN:", result.state.pln);
console.log("COI Yield:", coiBondYieldPerSec(start as any));
console.log("EDO Yield:", edoBondYieldPerSec(start as any));

// trace differences
const keys = Object.keys(start);
for (const k of keys) {
  if (start[k] !== result.state[k]) {
    if (k !== 'stats') {
        console.log(`${k} changed: ${JSON.stringify(start[k])} -> ${JSON.stringify(result.state[k])}`);
    }
  }
}
