import React, { useEffect, useRef, useState } from 'react';
import { classifyLocation } from '../utils/locationHelper';

// 🔥 [NEW] 더 작고 세련된 디자인 (빨간색 바탕 + 흰색 점)
const CLEAN_PIN_IMAGE = "data:image/svg+xml;charset=utf-8,%3Csvg width='30' height='40' viewBox='0 0 30 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 40 15 40C15 40 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z' fill='%23FF3B30'/%3E%3Ccircle cx='15' cy='15' r='6' fill='white'/%3E%3C/svg%3E";

const CATEGORY_STYLES = {
  "한식": { color: "#FF6B6B" }, 
  "양식": { color: "#F06595" },
  "중식": { color: "#F03E3E" }, 
  "일식": { color: "#FAB005" }, 
  "분식": { color: "#FF922B" }, // 📍 [NEW]
  "패스트푸드": { color: "#339AF0" }, 
  "고기": { color: "#AE3EC9" }, 
  "술집": { color: "#40C057" }, 
  "카페": { color: "#15AABF" }, 
  "외국": { color: "#BE4BDB" }, 
  "기타": { color: "#868E96" }, 
  "default": { color: "#333333" } 
};

const CATEGORIES = ["전체", "한식", "양식", "중식", "일식", "분식", "패스트푸드", "고기", "술집", "카페"];

