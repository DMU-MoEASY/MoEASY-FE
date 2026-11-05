export type TransferAccount = { bank: string; accountNumber: string; holder: string };

// A link only prepares the transfer screen. It never proves that money was sent.
export function buildTossTransferUrl(account: TransferAccount, amount: number) {
  const bank = account.bank.trim();
  const holder = account.holder.trim();
  const accountNumber = account.accountNumber.replace(/[\s-]/g, '');
  if (!bank || bank.length > 40 || !holder || holder.length > 50 || !/^\d{8,20}$/.test(accountNumber)) {
    throw new Error('은행·예금주와 8~20자리 숫자 계좌번호를 확인해주세요.');
  }
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('송금할 금액을 1원 이상의 정수로 입력해주세요.');
  return `supertoss://send?${new URLSearchParams({ bank, accountNo: accountNumber, amount: String(amount) })}`;
}

export function transferFingerprint(account: TransferAccount, amount: number, targetId: string) {
  return JSON.stringify([account.bank.trim(), account.accountNumber.replace(/[\s-]/g, ''), account.holder.trim(), amount, targetId]);
}
