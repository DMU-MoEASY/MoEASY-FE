import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CalendarDays, Check, Clock3, LocateFixed, MapPin, Navigation, Search, Users, Zap } from 'lucide-react';
import { hasGoogleMapsKey, hasKakaoMapsKey, loadGoogleMaps, loadKakaoPlaces } from '../lib/mapServices';

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
};

const nearbyMeetups: MapItem[] = [
  { id: 'nearby-1', title: '퇴근 후 한강 러닝', place: '반포 한강공원', meta: '오늘 19:30', people: '5/8명', lat: 37.5108, lng: 126.9957, source: 'moeasy' },
  { id: 'nearby-2', title: '성수 카페 번개', place: '서울숲 4번 출구', meta: '오늘 20:00', people: '3/6명', lat: 37.5445, lng: 127.0374, source: 'moeasy' },
  { id: 'nearby-3', title: '저녁 보드게임', place: '강남역 11번 출구', meta: '내일 18:30', people: '4/8명', lat: 37.4981, lng: 127.0276, source: 'moeasy' },
];

const scheduledMeetups: MapItem[] = [
  { id: 'schedule-1', title: '강남 러닝 크루 정기모임', place: '반포 한강공원', meta: '9월 12일 19:00', people: '12/15명', lat: 37.5108, lng: 126.9957, source: 'moeasy' },
  { id: 'schedule-2', title: '판교 개발자 스터디', place: '판교 스타트업캠퍼스', meta: '9월 14일 14:00', people: '8/10명', lat: 37.4021, lng: 127.1087, source: 'moeasy' },
];

const defaultCenter = { lat: 37.5159, lng: 127.0204 };

export function MapPage() {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [mode, setMode] = useState<MapMode>('nearby');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MapItem[]>([]);
  const [selectedId, setSelectedId] = useState(nearbyMeetups[0].id);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const modeItems = useMemo(() => mode === 'nearby' ? nearbyMeetups : scheduledMeetups, [mode]);
  const items = searchResults.length > 0 ? searchResults : modeItems;
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
        icon: markerIcon(item.id === selected?.id, item.source),
      });
      marker.addListener('click', () => setSelectedId(item.id));
      return marker;
    });

    if (items.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      items.forEach(item => bounds.extend({ lat: item.lat, lng: item.lng }));
      map.fitBounds(bounds, 72);
      if (items.length === 1) map.setZoom(15);
    }
  }, [items, mapStatus, selected?.id]);

  const selectItem = (item: MapItem) => {
    setSelectedId(item.id);
    mapInstance.current?.panTo({ lat: item.lat, lng: item.lng });
  };

  const changeMode = (nextMode: MapMode) => {
    setMode(nextMode);
    setSearchResults([]);
    setQuery('');
    setSearchStatus('idle');
    setSelectedId(nextMode === 'nearby' ? nearbyMeetups[0].id : scheduledMeetups[0].id);
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
          setSearchStatus('error');
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
        setSearchResults(normalized);
        setSelectedId(normalized[0].id);
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
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      const position = { lat: coords.latitude, lng: coords.longitude };
      mapInstance.current?.panTo(position);
      mapInstance.current?.setZoom(14);
    });
  };

  return (
    <section className="space-y-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Meetup map</p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">도시에서 만날<br className="sm:hidden" /> 새로운 사람들</h1>
          <p className="mt-3 text-sm text-muted-foreground">Google 지도 위에 MoEasy 모임과 Kakao 장소 검색 결과를 함께 보여드려요.</p>
        </div>
        <button onClick={moveToCurrentLocation} className="flex self-start items-center gap-2 rounded-full bg-[#101828] px-4 py-2.5 text-sm text-white transition-colors hover:bg-primary sm:self-auto">
          <LocateFixed className="h-4 w-4 text-[#8FAAFF]" />현재 위치
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
        <div className="relative h-[500px] overflow-hidden bg-[#DCE4E8] lg:h-[650px]">
          <div ref={mapElement} className="absolute inset-0" />
          {mapStatus !== 'ready' && <FallbackMap />}
          <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full bg-[#101828]/90 px-3 py-2 text-xs text-white shadow-sm backdrop-blur">
            {mapStatus === 'ready' ? <Check className="h-3.5 w-3.5 text-[#C9FF5C]" /> : <AlertCircle className="h-3.5 w-3.5 text-amber-300" />}
            {mapStatus === 'ready' ? 'GOOGLE MAPS · LIVE' : '지도 키 연결 대기'}
          </div>
          {searchStatus === 'error' && <div className="absolute left-4 right-4 top-16 z-20 rounded-xl bg-white p-3 text-sm shadow-lg">Kakao 장소 검색을 사용할 수 없습니다. JavaScript 키와 등록 도메인을 확인해주세요.</div>}
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

      <p className="text-center text-xs text-muted-foreground">Google Maps로 지도를 표시하고 Kakao Local 검색 결과를 MoEasy 형식으로 정규화합니다.</p>
    </section>
  );
}

function ModeButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all [&>svg]:h-4 [&>svg]:w-4 ${active ? 'bg-[#101828] text-white shadow-sm' : 'text-muted-foreground'}`}>{icon}{children}</button>;
}

function FallbackMap() {
  return <div className="absolute inset-0 overflow-hidden bg-[#DCE4E8]"><div className="absolute inset-0 opacity-70 bg-[linear-gradient(28deg,transparent_46%,rgba(255,255,255,.9)_47%,rgba(255,255,255,.9)_52%,transparent_53%),linear-gradient(100deg,transparent_44%,rgba(255,255,255,.75)_45%,rgba(255,255,255,.75)_50%,transparent_51%)] bg-[size:150px_120px,190px_150px]"/><div className="absolute inset-x-0 top-[54%] h-7 -rotate-[7deg] border-y border-blue-300/50 bg-blue-200/70"/></div>;
}

function LocationCard({ item, compact = false }: { item?: MapItem; compact?: boolean }) {
  if (!item) return null;
  return <div className={`${compact ? 'border border-border bg-card/95 text-foreground shadow-lg backdrop-blur' : ''} rounded-xl p-4`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate font-semibold">{item.title}</h3>{item.source === 'kakao' && <span className="rounded-full bg-[#FEE500] px-2 py-0.5 text-[9px] font-semibold text-[#181600]">KAKAO</span>}</div><div className={`mt-2 space-y-1.5 text-xs ${compact || item.source === 'kakao' ? 'text-muted-foreground' : 'text-slate-400'}`}><p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" />{item.place}</p><p className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{item.meta}</p>{item.people && <p className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{item.people}</p>}</div></div>{item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white"><Navigation className="h-4 w-4" /></a> : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white"><Navigation className="h-4 w-4" /></span>}</div></div>;
}

const markerIcon = (selected: boolean, source: MapItem['source']) => {
  const fill = source === 'kakao' ? '#FEE500' : selected ? '#315EFB' : '#101828';
  const stroke = source === 'kakao' ? '#181600' : '#FFFFFF';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52"><path d="M22 51C19 44 5 34 5 21A17 17 0 1 1 39 21C39 34 25 44 22 51Z" fill="${fill}" stroke="white" stroke-width="3"/><circle cx="22" cy="21" r="7" fill="none" stroke="${stroke}" stroke-width="3"/></svg>`;
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
