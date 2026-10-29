import { markerSymbols, markerSymbol, markerSymbolPreview } from '../lib/markerSymbols';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, CalendarDays, Check, Clock3, LocateFixed, MapPin, Navigation, Search, Users, Zap } from 'lucide-react';
import { hasGoogleMapsKey, hasKakaoMapsKey, loadGoogleMaps, loadKakaoPlaces } from '../lib/mapServices';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { usePersistentState } from '../hooks/usePersistentState';
import { globalScheduleKey, INITIAL_GLOBAL_SCHEDULES } from '../services/meetupOperations';

type MapMode = 'nearby' | 'schedule';
type MapItem = {
  id: string;
  title: string;
  place: string;
  meta: string;
  people?: string;
  lat: number;
  lng: number;
  source: 'moeasy' | 'kakao';
  url?: string;
  groupKey?: string;
};

const nearbyMeetups: MapItem[] = [
  { id: 'nearby-1', title: '퇴근 후 한강 러닝', place: '반포 한강공원', meta: '오늘 19:30', people: '5/8명', lat: 37.5108, lng: 126.9957, source: 'moeasy' },
  { id: 'nearby-2', title: '성수 카페 번개', place: '서울숲 4번 출구', meta: '오늘 20:00', people: '3/6명', lat: 37.5445, lng: 127.0374, source: 'moeasy' },
  { id: 'nearby-3', title: '저녁 보드게임', place: '강남역 11번 출구', meta: '내일 18:30', people: '4/8명', lat: 37.4981, lng: 127.0276, source: 'moeasy' },
];

const defaultCenter = { lat: 37.5159, lng: 127.0204 };

