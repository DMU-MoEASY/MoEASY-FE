export const transferBanks = [
  { name: '국민은행', aliases: ['KB국민은행', 'KB국민', '국민은행', '국민', 'KB'] },
  { name: '신한은행', aliases: ['신한은행', '신한', 'SHINHAN'] },
  { name: '우리은행', aliases: ['우리은행', '우리', 'WOORI'] },
  { name: '하나은행', aliases: ['KEB하나은행', '하나은행', '하나', 'HANA'] },
  { name: '농협은행', aliases: ['NH농협은행', 'NH농협', '농협은행', '농협', 'NH'] },
  { name: '지역농축협', aliases: ['지역농축협', '지역농협', '농축협', '단위농협'] },
  { name: '기업은행', aliases: ['IBK기업은행', 'IBK기업', '기업은행', '기업', 'IBK'] },
  { name: '카카오뱅크', aliases: ['카카오뱅크', '카카오은행', '카뱅', 'KAKAOBANK'] },
  { name: '케이뱅크', aliases: ['케이뱅크', '케뱅', 'KBANK', 'K뱅크'] },
  { name: '토스뱅크', aliases: ['토스뱅크', '토스은행', '토스', 'TOSSBANK'] },
  { name: 'SC제일은행', aliases: ['SC제일은행', 'SC제일', '제일은행'] },
  { name: '수협은행', aliases: ['SH수협은행', '수협은행', '수협'] },
  { name: '우체국', aliases: ['우체국은행', '우체국'] },
  { name: '새마을금고', aliases: ['MG새마을금고', '새마을금고', '새마을'] },
  { name: '신협', aliases: ['신용협동조합', '신협'] },
  { name: '부산은행', aliases: ['BNK부산은행', '부산은행', '부산'] },
  { name: '경남은행', aliases: ['BNK경남은행', '경남은행', '경남'] },
  { name: 'iM뱅크', aliases: ['IM뱅크', '대구은행', '대구'] },
  { name: '광주은행', aliases: ['광주은행', '광주'] },
  { name: '전북은행', aliases: ['전북은행', '전북'] },
  { name: '제주은행', aliases: ['제주은행', '제주'] },
  { name: '산업은행', aliases: ['KDB산업은행', '산업은행', '산업'] },
] as const;

export function parseTransferAccountInput(input: string) {
  const normalized = input.normalize('NFKC').replace(/[‐‑–—−]/g, '-');
  // Longest matches first so 지역농협 is not silently classified as 농협은행.
  const aliases = transferBanks.flatMap(bank => bank.aliases.map(alias => ({ alias, name: bank.name }))).sort((a, b) => b.alias.length - a.alias.length);
  let remaining = normalized.toUpperCase();
  const found = new Set<string>();
  for (const { alias, name } of aliases) {
    const token = alias.toUpperCase();
    const pattern = new RegExp(`(?<![A-Z가-힣])${token}(?![A-Z가-힣])`, 'g');
    if (pattern.test(remaining)) { found.add(name); remaining = remaining.replace(pattern, ' '); }
  }
  const withoutAmountsAndDates = normalized
    .replace(/\d[\d,]*\s*(?:원|KRW)/gi, ' ')
    .replace(/(?<!\d)(?:19|20)\d{2}[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01])(?!\d)/g, ' ')
    .replace(/(?:전화|연락처|TEL)\s*[:：]?\s*[\d\s-]+/gi, ' ');
  const candidates = [...withoutAmountsAndDates.matchAll(/\d[\d \t-]*\d/g)]
    .map(match => match[0].replace(/[\s-]/g, ''))
    .filter(value => /^\d{8,20}$/.test(value));
  const accounts = [...new Set(candidates)];
  return {
    bank: found.size === 1 ? [...found][0] : undefined,
    accountNumber: accounts.length === 1 ? accounts[0] : undefined,
    ambiguous: found.size > 1 || accounts.length > 1,
  };
}
