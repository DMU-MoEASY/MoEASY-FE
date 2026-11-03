import { Component, Suspense, type ReactNode, type ErrorInfo } from 'react';
import { ApiError } from '../lib/apiClient';
export function ScreenLoading({label='화면을 불러오는 중입니다…'}:{label?:string}) {
  return <section role="status" aria-busy="true" className="space-y-4 rounded-2xl border border-border bg-card p-6"><p className="text-sm text-muted-foreground">{label}</p><div aria-hidden className="motion-safe:animate-pulse space-y-3"><div className="h-6 w-1/3 rounded bg-secondary"/><div className="h-20 rounded-xl bg-secondary"/><div className="h-20 rounded-xl bg-secondary"/></div></section>;
}
export function RequestError({error,onRetry,onBack,backLabel='돌아가기'}:{error:unknown;onRetry:()=>void;onBack?:()=>void;backLabel?:string}) {
  const missing=error instanceof ApiError&&error.status===404;
  const denied=error instanceof ApiError&&error.status===403;
  const title=missing?'모임 또는 항목을 찾을 수 없어요':denied?'접근 권한을 확인해주세요':'불러오지 못했어요';
  const description=missing?'삭제되었거나 사용할 수 없는 주소입니다. 모임 목록에서 다시 확인해주세요.':denied?'가입한 모임과 운영 권한을 확인한 뒤 다시 시도해주세요.':error instanceof Error?error.message:'잠시 후 다시 시도해주세요.';
  return <section role="alert" className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p><div className="mt-4 flex flex-wrap gap-3">{onBack&&<button onClick={onBack} className="min-h-11 rounded-lg bg-secondary px-4 py-3 text-sm">{backLabel}</button>}<button onClick={onRetry} className="min-h-11 rounded-lg bg-primary px-4 py-3 text-sm text-white">다시 시도</button></div></section>;
}
class ScreenBoundary extends Component<{children:ReactNode;screenKey?:string},{error:boolean}> {
  state={error:false};
  static getDerivedStateFromError(){return {error:true};}
  componentDidCatch(error:Error,_info:ErrorInfo){if(import.meta.env.DEV)console.error(error);}
  componentDidUpdate(previous:{screenKey?:string}){if(previous.screenKey!==this.props.screenKey&&this.state.error)this.setState({error:false});}
  render(){return this.state.error?<section role="alert" className="rounded-2xl border border-border bg-card p-6"><h1 className="text-lg font-semibold">화면을 불러오지 못했어요</h1><p className="mt-2 text-sm text-muted-foreground">새 버전이 배포되었거나 연결이 끊겼을 수 있어요. 새로고침해 다시 열어주세요.</p><button onClick={()=>window.location.reload()} className="mt-5 min-h-11 rounded-xl bg-primary px-4 py-3 text-sm text-white">새로고침</button></section>:this.props.children;}
}
export function AsyncScreen({children,screenKey}:{children:ReactNode;screenKey?:string}) {return <ScreenBoundary screenKey={screenKey}><Suspense fallback={<ScreenLoading/>}>{children}</Suspense></ScreenBoundary>;}
