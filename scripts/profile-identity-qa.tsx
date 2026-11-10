import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from '../src/app/App';
import {defaultUserProfile} from '../src/app/services/userProfile';
import '../src/styles/index.css';
if(!import.meta.env.DEV)throw new Error('Development only');
let scenario='server';
function setup(memberId=90001){localStorage.setItem('moeasy:authSession',JSON.stringify({mode:'social',provider:'GOOGLE',memberId,onboardingCompleted:true}));localStorage.setItem('moeasy:userProfile',JSON.stringify(defaultUserProfile));localStorage.setItem('moeasy:userProfilesByMember',JSON.stringify({'90001':defaultUserProfile,'90002':{nickname:'계정B',bio:'',activityRegion:'',interests:[]}}));localStorage.setItem(`moeasy:server-groups:${memberId}:joined`,JSON.stringify([{id:7,name:'QA 모임',region:'서울',description:'QA',members:1,tier:'bronze',category:'스터디',imageUrl:'',source:'api',ownerMemberId:memberId}]));localStorage.setItem('moeasy:server-member-nicknames','{}');window.history.replaceState({},'','/profile');}
setup();
window.fetch=async(input)=>{const url=String(input);const reply=(result:unknown,status=200)=>new Response(JSON.stringify({result,code:status===404?'NOT_FOUND':'OK',message:'QA 응답'}),{status,headers:{'content-type':'application/json'}});if(url.endsWith('/auth/csrf'))return reply({token:'qa-csrf'});if(url.endsWith('/members'))return scenario==='missing'?reply(null,404):reply({members:[{groupMemberId:101,memberId:90003,nickname:'다른회원이름',role:'MEMBER'},{groupMemberId:102,memberId:90001,nickname:'민식테스트',role:'OWNER'}]});return reply({items:[],page:0,size:20,totalElements:0,totalPages:1,hasNext:false});};
function QA(){const [key,setKey]=useState(0);return <><nav className="fixed right-2 top-2 z-[200] flex flex-wrap gap-2 bg-white p-2 text-xs">프로필 모의 검증<button onClick={()=>{scenario='server';setup();setKey(v=>v+1);}}>실제회원 매칭</button><button onClick={()=>{scenario='missing';setup();setKey(v=>v+1);}}>조회 불가</button><button onClick={()=>{scenario='missing';setup(90002);setKey(v=>v+1);}}>다른 계정</button></nav><App key={key}/></>}
createRoot(document.getElementById('root')!).render(<QA/>);
