import { ApiError } from '../lib/apiClient';
export const record = (value:unknown):value is Record<string,unknown> => typeof value==='object'&&value!==null&&!Array.isArray(value);
export const nonnegative = (value:unknown) => Number.isSafeInteger(value)&&Number(value)>=0;
export const text = (value:unknown) => typeof value==='string';
export const nullableText = (value:unknown) => value===null||text(value);
export function validResponse<T>(value:unknown, valid:(value:unknown)=>boolean, label:string):T {
  if(!valid(value)) throw new ApiError(502,'INVALID_API_RESPONSE',`${label} 응답 형식이 올바르지 않습니다. 잠시 후 다시 시도해주세요.`);
  return value as T;
}
