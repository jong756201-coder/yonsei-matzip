import React, { useEffect, useRef, useState } from 'react';
import { classifyLocation } from '../utils/locationHelper';

const CATEGORY_STYLES = {
  "한식": { color: "#ff6b6b" }, 
  "양식": { color: "#ff62faff" },
  "중식": { color: "#f32626ff" }, 
  "일식": { color: "#dedadaff" }, 
  "패스트푸드": { color: "#fe5500ff" }, 
  "고기": { color: "#ff922b" }, 
  "술집": { color: "#51cf66" }, 
  "카페": { color: "#22b8cf" }, 
  "외국": { color: "#fcc419" }, 
  "기타": { color: "#868e96" }, 
  "default": { color: "#333333" } 
};

const CATEGORIES = ["전체", "한식", "양식", "중식", "일식", "패스트푸드", "고기", "술집", "카페"];

const MapContainer = ({ 
  places, 
  isAddMode, 
  isMoveMode, 
  onPlaceClick, 
  onMapClick, 
  tempMarkerPos, 
  moveTargetPos 
}) => {
  const mapRef = useRef(null);
  const overlaysRef = useRef([]); 
  const tempMarkerInstance = useRef(null);
  const moveMarkerInstance = useRef(null);
  const [catFilter, setCatFilter] = useState("전체");

  // 1. 지도 생성
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) return;
    const container = document.getElementById('map');
    const options = { center: new window.kakao.maps.LatLng(37.5619, 126.9352), level: 3 };
    const map = new window.kakao.maps.Map(container, options);
    mapRef.current = map;
  }, []); 

  // 2. 🔥 [핵심 수정] 클릭 이벤트 (모드 체크 강화)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const handleMapClick = (mouseEvent) => {
      // 🔥 추가 모드도 아니고, 이동 모드도 아니면 -> 여기서 컷!
      if (!isAddMode && !isMoveMode) {
        onPlaceClick(null); // (선택된 장소가 있다면) 상세창 닫기
        return; // 좌표 전송 안 함!
      }

      const latlng = mouseEvent.latLng;
      const lat = latlng.getLat();
      const lng = latlng.getLng();
      const detectedZone = classifyLocation(lat, lng);

      // 모드가 켜져 있을 때만 좌표 전달
      onMapClick({ lat, lng, detectedZone });
    };

    window.kakao.maps.event.addListener(map, 'click', handleMapClick);
    return () => window.kakao.maps.event.removeListener(map, 'click', handleMapClick);
  }, [isAddMode, isMoveMode, onPlaceClick, onMapClick]); 

  // 3. 기존 마커 렌더링
  useEffect(() => {
    if (!mapRef.current) return;
    overlaysRef.current.forEach(overlay => overlay.setMap(null));
    overlaysRef.current = [];

    // 모드 켜져있으면 기존 마커 숨기기 (깔끔하게)
    if (isAddMode || isMoveMode) return;

    const filteredPlaces = catFilter === "전체" ? places : places.filter(p => p.category === catFilter);

    filteredPlaces.forEach((place) => {
      const style = CATEGORY_STYLES[place.category] || CATEGORY_STYLES["default"];
      const content = `
        <div style="width: 14px; height: 14px; background-color: ${style.color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.4); cursor: pointer;" 
             onclick="window.dispatchEvent(new CustomEvent('markerClick', { detail: '${place.id}' }))">
        </div>`;
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

  // 4. 기존 마커 클릭 리스너
  useEffect(() => {
    const handleMarkerClick = (e) => {
      if (isAddMode || isMoveMode) return; 
      const clickedPlace = places.find(p => p.id === e.detail);
      if (clickedPlace) onPlaceClick(clickedPlace);
    };
    window.addEventListener('markerClick', handleMarkerClick);
    return () => window.removeEventListener('markerClick', handleMarkerClick);
  }, [places, isAddMode, isMoveMode, onPlaceClick]);

  // 5. [장소 추가] 파란 핀
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

  // 6. [장소 이동] 빨간 핀
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
