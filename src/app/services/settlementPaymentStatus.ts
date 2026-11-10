export function settlementPaymentStatus(item:{status:string;paidAmount?:number}) {
  if(item.status==='PAID')return '완납';
  if(item.status==='PENDING')return item.paidAmount===undefined?'미납/부분 납부':item.paidAmount>0?'부분 납부':'미납';
  return item.status==='CANCELLED'?'청구 취소':item.status==='REFUNDED'?'환불':item.status;
}
