import React, { useState } from 'react';
import { Search, MapPin, ChevronRight, Star } from 'lucide-react';

const CATEGORY_COLORS = {
  "한식": "#FF6B6B", "양식": "#F06595", "중식": "#F03E3E",
  "일식": "#FAB005", "분식": "#FF922B", "패스트푸드": "#339AF0",
  "고기": "#AE3EC9", "술집": "#40C057", "카페": "#15AABF",
  "외국": "#BE4BDB", "기타": "#868E96"
};

const RestaurantSearch = ({ places, onPlaceClick }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // 🔍 검색 필터링 (이름, 카테고리, 위치)
  const filteredPlaces = places.filter(place => 
    place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    place.category.includes(searchTerm) ||
    place.location.includes(searchTerm)
  );

  return (
    <div style={{ padding: '20px 20px 80px', backgroundColor: '#111', minHeight: '100%', color: 'white' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Search size={20} /> 맛집 검색
      </h2>

      {/* 검색창 */}
      <div style={{ position: 'sticky', top: '0', backgroundColor: '#111', paddingBottom: '10px', zIndex: 10 }}>
        <div style={{ position: 'relative' }}>
            <input 
                type="text" 
                placeholder="식당 이름, 메뉴(한식..), 위치(정문..) 검색" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                    width: '100%', padding: '12px 16px 12px 40px', borderRadius: '12px', 
                    border: '1px solid #333', backgroundColor: '#222', color: 'white', fontSize: '14px', outline: 'none' 
                }}
            />
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
        </div>
      </div>

      {/* 검색 결과 리스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredPlaces.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#555', fontSize: '14px' }}>
                검색 결과가 없습니다. 🛰️
            </div>
        ) : (
            filteredPlaces.map(place => (
            <div 
                key={place.id} 
                onClick={() => onPlaceClick(place)} // 클릭 시 App.js로 신호 보냄
                style={{ 
                    backgroundColor: '#1e1e1e', borderRadius: '12px', padding: '16px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    border: '1px solid #333', cursor: 'pointer'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                        width: '40px', height: '40px', borderRadius: '50%', 
                        backgroundColor: CATEGORY_COLORS[place.category] || '#333',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', fontWeight: 'bold', color: '#fff'
                    }}>
                        {place.name.charAt(0)}
                    </div>
                    <div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '2px' }}>{place.name}</div>
                        <div style={{ fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: CATEGORY_COLORS[place.category] }}>{place.category}</span>
                            <span>•</span>
                            <span>{place.location}</span>
                            {place.totalHonorStars > 0 && (
                                <span style={{ color: '#FFD700', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    • <Star size={10} fill="#FFD700" /> {place.totalHonorStars}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <ChevronRight size={20} color="#555" />
            </div>
            ))
        )}
      </div>
    </div>
  );
};

export default RestaurantSearch;