const MapContainer = ({ 
  places, 
  selectedPlace, 
  isAddMode, 
  isMoveMode, 
  onPlaceClick, 
  onMapClick, 
  tempMarkerPos, 
  moveTargetPos,
  mapFocus 
}) => {
  const mapRef = useRef(null);
  const overlaysRef = useRef([]); 
  const tempMarkerInstance = useRef(null);
  const moveMarkerInstance = useRef(null);
  const selectedMarkerInstance = useRef(null);
  const [catFilter, setCatFilter] = useState("전체");

  // 1. 지도 생성
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) return;
    const container = document.getElementById('map');
    const options = { center: new window.kakao.maps.LatLng(37.5619, 126.9352), level: 3 };
    const map = new window.kakao.maps.Map(container, options);
    mapRef.current = map;
  }, []); 

  // 📍 [NEW] mapFocus 변경 시에만 지도 이동/확대
  useEffect(() => {
    if (!mapRef.current || !mapFocus) return;
    
    const { lat, lng, level } = mapFocus;
    const moveLatLon = new window.kakao.maps.LatLng(lat, lng);
    
    mapRef.current.setCenter(moveLatLon);
    if (level) {
        setTimeout(() => {
            mapRef.current.setLevel(level, { animate: true });
        }, 50);
    }
  }, [mapFocus]);

  // 2. 선택된 장소에 핀 찍기 (지도 이동 로직 제거됨)
  useEffect(() => {
    if (!mapRef.current) return;
    
    // 기존 핀 청소
    if (selectedMarkerInstance.current) {
        selectedMarkerInstance.current.setMap(null);
        selectedMarkerInstance.current = null;
    }

    if (selectedPlace) {
        const lat = parseFloat(selectedPlace.lat);
        const lng = parseFloat(selectedPlace.lng);
        const moveLatLon = new window.kakao.maps.LatLng(lat, lng);
        
        // ❌ [삭제됨] 이동 후 확대 로직 제거 (mapFocus useEffect로 분리됨)

        // 📍 [디자인] 핀 찍기 로직은 유지
        const imageSize = new window.kakao.maps.Size(27, 36);  
        // 핀의 뾰족한 끝부분이 좌표에 오도록 중심점 설정 (가로 절반, 세로 끝)
        const imageOption = { offset: new window.kakao.maps.Point(13.5, 36) }; 
        
        const markerImage = new window.kakao.maps.MarkerImage(CLEAN_PIN_IMAGE, imageSize, imageOption);
        const marker = new window.kakao.maps.Marker({
            position: moveLatLon,
            image: markerImage,
            zIndex: 9999 // 다른 마커보다 무조건 위에
        });
        
        marker.setMap(mapRef.current);
        selectedMarkerInstance.current = marker;
    }
  }, [selectedPlace]);

  // 3. 지도 클릭 (빈 곳 클릭 시 선택 해제)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const handleMapClick = (mouseEvent) => {
      if (!isAddMode && !isMoveMode) {
        onPlaceClick(null); 
        return; 
      }
      const latlng = mouseEvent.latLng;
      const lat = latlng.getLat();
      const lng = latlng.getLng();
      const detectedZone = classifyLocation(lat, lng);
      onMapClick({ lat, lng, detectedZone });
    };

    window.kakao.maps.event.addListener(map, 'click', handleMapClick);
    return () => window.kakao.maps.event.removeListener(map, 'click', handleMapClick);
  }, [isAddMode, isMoveMode, onPlaceClick, onMapClick]); 

  // 4. 일반 마커(작은 점) 렌더링
  useEffect(() => {
    if (!mapRef.current) return;
    overlaysRef.current.forEach(overlay => overlay.setMap(null));
    overlaysRef.current = [];

    if (isAddMode || isMoveMode) return;

    // 🔥 [수정] 필터링 로직 개선 (카공 처리)
    let filteredPlaces = [];
    if (catFilter === "전체") {
        filteredPlaces = places;
    } else if (catFilter === "카공") {
        // 카테고리가 '카페'이면서 isStudyFriendly가 true인 곳
        filteredPlaces = places.filter(p => p.category === "카페" && p.isStudyFriendly === true);
    } else {
        filteredPlaces = places.filter(p => p.category === catFilter);
    }

    filteredPlaces.forEach((place) => {
      // 카공 필터일 때는 카공 색상 사용, 그 외에는 해당 카테고리 색상 사용
      const style = catFilter === "카공" 
          ? CATEGORY_STYLES["카공"] 
          : (CATEGORY_STYLES[place.category] || CATEGORY_STYLES["default"]);
      
      // 🔥 [수정] 카공 카페인 경우 책 이모지 사용, 그 외에는 색깔 점 사용
      let content = '';
      
      if (place.category === '카페' && place.isStudyFriendly) {
          content = `
            <div style="font-size: 24px; cursor: pointer; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5)); transform: translateY(-5px);" 
                 onclick="window.dispatchEvent(new CustomEvent('markerClick', { detail: '${place.id}' }))">
                📚
            </div>`;
      } else {
          content = `
            <div style="width: 12px; height: 12px; background-color: ${style.color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); cursor: pointer;" 
                 onclick="window.dispatchEvent(new CustomEvent('markerClick', { detail: '${place.id}' }))">
            </div>`;
      }
      
      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(place.lat, place.lng),
        content: content,
        yAnchor: 0.5,
        clickable: true
      });
      customOverlay.setMap(mapRef.current);
      overlaysRef.current.push(customOverlay);
    });
  }, [places, catFilter, isAddMode, isMoveMode]);

  // 5. 마커 클릭 리스너
  useEffect(() => {
    const handleMarkerClick = (e) => {
      if (isAddMode || isMoveMode) return; 
      const clickedPlace = places.find(p => p.id === e.detail);
      if (clickedPlace) onPlaceClick(clickedPlace);
    };
    window.addEventListener('markerClick', handleMarkerClick);
    return () => window.removeEventListener('markerClick', handleMarkerClick);
  }, [places, isAddMode, isMoveMode, onPlaceClick]);

  // 6. 추가/이동 시 임시 마커 (얘네는 기존 카카오 핀 사용)
  useEffect(() => {
    if (!mapRef.current) return;
    if (tempMarkerInstance.current) { tempMarkerInstance.current.setMap(null); tempMarkerInstance.current = null; }
    if (tempMarkerPos) {
       const imageSrc = "https://t1.daumcdn.net/mapjsapi/images/marker.png"; 
       const marker = new window.kakao.maps.Marker({ 
         position: new window.kakao.maps.LatLng(tempMarkerPos.lat, tempMarkerPos.lng), 
         image: new window.kakao.maps.MarkerImage(imageSrc, new window.kakao.maps.Size(29, 42), { offset: new window.kakao.maps.Point(15, 42) })
       });
       marker.setMap(mapRef.current);
       tempMarkerInstance.current = marker; 
    }
  }, [tempMarkerPos]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (moveMarkerInstance.current) { moveMarkerInstance.current.setMap(null); moveMarkerInstance.current = null; }
    if (moveTargetPos) {
       const imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png"; 
       const marker = new window.kakao.maps.Marker({ 
         position: new window.kakao.maps.LatLng(moveTargetPos.lat, moveTargetPos.lng), 
         image: new window.kakao.maps.MarkerImage(imageSrc, new window.kakao.maps.Size(31, 35), { offset: new window.kakao.maps.Point(15, 35) })
       });
       marker.setMap(mapRef.current);
       moveMarkerInstance.current = marker; 
    }
  }, [moveTargetPos]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div id="map" style={{ width: '100%', height: '100%' }}></div>
      {!isAddMode && !isMoveMode && (
        <div style={{ position: 'absolute', top: '80px', left: 0, right: 0, overflowX: 'auto', whiteSpace: 'nowrap', zIndex: 50, padding: '0 10px' }} className="hide-scrollbar">
          <style>{` .hide-scrollbar::-webkit-scrollbar { display: none; } `}</style>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              style={{ padding: '6px 12px', marginRight: '6px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                backgroundColor: catFilter === cat ? (CATEGORY_STYLES[cat]?.color || '#333') : 'rgba(255,255,255,0.95)', color: catFilter === cat ? '#fff' : '#444', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: CATEGORY_STYLES[cat]?.color || '#333', marginRight: '6px' }}></span>{cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
export default MapContainer;