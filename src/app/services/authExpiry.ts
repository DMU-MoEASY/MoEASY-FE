const listeners = new Set<() => void>();
let notified=false;
export function subscribeAuthExpiry(listener:()=>void) { listeners.add(listener);return ()=>{listeners.delete(listener);}; }
export function resetAuthExpiry() { notified=false; }
export function notifyAuthExpiry() { if(notified)return;notified=true;listeners.forEach(listener=>listener()); }
