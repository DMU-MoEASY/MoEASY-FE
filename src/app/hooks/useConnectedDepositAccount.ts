import {useEffect,useState} from 'react';
import {bankAccountApi} from '../services/pendingBackendApi';
import {supportedBanks} from '../services/bankManagement';
import {ApiError} from '../lib/apiClient';
export const BANK_ACCOUNT_CHANGED='moeasy:bank-account-changed';
export function useConnectedDepositAccount(groupId:string|number,enabled:boolean) {
  const key=String(groupId);
  const [state,setState]=useState<{key:string;text:string}>();
  useEffect(()=>{
    if(!enabled)return;
    let controller:AbortController;
    const read=()=>{
      controller?.abort();controller=new AbortController();const signal=controller.signal;
      setState({key,text:'입금 계좌 조회 중…'});
      void bankAccountApi.get(groupId,signal).then(account=>{if(!signal.aborted)setState({key,text:`${supportedBanks[account.bankCode as keyof typeof supportedBanks]??account.bankCode} ${account.accountNumberMasked} ${account.accountHolder}`});}).catch(error=>{if(!signal.aborted)setState({key,text:error instanceof ApiError&&error.code==='BANK404_1'?'연결된 계좌 없음':'입금 계좌를 조회하지 못했습니다.'});});
    };
    const changed=(event:Event)=>{if(String((event as CustomEvent).detail)===key)read();};
    read();window.addEventListener('focus',read);window.addEventListener(BANK_ACCOUNT_CHANGED,changed);
    return()=>{controller?.abort();window.removeEventListener('focus',read);window.removeEventListener(BANK_ACCOUNT_CHANGED,changed);};
  },[key,enabled]);
  return enabled&&state?.key===key?state.text:'입금 계좌 조회 중…';
}
