import { useEffect, useRef, useState } from 'react';
// Set only after the backend/proxy supports Upgrade and receives the login cookie.
// No token is read from storage or appended to the WebSocket URL.
export function useAvailabilitySocket(scheduleId:number|undefined,onChange:()=>void) {
  const callback=useRef(onChange);callback.current=onChange;
  const [state,setState]=useState<'polling'|'connecting'|'connected'>('polling');
  useEffect(()=>{
    const base=import.meta.env.VITE_AVAILABILITY_WS_BASE_URL as string|undefined;
    if(scheduleId===undefined||!base){setState('polling');return;}
    let root:URL;try{root=new URL(base,window.location.origin);if(!['ws:','wss:'].includes(root.protocol)||root.username||root.password||root.search||root.hash)throw new Error();if(window.location.protocol==='https:'&&root.protocol!=='wss:')throw new Error();}catch{setState('polling');return;}
    let active=true;let denied=false;let socket:WebSocket|undefined;let attempt=0;let timer:number|undefined;let merge:number|undefined;
    const invalidate=()=>{if(merge!==undefined)return;merge=window.setTimeout(()=>{merge=undefined;if(active)callback.current();},150);};
    const open=()=>{
      if(!active||denied||document.hidden)return;setState('connecting');
      socket=new WebSocket(`${root.href.replace(/\/$/,'')}/schedules/${scheduleId}/availability`);
      socket.onopen=()=>{attempt=0;setState('connected');invalidate();};
      socket.onmessage=event=>{try{const message=JSON.parse(event.data);if(message.scheduleId===scheduleId&&typeof message.type==='string')invalidate();}catch{/* REST remains authoritative. */}};
      socket.onclose=event=>{if(!active)return;setState('polling');invalidate();if(event.code===1008){denied=true;return;}timer=window.setTimeout(open,Math.min(30000,1000*2**Math.min(attempt++,5))+Math.floor(Math.random()*300));};
      socket.onerror=()=>socket?.close();
    };
    const visible=()=>{if(!document.hidden&&(!socket||socket.readyState===WebSocket.CLOSED)){clearTimeout(timer);open();}};
    open();document.addEventListener('visibilitychange',visible);
    return()=>{active=false;clearTimeout(timer);clearTimeout(merge);document.removeEventListener('visibilitychange',visible);socket?.close();};
  },[scheduleId]);
  return state;
}
