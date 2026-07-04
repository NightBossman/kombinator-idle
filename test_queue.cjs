const assert = require('assert');

let state = {
  plnUpgrades: { zeszyt: true },
  pln: 1000,
  kartki: 10,
  zeszytDidRequeue: false,
  activeEvent: null,
  inflationPercent: 0,
  activeDestination: null,
  timeInCurrentLoop: 0
};

const item = { id: 'mydlo', costPln: 5, kartkiCost: 1 };
let activeQueue = 'mydlo';

function setActiveQueue(val) {
  console.log('setActiveQueue called with:', val);
  activeQueue = val;
}

function runCompletion() {
  console.log('--- Before completion ---');
  console.log('state:', state);
  
  const inflationFactor = 1 + (state.inflationPercent / 100);
  let baseCost = item.costPln;
  if (state.activeEvent === 'podwyzki') baseCost = Math.floor(item.costPln * 1.5);
  else if (state.activeEvent === 'uwolnienie_cen') baseCost = item.costPln * 2;
  const currentCost = Math.floor(baseCost * inflationFactor);
  
  const isReq = (item.kartkiCost || 0) > 0 && !(state.activeDestination === 'australia' && (state.timeInCurrentLoop || 0) < 300);
  const reqKartki = isReq ? (item.kartkiCost || 0) : 0;
  
  // Simulated updateState callback
  const updater = (s) => {
    const nextState = { ...s };
    if (s.plnUpgrades['zeszyt'] && s.pln >= currentCost && s.kartki >= reqKartki && !s.zeszytDidRequeue) {
        console.log('>>> ENTERING AUTO-REQUEUE IF BLOCK');
        nextState.pln -= currentCost;
        if (reqKartki > 0) nextState.kartki -= reqKartki;
        nextState.zeszytDidRequeue = true;
    } else {
        console.log('>>> ENTERING STOP ELSE BLOCK');
        nextState.zeszytDidRequeue = false;
        setActiveQueue(null);
    }
    return nextState;
  };
  
  // React Strict Mode double invocation
  console.log('React run 1:');
  const res1 = updater(state);
  console.log('React run 2:');
  const res2 = updater(state);
  
  state = res2; // React takes the result of the second invocation
  
  console.log('--- After completion ---');
  console.log('state:', state);
  console.log('activeQueue:', activeQueue);
}

runCompletion();
runCompletion();
