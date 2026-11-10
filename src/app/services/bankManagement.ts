export const supportedBanks = { NH: 'NH농협', KB: 'KB국민', WR: '우리', IBK: 'IBK기업', SH: '신한' } as const;
export type SupportedBank = keyof typeof supportedBanks;
export type BankConnectInput = { bankCode: SupportedBank; accountNumber: string; accountHolder: string; apiKey: string; secretKey: string };
export type BankSyncInput = { startDate: string; endDate: string; accountPassword: string; residentNumber?: string; accountType?: 'personal'|'business'; loginId?: string; loginPassword?: string };
export const koreaToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
export const koreaNow = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul', hour12: false }).replace(' ', 'T');
export function normalizeBankConnection(input: BankConnectInput): BankConnectInput {
  const value = { ...input, accountNumber: input.accountNumber.replace(/[\s-]/g, ''), accountHolder: input.accountHolder.trim() };
  if (!(value.bankCode in supportedBanks)) throw new Error('지원하는 은행을 선택해주세요.');
  if (!/^\d{8,20}$/.test(value.accountNumber)) throw new Error('계좌번호는 숫자 8~20자리로 입력해주세요.');
  if (!value.accountHolder || value.accountHolder.length > 50) throw new Error('예금주명을 50자 이내로 입력해주세요.');
  if (![value.apiKey, value.secretKey].every(key => /^[!-9;-~]{1,200}$/.test(key))) throw new Error('API Key와 Secret Key는 공백·콜론 없이 200자 이내로 입력해주세요.');
  return value;
}
export function validateBankSync(bank: SupportedBank, input: BankSyncInput, today = koreaToday()): BankSyncInput {
  const parse = (date: string) => { const time=Date.parse(`${date}T00:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(time) && new Date(time).toISOString().slice(0,10) === date; };
  if (!parse(input.startDate) || !parse(input.endDate)) throw new Error('올바른 조회 날짜를 선택해주세요.');
  const days = (Date.parse(input.endDate) - Date.parse(input.startDate)) / 86400000 + 1;
  if (days < 1 || days > 31 || input.endDate > today) throw new Error('조회 기간은 오늘까지 최대 31일입니다.');
  if (!/^\d{4}$/.test(input.accountPassword)) throw new Error('계좌 비밀번호 숫자 4자리를 입력해주세요.');
  const common = { startDate: input.startDate, endDate: input.endDate, accountPassword: input.accountPassword };
  if (bank === 'SH') {
    if (!input.loginId?.trim() || input.loginId.length > 100 || !input.loginPassword || input.loginPassword.length > 200) throw new Error('신한 인터넷뱅킹 ID와 비밀번호를 입력해주세요.');
    return { ...common, loginId: input.loginId.trim(), loginPassword: input.loginPassword };
  }
  if (!['personal','business'].includes(input.accountType ?? '') || !(input.accountType === 'business' ? /^\d{10}$/ : /^\d{6}$/).test(input.residentNumber ?? '')) throw new Error('개인은 생년월일 6자리, 사업자는 사업자번호 10자리를 입력해주세요.');
  return { ...common, residentNumber: input.residentNumber, accountType: input.accountType };
}
export const bankErrorMessage = (code?: string) => ({
  BANK409_1: '이미 연결된 계좌입니다. 현재 연결 정보를 새로 확인해주세요.',
  BANK409_2: '동기화가 진행 중입니다. 잠시 후 연결 정보를 새로 확인해주세요.',
  BANK422_1: '은행에서 조회를 거절했습니다. 인증정보와 은행의 빠른조회 등록 상태를 확인해주세요.',
  BANK422_2: 'Bank API 키를 확인해주세요. 키 변경은 연결 해제 후 다시 연결해야 합니다.',
  BANK429_1: '조회 제한에 도달했습니다. 다음 동기화 가능 시각까지 기다려주세요.',
  BANK502_1: '은행 응답이 지연되거나 외부 서비스에 문제가 있습니다. 기존 거래는 유지됩니다.',
  BANK503_1: '은행 연동 서버 설정을 확인해야 합니다. 관리자에게 문의해주세요.',
}[code ?? '']);
