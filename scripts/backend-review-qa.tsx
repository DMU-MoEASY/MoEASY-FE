import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {RemoteAvailabilityExperience} from '../src/app/components/RemoteAvailabilityExperience';
import {RemoteSchedulePanel} from '../src/app/components/RemoteSchedulePanel';
import {RemoteSettlementExperience} from '../src/app/components/RemoteSettlementExperience';
import {RemoteMembersExperience} from '../src/app/components/RemoteMembersExperience';
import {RemoteBankPanel} from '../src/app/components/RemoteBankPanel';
import {buildGridCandidates} from '../src/app/services/schedulePollRules';
import '../src/styles/index.css';
if(!import.meta.env.DEV)throw new Error('Development only');
localStorage.setItem('moeasy:authSession',JSON.stringify({mode:'social',provider:'GOOGLE',memberId:90001,onboardingCompleted:true}));
const members=[{groupMemberId:501,memberId:90001,nickname:'QA 운영진',role:'OWNER'},{groupMemberId:502,memberId:90002,nickname:'QA 회원 B',role:'MEMBER'},{groupMemberId:503,memberId:90003,nickname:'QA 회원 C',role:'MEMBER'}];
let scenario='success';let selected=['2099-01-10T09:00:00','2099-01-10T09:30:00'];let confirmed=false;let version=0;let paid=0;let amount=0;let schedule={scheduleId:81,groupId:7,title:'QA 서버 일정',description:'서버 연결 검증',startsAt:'2099-01-10T09:00:00',endsAt:'2099-01-10T10:00:00',locationName:'QA 장소',locationAddress:'서울 구로구',status:'SCHEDULED',latitude:null,longitude:null,placeProvider:null,placeId:null,createdAt:'2098-12-01T00:00:00',updatedAt:'2098-12-01T00:00:00'};
window.fetch=async(input,init={})=>{
 const url=String(input);const body=typeof init.body==='string'?JSON.parse(init.body):{};
 const reply=(result:unknown,status=200,code='OK')=>new Response(JSON.stringify({result,code,message:'QA 모의 응답'}),{status,headers:{'content-type':'application/json'}});
 if(url.endsWith('/auth/csrf'))return reply({token:'qa-csrf'});
 if(scenario==='missing'&&!url.includes('/schedules?'))return reply(null,404,'COMMON404_1');
 if(url.endsWith('/members'))return reply({members});
 if(url.endsWith('/availability/me')){if(init.method==='PUT')selected=body.slots;if(init.method==='DELETE')selected=[];return reply(null);}
 if(url.endsWith('/availability-poll/confirm')){confirmed=true;return reply({confirmed:true});}
 if(url.endsWith('/availability'))return reply({poll:{pollId:4,startDate:'2099-01-10',dayCount:3,startHour:9,endHour:12,voteDeadlineAt:'2099-01-09T23:00:00',status:confirmed?'CONFIRMED':'OPEN',slotMinutes:30,token:'qa-current-token',confirmed,confirmedStartsAt:confirmed?'2099-01-10T09:00:00':null,confirmedEndsAt:confirmed?'2099-01-10T10:00:00':null},targetCount:3,respondedCount:2,pendingCount:1,slots:buildGridCandidates('2099-01-10',3,9,12).map((s,i)=>({startsAt:s+':00',availableCount:i<2?2:1,selected:selected.includes(s+':00')})),me:{responded:true,slots:selected,editable:!confirmed},recommendations:[{startsAt:'2099-01-10T09:00:00',endsAt:'2099-01-10T10:00:00',availableCount:2,targetCount:3,ratio:2/3}]});
 if(url.includes('/rsvp'))return reply({scheduleId:81,startsAt:schedule.startsAt,endsAt:schedule.endsAt,canRespond:true,myStatus:body.status??'UNDECIDED',counts:{ATTENDING:1},members:[]});
 if(url.endsWith('/attendance'))return reply({scheduleId:81,version:1,collectionStatus:'OPEN',canEdit:true,canComplete:true,canReopen:false,rosterFixed:true,recoverable:false,members:[{groupMemberId:501,status:'PRESENT',preRegistered:true,credited:false}]});
 if(/schedules\/81$/.test(url)){if(init.method==='PATCH')schedule={...schedule,...body};return reply(schedule);}
 if(url.includes('/groups/7/schedules')){if(init.method==='POST'){schedule={...schedule,...body};return reply({scheduleId:81});}return reply({from:'2099-01-01T00:00:00',to:'2099-02-01T00:00:00',items:[schedule],nextCursor:null,hasNext:false});}
 if(url.includes('/bank-account/transactions'))return reply({items:[{transactionId:1,type:'DEPOSIT',transactedAt:'2099-01-10T09:00:00',description:'입금',displayName:'',counterparty:'QA 회원',amount:10000,balance:10000,branch:'',memo:''}],page:0,totalPages:1,hasNext:false});
 if(url.endsWith('/bank-account'))return reply({accountId:1,bankCode:'KB',accountNumberMasked:'*******1234',accountHolder:'QA 계좌',lastSyncedAt:null,nextSyncAt:null,lastSyncError:null});
 if(url.includes('/payments')){if(init.method==='POST'){if(url.endsWith('/cancel'))paid=0;else{paid+=body.amount;amount=body.amount;}version++;return reply({});}return reply({items:version?[{paymentId:901,settlementItemId:701,paymentType:'PAYMENT',source:'MANUAL',status:paid?'COMPLETED':'CANCELLED',amount,occurredAt:'2099-01-10T09:00:00',createdAt:'2099-01-10T09:00:00',cancelReason:paid?null:'오등록'}]:[],page:0,totalPages:1,hasNext:false});}
 const settlement={settlementId:31,scheduleId:null,title:'QA 서버 정산',status:'OPEN',splitMode:'EQUAL',totalAmount:10000,targetCount:3,dueAt:null,createdAt:'2099-01-01T00:00:00'};
 if(url.endsWith('/preview'))return reply({splitMode:'EQUAL',totalAmount:body.totalAmount,targetCount:body.groupMemberIds.length,items:body.groupMemberIds.map((id:number,i:number)=>({groupMemberId:id,nickname:members.find(m=>m.groupMemberId===id)?.nickname,amount:Math.floor(body.totalAmount/body.groupMemberIds.length)+(i<body.totalAmount%body.groupMemberIds.length?1:0),remainderAmount:i<body.totalAmount%body.groupMemberIds.length?1:0}))});
 if(/settlements\/31$/.test(url))return reply({...settlement,groupId:7,description:'검증',createdBy:{groupMemberId:501,nickname:'QA 운영진'},paidAmount:paid,remainingAmount:10000-paid,items:[{settlementItemId:701,groupMemberId:501,nickname:'QA 운영진',amount:10000,status:paid===10000?'PAID':'PENDING',version,paidAmount:paid,remainingAmount:10000-paid}]});
 if(init.method==='POST'&&url.endsWith('/settlements'))return reply({settlementId:31});
 if(url.includes('/settlements?'))return reply({items:[settlement],page:0,size:20,totalElements:1,totalPages:1,hasNext:false});
 return reply(null,404,'QA404');
};
function QA(){const [screen,setScreen]=useState('grid');const [count,setCount]=useState(0);return <><nav className="flex flex-wrap gap-3 bg-white p-3 text-sm"><strong>로컬 모의 API 검증 · 실제 서버 쓰기 없음</strong>{['grid','schedules','settlements','members','bank'].map(s=><button key={s} onClick={()=>setScreen(s)}>{s}</button>)}<button onClick={()=>{scenario=scenario==='success'?'missing':'success';setCount(v=>v+1);}}>404 전환</button></nav><div key={`${screen}:${count}`}>{screen==='grid'?<RemoteAvailabilityExperience meetupId={7} meetupName="QA 모임" initialScheduleId={81} onBack={()=>{}} onLocal={()=>{}}/>:screen==='schedules'?<main className="mx-auto max-w-5xl p-5"><RemoteSchedulePanel groupId={7} onCoordinate={()=>setScreen('grid')}/></main>:screen==='settlements'?<RemoteSettlementExperience meetupId={7} meetupName="QA 모임" onBack={()=>{}}/>:screen==='members'?<RemoteMembersExperience meetupId={7} onBack={()=>{}}/>:<RemoteBankPanel meetupId={7}/>}</div></>};
createRoot(document.getElementById('root')!).render(<QA/>);
