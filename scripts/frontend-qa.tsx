// Isolated development origin only. No production session or backend writes.
import {createRoot} from 'react-dom/client';
import App from '../src/app/App';
import {AsyncScreen} from '../src/app/components/ScreenStates';
import '../src/styles/index.css';
if(!import.meta.env.DEV)throw new Error('Development only');
const session={mode:'social',provider:'GOOGLE',memberId:90001,onboardingCompleted:true};
const group={id:77,name:'QA 서버 모임',region:'서울 구로구',description:'QA 전용',members:1,tier:'bronze',category:'스터디',imageUrl:'',source:'api',ownerMemberId:90001};
localStorage.setItem('moeasy:authSession',JSON.stringify(session));
localStorage.setItem('moeasy:server-groups:90001:joined',JSON.stringify(new URLSearchParams(location.search).has('empty') ? [] : [group,{...group,id:1,name:'숨겨야 할 샘플',source:undefined},{...group,id:2,name:'다른 계정 모임',ownerMemberId:90002}]));
window.history.replaceState({},'', '/');
let responseMode='missing';
window.fetch=async(input,init={})=>{
  const url=String(input);
  const reply=(status:number,result:unknown,code='OK')=>new Response(JSON.stringify({result,code,message:status===401?'인증이 만료되었습니다.':'QA 응답'}),{status,headers:{'content-type':'application/json'}});
  if(url.endsWith('/auth/csrf'))return reply(200,{token:'qa-csrf'});
  if(responseMode==='offline')throw new TypeError('offline');
  if(responseMode==='expired')return reply(401,null,'AUTH401_1');
  if(init.method&&init.method!=='GET')throw new Error('QA 실제 쓰기 요청 차단');
  return reply(404,null,'GROUP404_1');
};
function QA(){return <><div className="relative z-[100] flex flex-wrap gap-2 bg-white p-3 text-sm"><strong>프런트 QA · 실제 서버 요청 없음</strong><button onClick={()=>{responseMode='expired';}}>인증 만료 응답</button><button onClick={()=>{responseMode='offline';}}>연결 끊김 응답</button><button onClick={()=>{responseMode='missing';}}>없는 모임 응답</button><button onClick={()=>location.assign('/scripts/frontend-qa.html')}>QA 초기화</button></div><AsyncScreen><App/></AsyncScreen></>};
createRoot(document.getElementById('frontend-qa-root')!).render(<QA/>);
