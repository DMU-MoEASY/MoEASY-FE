// Retain saved keys so existing personal marker settings get the corrected artwork.
export const markerSymbols = [
  { key: '●', label: '기본', path: '<circle cx="12" cy="12" r="5"/>' },
  { key: '★', label: '즐겨찾기', path: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>' },
  { key: '↗', label: '러닝', path: '<circle cx="15" cy="4" r="1.5"/><path d="m12 8 4 3 4 1M7 10l5-2-2 6 4 3 1 5M10 14l-3 5H3"/>' },
  { key: '♨', label: '식사', path: '<path d="M4 3v5a3 3 0 0 0 6 0V3M7 3v18M19 3c-3 2-4 5-4 9h4M19 3v18"/>' },
  { key: '▤', label: '스터디', path: '<path d="M12 6C9 4 6 4 3 5v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14"/>' },
] as const;

export function markerSymbol(key?: string) {
  return markerSymbols.find(symbol => symbol.key === key) ?? markerSymbols[0];
}

export function markerSymbolPreview(key: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${markerSymbol(key).path}</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
