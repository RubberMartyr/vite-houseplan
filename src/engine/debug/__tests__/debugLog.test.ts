import { debugLog } from '../debugLog';

const originalSearch = window.location.search;
const originalLog = console.log;
let calls = 0;

console.log = () => {
  calls += 1;
};
window.history.replaceState({}, '', '?debug=0');
debugLog('Test', 'This should not log');
window.history.replaceState({}, '', originalSearch || '/');
console.log = originalLog;

if (calls !== 0) {
  throw new Error('debugLog should not emit when debug is disabled');
}