export function MapPage({ userId = 'local', onOpenSchedule }: { userId?: string | number; onOpenSchedule?: () => void }) {
  const [events] = usePersistentState(globalScheduleKey, INITIAL_GLOBAL_SCHEDULES);
  const [preferences, setPreferences] = usePersistentState<Record<string, { color: string; icon: string }>>(`moeasy:map-markers:${userId}`, {});
  const [resolved, setResolved] = useState<MapItem[]>([]);
  const [unresolved, setUnresolved] = useState(0);
  useEffect(() => {
    let active = true;
    setResolved([]);
    setUnresolved(0);
    if (!events.length) return;
    loadKakaoPlaces().then(async kakao => {
      const service = new kakao.maps.services.Places();
      const results = await Promise.all(events.filter(event => event.status !== 'POLLING' && event.place.trim()).map(event => new Promise<MapItem | null>(resolve => {
        service.keywordSearch(event.place, (places: any[], status: string) => {
          const place = status === kakao.maps.services.Status.OK ? places[0] : undefined;
          resolve(place ? { id: String(event.id), title: event.title, place: event.place, meta: `${event.group} · ${event.dateValue} ${event.time}`, lat: Number(place.y), lng: Number(place.x), source: 'moeasy', groupKey: String(event.meetupId ?? event.group) } : null);
        });
      })));
      if (active) { setResolved(results.filter((item): item is MapItem => item !== null)); setUnresolved(results.filter(item => !item).length); }
    }).catch(() => active && setUnresolved(events.length));
    return () => { active = false; };
  }, [events]);
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const userMarker = useRef<any>(null);
  const [mode, setMode] = useState<MapMode>(() => new URLSearchParams(window.location.search).get('mode') === 'schedule' ? 'schedule' : 'nearby');
  const [listOpen, setListOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MapItem[]>([]);
  const [selectedId, setSelectedId] = useState(nearbyMeetups[0]!.id);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const modeItems = useMemo(() => mode === 'nearby' ? nearbyMeetups : resolved, [mode, resolved]);
  const items = searchStatus === 'ready' || searchStatus === 'empty' ? searchResults : modeItems;
  const selected = items.find(item => item.id === selectedId) ?? items[0];

  useEffect(() => {
    let active = true;
    if (!mapElement.current || !hasGoogleMapsKey) {
      setMapStatus('fallback');
      return;
    }

    loadGoogleMaps()
      .then((google) => {
        if (!active || !mapElement.current) return;
        mapInstance.current = new google.maps.Map(mapElement.current, {
          center: defaultCenter,
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
          styles: mapStyle,
        });
        setMapStatus('ready');
      })
      .catch(() => active && setMapStatus('fallback'));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const google = window.google;
    const map = mapInstance.current;
    if (!google?.maps || !map || mapStatus !== 'ready') return;

    markers.current.forEach(marker => marker.setMap(null));
    markers.current = items.map(item => {
      const marker = new google.maps.Marker({
        map,
        position: { lat: item.lat, lng: item.lng },
        title: item.title,
        icon: markerIcon(item.id === selected?.id, item.source, preferences[item.groupKey ?? item.id]),
      });
      marker.addListener('click', () => setSelectedId(item.id));
      return marker;
    });

  }, [items, mapStatus, selected?.id, preferences]);

  useEffect(() => {
    const google = window.google;
    const map = mapInstance.current;
    if (!google?.maps || !map || mapStatus !== 'ready') return;
    if (items.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      items.forEach(item => bounds.extend({ lat: item.lat, lng: item.lng }));
      map.fitBounds(bounds, 72);
      if (items.length === 1) map.setZoom(15);
    }
  }, [items, mapStatus]);

  const selectItem = (item: MapItem) => {
    setSelectedId(item.id);
    setListOpen(false);
    mapInstance.current?.panTo({ lat: item.lat, lng: item.lng });
  };

  const changeMode = (nextMode: MapMode) => {
    setMode(nextMode);
    window.history.replaceState({}, "", `/map?mode=${nextMode}`);
    setSearchResults([]);
    setQuery('');
    setSearchStatus('idle');
    setSelectedId(nextMode === 'nearby' ? nearbyMeetups[0]!.id : resolved[0]?.id ?? '');
  };

  const searchPlaces = async (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    setSearchStatus('loading');
    try {
      const kakao = await loadKakaoPlaces();
      const service = new kakao.maps.services.Places();
      service.keywordSearch(query.trim(), (data: any[], status: string) => {
        if (status !== kakao.maps.services.Status.OK) {
          setSearchResults([]);
          setSearchStatus(status === kakao.maps.services.Status.ZERO_RESULT ? 'empty' : 'error');
          return;
        }
        const normalized = data.slice(0, 8).map(place => ({
          id: `kakao-${place.id}`,
          title: place.place_name,
          place: place.road_address_name || place.address_name,
          meta: place.category_name?.split(' > ').slice(-2).join(' · ') || '카카오 장소 검색',
          lat: Number(place.y),
          lng: Number(place.x),
          source: 'kakao' as const,
          url: place.place_url,
        }));
        if (normalized.length === 0) {
          setSearchResults([]);
          setSearchStatus('empty');
          return;
        }
        setSearchResults(normalized);
        setSelectedId(normalized[0]!.id);
        setSearchStatus('ready');
      }, {
        location: new kakao.maps.LatLng(defaultCenter.lat, defaultCenter.lng),
        radius: 15000,
        sort: kakao.maps.services.SortBy.DISTANCE,
      });
    } catch {
      setSearchStatus('error');
    }
  };

  const moveToCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const position = { lat: coords.latitude, lng: coords.longitude };
      mapInstance.current?.panTo(position);
      mapInstance.current?.setZoom(14);
      if (window.google?.maps && mapInstance.current) {
        userMarker.current?.setMap(null);
        userMarker.current = new window.google.maps.Marker({
          map: mapInstance.current,
          position,
          title: '내 현재 위치',
          zIndex: 999,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: '#315EFB',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 4,
          },
        });
      }
      setLocationStatus('ready');
    }, () => setLocationStatus('error'), { enableHighAccuracy: true, timeout: 10000 });
  };

  return (
    <section className="space-y-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Meetup map</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">모임 지도</h1>
          <p className="mt-3 text-sm text-muted-foreground">모임 장소를 찾고, 내 일정의 위치를 확인하세요.</p>
        </div>
        <button onClick={moveToCurrentLocation} disabled={locationStatus === 'loading'} className="flex self-start items-center gap-2 rounded-full bg-[#101828] px-4 py-2.5 text-sm text-white transition-colors hover:bg-primary disabled:opacity-60 sm:self-auto">
          <LocateFixed className="h-4 w-4 text-[#8FAAFF]" />{locationStatus === 'loading' ? '위치 확인 중' : locationStatus === 'ready' ? '현재 위치 표시됨' : '현재 위치'}
        </button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex self-start rounded-full bg-card p-1 ring-1 ring-black/[0.06]">
          <ModeButton active={mode === 'nearby'} onClick={() => changeMode('nearby')} icon={<Zap />}>주변 번개</ModeButton>
          <ModeButton active={mode === 'schedule'} onClick={() => changeMode('schedule')} icon={<CalendarDays />}>내 일정</ModeButton>
        </div>
        <form onSubmit={searchPlaces} className="flex w-full items-center gap-2 rounded-full bg-card p-1.5 pl-4 ring-1 ring-black/[0.06] lg:max-w-md">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="카카오로 장소 검색" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" />
          <button disabled={searchStatus === 'loading'} className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">{searchStatus === 'loading' ? '검색 중' : '검색'}</button>
        </form>
      </div>

      <div className="grid overflow-hidden rounded-[26px] bg-[#101828] shadow-xl shadow-slate-900/10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative h-[min(56dvh,500px)] overflow-hidden bg-[#DCE4E8] lg:h-[650px]">
          <div ref={mapElement} className="absolute inset-0" />
          {mapStatus !== 'ready' && <FallbackMap />}
          <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full bg-[#101828]/90 px-3 py-2 text-xs text-white shadow-sm backdrop-blur">
            {mapStatus === 'ready' ? <Check className="h-3.5 w-3.5 text-[#C9FF5C]" /> : <AlertCircle className="h-3.5 w-3.5 text-amber-300" />}
            {mapStatus === 'ready' ? 'GOOGLE MAPS · LIVE' : '지도 키 연결 대기'}
          </div>
          {searchStatus === 'error' && <div className="absolute left-4 right-4 top-16 z-20 rounded-xl bg-white p-3 text-sm shadow-lg">Kakao 장소 검색을 사용할 수 없습니다. JavaScript 키와 등록 도메인을 확인해주세요.</div>}
          {searchStatus === 'empty' && <div className="absolute left-4 right-4 top-16 z-20 rounded-xl bg-white p-3 text-sm shadow-lg">검색 결과가 없습니다. 장소 이름이나 지역을 바꿔 다시 검색해주세요.</div>}
          {locationStatus === 'error' && <div className="absolute bottom-4 left-4 right-4 z-30 rounded-xl bg-white p-3 text-sm text-rose-700 shadow-lg lg:right-auto">위치 권한을 허용하면 현재 위치를 지도에서 확인할 수 있어요.</div>}
          <div className="absolute bottom-3 left-3 right-3 z-30 lg:hidden"><LocationCard item={selected} compact /></div>
        </div>

        <aside className="hidden overflow-y-auto bg-[#101828] text-white lg:block lg:max-h-[650px]">
          <div className="sticky top-0 z-10 border-b border-white/10 bg-[#101828]/95 p-6 backdrop-blur">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-[#8FAAFF]">{searchResults.length ? 'KAKAO SEARCH' : 'NEAR YOU'}</p>
            <h2 className="mt-2 text-xl font-semibold">{searchResults.length ? `'${query}' 검색 결과` : mode === 'nearby' ? '주변 번개 모임' : '내 일정 장소'}</h2>
            <p className="mt-1 text-sm text-slate-400">총 {items.length}개의 장소</p>
          </div>
          <div className="space-y-2 p-3">{items.map(item => <button key={item.id} type="button" onClick={() => selectItem(item)} className={`w-full rounded-2xl text-left transition-colors ${item.id === selected?.id ? 'bg-white text-[#101828]' : 'text-white hover:bg-white/[0.06]'}`}><LocationCard item={item} /></button>)}</div>
        </aside>
      </div>

      {mode === 'schedule' && <div className="rounded-xl border border-border p-4 text-sm"><p>{events.length === 0 ? '등록된 일정이 없습니다. 일정을 추가해보세요.' : `확정된 일정 ${events.filter(event => event.status !== 'POLLING').length}개 중 ${resolved.length}개의 장소를 표시합니다.`}</p>{unresolved > 0 && <p className="mt-2 text-muted-foreground">{unresolved}개 장소를 찾지 못했습니다. 일정에서 정확한 장소명이나 주소를 확인해주세요.</p>}<button onClick={onOpenSchedule} className="mt-3 font-semibold text-primary">일정 확인하기 →</button></div>}
      {selected?.source === 'moeasy' && <Dialog><DialogTrigger asChild><button className="min-h-11 rounded-xl border border-border bg-card px-4 py-3 text-sm">선택한 장소의 마커 꾸미기</button></DialogTrigger><DialogContent><DialogTitle>내 지도 마커 설정</DialogTitle><DialogDescription>선택한 색상과 아이콘은 내 지도에만 적용됩니다.</DialogDescription><p className="mt-1 text-sm text-muted-foreground">{selected.title} · 같은 모임의 일정에 적용됩니다.</p><div className="mt-4 flex flex-wrap gap-3">{['#315EFB','#059669','#D97706','#DB2777','#7C3AED'].map(color => <button key={color} aria-label={`마커 색상 ${color}`} aria-pressed={preferences[selected.groupKey ?? selected.id]?.color === color} onClick={() => setPreferences(current => ({...current, [selected.groupKey ?? selected.id]: {icon: current[selected.groupKey ?? selected.id]?.icon ?? '●', color}}))} className="h-10 w-10 rounded-full border-4 border-white ring-1 ring-slate-300" style={{backgroundColor:color}}/>)}</div><div className="mt-4 flex flex-wrap gap-2">{markerSymbols.map(({key: icon, label}) => <button key={icon} aria-pressed={preferences[selected.groupKey ?? selected.id]?.icon === icon} onClick={() => setPreferences(current => ({...current, [selected.groupKey ?? selected.id]: {color: current[selected.groupKey ?? selected.id]?.color ?? '#315EFB', icon}}))} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 aria-pressed:border-primary aria-pressed:bg-secondary"><img src={markerSymbolPreview(icon)} alt="" className="h-5 w-5"/>{label}</button>)}<button onClick={() => setPreferences(current => { const next = {...current}; delete next[selected.groupKey ?? selected.id]; return next; })} className="px-4 py-2 text-sm text-muted-foreground">기본값으로 초기화</button></div></DialogContent></Dialog>}
      <div className="lg:hidden"><Dialog open={listOpen} onOpenChange={setListOpen}><DialogTrigger asChild><button className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white">장소 목록 보기 · {items.length}개</button></DialogTrigger><DialogContent className="top-auto bottom-0 left-0 w-full max-w-full translate-x-0 translate-y-0 rounded-b-none rounded-t-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))]"><DialogTitle>장소 목록</DialogTitle><DialogDescription>장소를 선택하면 지도에서 위치를 확인할 수 있어요.</DialogDescription><div className="max-h-[55dvh] space-y-2 overflow-y-auto">{items.map(item => <button key={item.id} onClick={() => selectItem(item)} className={`w-full rounded-xl border text-left ${selected?.id === item.id ? 'border-primary bg-secondary' : 'border-border'}`}><LocationCard item={{...item,url:undefined}} compact/></button>)}{items.length === 0 && <p className="py-6 text-sm text-muted-foreground">표시할 장소가 없습니다.</p>}</div></DialogContent></Dialog></div>
    </section>
  );
}

function ModeButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all [&>svg]:h-4 [&>svg]:w-4 ${active ? 'bg-[#101828] text-white shadow-sm' : 'text-muted-foreground'}`}>{icon}{children}</button>;
}

function FallbackMap() {
  return <div className="absolute inset-0 overflow-hidden bg-[#DCE4E8]"><div className="absolute inset-0 opacity-70 bg-[linear-gradient(28deg,transparent_46%,rgba(255,255,255,.9)_47%,rgba(255,255,255,.9)_52%,transparent_53%),linear-gradient(100deg,transparent_44%,rgba(255,255,255,.75)_45%,rgba(255,255,255,.75)_50%,transparent_51%)] bg-[size:150px_120px,190px_150px]"/><div className="absolute inset-x-0 top-[54%] h-7 -rotate-[7deg] border-y border-blue-300/50 bg-blue-200/70"/></div>;
}

function LocationCard({ item, compact = false }: { item: MapItem | undefined; compact?: boolean }) {
  if (!item) return null;
  return <div className={`${compact ? 'border border-border bg-card/95 text-foreground shadow-lg backdrop-blur' : ''} rounded-xl p-4`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate font-semibold">{item.title}</h3>{item.source === 'kakao' && <span className="rounded-full bg-[#FEE500] px-2 py-0.5 text-[9px] font-semibold text-[#181600]">KAKAO</span>}</div><div className={`mt-2 space-y-1.5 text-xs ${compact || item.source === 'kakao' ? 'text-muted-foreground' : 'text-slate-400'}`}><p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" />{item.place}</p><p className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{item.meta}</p>{item.people && <p className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{item.people}</p>}</div></div>{item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white"><Navigation className="h-4 w-4" /></a> : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white"><Navigation className="h-4 w-4" /></span>}</div></div>;
}

const markerIcon = (selected: boolean, source: MapItem['source'], preference?: {color:string;icon:string}) => {
  const fill = source === 'kakao' ? '#FEE500' : preference?.color ?? '#315EFB';
  const stroke = source === 'kakao' ? '#181600' : '#FFFFFF';
  const safeColor = /^#[0-9a-f]{6}$/i.test(fill) ? fill : '#315EFB';
  const icon = markerSymbol(preference?.icon);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52"><path d="M22 51C19 44 5 34 5 21A17 17 0 1 1 39 21C39 34 25 44 22 51Z" fill="${safeColor}" stroke="${selected ? '#101828' : 'white'}" stroke-width="3"/><g transform="translate(11 10) scale(.92)" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon.path}</g></svg>`;
  return { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, scaledSize: new window.google.maps.Size(44, 52), anchor: new window.google.maps.Point(22, 52) };
};

const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#e7ebef' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#667085' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f8fafc' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#cfd8e3' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bfd4f4' }] },
];
