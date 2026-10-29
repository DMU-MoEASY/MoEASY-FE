// Explicit development-only fixture runner. No production entry imports this file.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RemoteSettlementExperience } from '../src/app/components/RemoteSettlementExperience';
import { RemoteJoinRequests } from '../src/app/components/RemoteJoinRequests';
import '../src/styles/index.css';
if (!import.meta.env.DEV) throw new Error('QA fixtures are development only');
let scenario='success';let approved=new Set<number>();let requests:string[]=[];
const items=[{settlementId:31,title:'QA 식사비',scheduleId:null,status:'OPEN',splitMode:'EQUAL',totalAmount:10000,targetCount:3,dueAt:null,createdAt:'2026-10-29T12:00:00'}];
window.fetch=async(input,init={})=>{
  const url=String(input);requests.push(`${init.method??'GET'} ${new URL(url,location.origin).pathname}`);
  const reply=(result:unknown,status=200,code='OK')=>Promise.resolve(new Response(JSON.stringify({result,code,message:status===401?'인증이 필요합니다.':status===403?'운영 권한이 없습니다.':'QA 응답'}),{status,headers:{'Content-Type':'application/json'}}));
  if(url.endsWith('/auth/csrf'))return reply({token:'qa-only',headerName:'X-XSRF-TOKEN'});
  if(scenario==='unauthorized')return reply(null,401,'AUTH401_1');
  if(scenario==='forbidden')return reply(null,403,'AUTH403_1');
  if(scenario==='network')throw new TypeError('Failed to fetch');
  if(scenario==='invalid')return reply({unexpected:true});
  if(scenario==='empty')return reply({items:[],page:0,size:20,totalPages:0,totalElements:0,hasNext:false});
  if(/join-requests\/\d+\/(approve|reject)$/.test(url)){const id=Number(url.match(/join-requests\/(\d+)/)?.[1]);approved.add(id);return reply(null);}
  if(url.includes('join-requests'))return reply({items:[{requestId:9,memberId:81,nickname:'QA 신청자',introduction:'테스트용 소개',createdAt:'2026-10-29T12:00:00'}].filter(item=>!approved.has(item.requestId)),page:0,size:20,hasNext:false});
  if(/settlements\/31$/.test(url))return reply({...items[0],groupId:7,description:'QA 설명',createdBy:{groupMemberId:11,nickname:'QA 작성자'},items:[{settlementItemId:101,groupMemberId:11,nickname:'QA A',amount:3334,status:'PAID'},{settlementItemId:102,groupMemberId:12,nickname:'QA B',amount:3333,status:'PENDING'},{settlementItemId:103,groupMemberId:13,nickname:'QA C',amount:3333,status:'REFUNDED'}]});
  return reply({items:scenario==='pages'&&url.includes('page=1')?[{...items[0],settlementId:32,title:'QA 두 번째 페이지'}]:items,page:url.includes('page=1')?1:0,size:20,totalElements:21,totalPages:scenario==='pages'?2:1,hasNext:scenario==='pages'&&!url.includes('page=1')});
};
class Boundary extends React.Component<{children:React.ReactNode},{error:string}>{state={error:''};static getDerivedStateFromError(error:Error){return {error:error.message};}render(){return this.state.error?<p role="alert">QA 렌더 오류: {this.state.error}</p>:this.props.children;}}
function QA(){const [screen,setScreen]=useState('settlements');const [mode,setMode]=useState('success');const [counter,setCounter]=useState(0);const [log,setLog]=useState('');return <><div className="sticky top-0 z-[100] flex flex-wrap gap-3 border-b bg-white p-3"><strong>개발 QA · 실제 서버 요청 없음</strong><label>화면<select aria-label="QA 화면" value={screen} onChange={e=>setScreen(e.target.value)}><option value="settlements">정산</option><option value="joins">가입 신청</option></select></label><label>응답<select aria-label="QA 응답" value={mode} onChange={e=>{scenario=e.target.value;setMode(scenario);approved=new Set();requests=[];}}>{['success','empty','pages','unauthorized','forbidden','network','invalid'].map(value=><option key={value}>{value}</option>)}</select></label><button onClick={()=>{approved=new Set();requests=[];setCounter(v=>v+1);}}>다시 실행</button><button onClick={()=>{scenario='success';setLog('모의 서버 응답을 정상으로 복구했습니다. 화면의 재시도 버튼을 누르세요.');}}>응답 정상 복구</button><button onClick={()=>setLog(requests.join('\n'))}>요청 기록</button></div>{log&&<pre className="p-4">{log}</pre>}<Boundary key={`${screen}:${mode}:${counter}`}>{screen==='settlements'?<RemoteSettlementExperience meetupId={7} meetupName="QA 모임" onBack={()=>setScreen('joins')}/>:<RemoteJoinRequests meetupId={7} name="QA 모임" onBack={()=>setScreen('settlements')}/>}</Boundary></>};
createRoot(document.getElementById('qa-root')!).render(<QA/>);
