// Development-only onboarding fixture. No real API writes or account changes.
import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {OnboardingPage} from '../src/app/components/OnboardingPage';
import {defaultUserProfile} from '../src/app/services/userProfile';
import '../src/styles/index.css';
if(!import.meta.env.DEV)throw new Error('Development only');
let failing=false;
window.fetch=async(input,init={})=>{
  if(init.method && init.method!=='GET')throw new Error('QA는 실제 저장을 실행하지 않습니다.');
  const path=String(input);
  if(failing)throw new TypeError('QA connection failure');
  if(path.includes('/regions'))return new Response(JSON.stringify({result:[{provinceName:'서울특별시',regions:[{code:'11530',name:'구로구'},{code:'11680',name:'강남구'}]},{provinceName:'경기도',regions:[{code:'41130',name:'성남시'},{code:'41110',name:'수원시'}]}]}),{headers:{'content-type':'application/json'}});
  if(path.includes('nicknames/availability'))return new Response(JSON.stringify({result:{available:true}}),{headers:{'content-type':'application/json'}});
  throw new Error('QA에서 지원하지 않는 요청');
};
function QA(){const [version,setVersion]=useState(0);return <><div className="flex gap-3 bg-white p-3"><strong>온보딩 QA · 실제 서버 저장 없음</strong><button onClick={()=>{failing=true;setVersion(v=>v+1);}}>지역 오류 재현</button><button onClick={()=>{failing=false;}}>지역 응답 복구</button></div><OnboardingPage key={version} initialProfile={defaultUserProfile} onComplete={()=>{throw new Error('QA 저장 차단');}}/></>};
createRoot(document.getElementById('region-qa-root')!).render(<QA/>);
