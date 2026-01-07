import React, { useState, useMemo } from 'react'; 
import { Filter, Star, Dices, X, ChevronRight, RotateCw, MapPin, Settings2 } from 'lucide-react'; 

// 카테고리 (이모지 포함)
const CATEGORIES = ["🍚 한식", "🍝 양식", "🥟 중식", "🍣 일식", "🍢 분식", "🍔 패스트푸드", "🥩 고기", "🍻 술집", "☕ 카페", "🌮 외국", "🎸 기타"];
const LOCATIONS = ["🏛️ 정문", "🌲 서문", "🏡 연희", "🎨 연남", "🌸 이대", "🎓 학식", "🎸 기타"];

// 🔥 [NEW] 이모지 매핑 (리스트 표시용)
const CATEGORY_EMOJIS = {
    "한식": "🍚", "양식": "🍝", "중식": "🥟", "일식": "🍣", 
    "분식": "🍢", "패스트푸드": "🍔", "고기": "🥩", "술집": "🍻", 
    "카페": "☕", "외국": "🌮", "기타": "🎸"
};

const RestaurantFinder = ({ places, onPlaceClick }) => {
  // 🔥 [변경] 다중 선택을 위해 배열로 관리 (빈 배열이면 '전체' 의미)
  const [selectedLocs, setSelectedLocs] = useState([]);
  const [selectedCats, setSelectedCats] = useState([]);
  
  // 🔥 [NEW] 최소 점수 필터
  const [minTaste, setMinTaste] = useState(0);
  const [minCost, setMinCost] = useState(0);

  const [isStudyOnly, setIsStudyOnly] = useState(false);
  const [sortBy, setSortBy] = useState("taste"); 
  
  const [randomWinner, setRandomWinner] = useState(null);
  // const [isFilterOpen, setIsFilterOpen] = useState(false); // 🔥 [삭제] 항상 펼침

  // 토글 함수
  const toggleLoc = (loc) => {
    setSelectedLocs(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]);
  };
  const toggleCat = (cat) => {
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  // 실시간 필터링 (useMemo)
  const filteredData = useMemo(() => {
    let result = [...places];

    // 1. 장소 필터 (선택된 게 없으면 전체)
    if (selectedLocs.length > 0) {
        // p.location이 "정문"이고 selectedLocs에 "🏛️ 정문"이 있다면 포함되어야 함
        result = result.filter(p => selectedLocs.some(loc => loc.includes(p.location)));
    }

    // 2. 카테고리 필터
    if (selectedCats.length > 0) {
        // p.category가 "한식"이고 selectedCats에 "🍚 한식"이 있다면 포함되어야 함
        result = result.filter(p => selectedCats.some(cat => cat.includes(p.category)));
    }
    
    // 3. 점수 필터 (데이터는 0~3 범위이지만, 필터는 -2부터 시작 가능하게 함)
    // 데이터가 없는 경우(undefined/null) 0으로 취급되므로, -2로 설정하면 모든 데이터가 나옴
    if (minTaste > -3) result = result.filter(p => (p.avgTaste ?? 0) >= minTaste);
    if (minCost > -3) result = result.filter(p => (p.avgCost ?? 0) >= minCost);

    // 4. 카공 필터
    if (selectedCats.includes('카페') && isStudyOnly) {
      result = result.filter(p => p.isStudyFriendly === true);
    }

    // 5. 정렬 (내림차순)
    result.sort((a, b) => {
        if (sortBy === "honor") return (b.totalHonorStars || 0) - (a.totalHonorStars || 0);
        if (sortBy === "taste") return (b.avgTaste || 0) - (a.avgTaste || 0);
        if (sortBy === "cost") return (b.avgCost || 0) - (a.avgCost || 0);
        return 0;
    });

    return result;
  }, [places, selectedLocs, selectedCats, minTaste, minCost, isStudyOnly, sortBy]); 

  // 랜덤 뽑기
  const handleRandomPick = () => {
    if (filteredData.length === 0) {
        alert("현재 조건에 맞는 맛집이 없습니다! 필터를 조금 느슨하게 풀어보세요.");
        return;
    }
    
    // 랜덤 효과 (약간의 딜레이 후 선정)
    const pick = () => {
        const randomIndex = Math.floor(Math.random() * filteredData.length);
        setRandomWinner(filteredData[randomIndex]);
    };
    
    // 이미 결과창이 떠있으면 바로 바꿈 (다시 돌리기)
    if (randomWinner) {
        pick();
    } else {
        pick();
    }
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', height: '100%', overflowY: 'auto', backgroundColor: '#000', color: 'white', position: 'relative' }}>
      
      {/* 🎲 랜덤 결과 모달 */}
      {randomWinner && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div style={{ backgroundColor: '#1a1a1a', width: '100%', maxWidth: '320px', borderRadius: '24px', padding: '30px', border: '2px solid #FFD700', textAlign: 'center', boxShadow: '0 0 50px rgba(255, 215, 0, 0.2)', position: 'relative', animation: 'fadeIn 0.3s' }}>
                <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }`}</style>
                <button onClick={() => setRandomWinner(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X /></button>
                
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎉</div>
                <h3 style={{ color: '#FFD700', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>오늘의 추천 맛집</h3>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>{randomWinner.name}</h2>
                
                <div style={{ backgroundColor: '#252525', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
                    <div style={{ color: '#ccc', fontSize: '14px', marginBottom: '8px' }}>{randomWinner.category} / {randomWinner.location}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', fontSize: '14px', fontWeight: 'bold' }}>
                        <span style={{ color: '#FFD700' }}>⭐ {randomWinner.totalHonorStars}</span>
                        <span style={{ color: '#fff' }}>😋 {randomWinner.avgTaste ?? 0} <span style={{fontSize:'10px', color:'#666'}}>/3</span></span>
                        <span style={{ color: '#34d399' }}>💰 {randomWinner.avgCost ?? 0} <span style={{fontSize:'10px', color:'#666'}}>/3</span></span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={handleRandomPick} 
                        style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #444', backgroundColor: '#333', color: '#fff', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                    >
                        <RotateCw size={16} /> 다시 돌리기
                    </button>
                    <button 
                        onClick={() => { onPlaceClick(randomWinner); setRandomWinner(null); }} 
                        style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#FFD700', color: 'black', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
                    >
                        <MapPin size={16} /> 이동
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 🎛️ 필터 영역 (항상 노출, 컴팩트하게) */}
      <div style={{ backgroundColor: '#111', padding: '0 0 16px', marginBottom: '10px', borderBottom: '1px solid #222' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
             <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <Filter size={18} /> 맛집 찾기
             </h2>
             <span style={{ fontSize: '11px', color: '#666' }}>필터를 통해 원하는 맛집을 찾아보세요</span>
          </div>

          {/* 장소 & 카테고리 (가로 스크롤로 공간 절약) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {/* 장소 */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }} className="hide-scrollbar">
                  <button onClick={() => setSelectedLocs([])} style={{ flexShrink: 0, padding: '4px 10px', borderRadius: '14px', border: 'none', fontSize: '11px', fontWeight: 'bold', backgroundColor: selectedLocs.length === 0 ? '#3b82f6' : '#222', color: selectedLocs.length === 0 ? 'white' : '#666' }}>전체</button>
                  {LOCATIONS.map(loc => (
                      <button key={loc} onClick={() => toggleLoc(loc)} style={{ flexShrink: 0, padding: '4px 10px', borderRadius: '14px', border: 'none', fontSize: '11px', fontWeight: 'bold', backgroundColor: selectedLocs.includes(loc) ? '#3b82f6' : '#222', color: selectedLocs.includes(loc) ? 'white' : '#666' }}>{loc}</button>
                  ))}
              </div>
              {/* 카테고리 */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }} className="hide-scrollbar">
                  <button onClick={() => setSelectedCats([])} style={{ flexShrink: 0, padding: '4px 10px', borderRadius: '14px', border: 'none', fontSize: '11px', fontWeight: 'bold', backgroundColor: selectedCats.length === 0 ? '#FFD700' : '#222', color: selectedCats.length === 0 ? 'black' : '#666' }}>전체</button>
                  {CATEGORIES.map(cat => (
                      <button key={cat} onClick={() => toggleCat(cat)} style={{ flexShrink: 0, padding: '4px 10px', borderRadius: '14px', border: 'none', fontSize: '11px', fontWeight: 'bold', backgroundColor: selectedCats.includes(cat) ? 'rgba(255, 215, 0, 0.2)' : '#222', color: selectedCats.includes(cat) ? '#FFD700' : '#666' }}>{cat}</button>
                  ))}
              </div>
          </div>

          {/* 점수 슬라이더 (좌우 배치로 공간 절약) */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                      <span>😋 맛 {minTaste}이상</span>
                  </div>
                  <input type="range" min="-2" max="3" step="0.5" value={minTaste} onChange={(e) => setMinTaste(parseFloat(e.target.value))} style={{ width: '100%', height: '4px', accentColor: '#FFD700' }} />
              </div>
              <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                      <span>💰 가성비 {minCost}이상</span>
                  </div>
                  <input type="range" min="-2" max="3" step="0.5" value={minCost} onChange={(e) => setMinCost(parseFloat(e.target.value))} style={{ width: '100%', height: '4px', accentColor: '#34d399' }} />
              </div>
          </div>
      </div>

      {/* 옵션 바 (랜덤, 정렬) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <button onClick={handleRandomPick} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '12px', backgroundColor: '#7048e8', border: 'none', color: 'white', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(112, 72, 232, 0.4)' }}>
            <Dices size={14} /> 랜덤 추천 ({filteredData.length})
        </button>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ backgroundColor: '#222', color: '#ccc', border: 'none', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', outline: 'none' }}>
            <option value="taste">😋 맛 순</option>
            <option value="cost">💰 가성비 순</option>
            <option value="honor">🏆 별 순</option>
        </select>
      </div>

      {/* 리스트 출력 (컴팩트하게 수정) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filteredData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#444' }}>
                <Filter size={48} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
                <p style={{ fontSize: '13px' }}>조건에 맞는 맛집이 없어요.</p>
                <button onClick={() => { setSelectedLocs([]); setSelectedCats([]); setMinTaste(0); setMinCost(0); }} style={{ marginTop: '8px', background: 'none', border: 'none', color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' }}>
                    필터 초기화
                </button>
            </div>
        ) : (
            filteredData.map((place, index) => (
                <div key={place.id} 
                     onClick={() => onPlaceClick(place)} 
                     style={{ backgroundColor: '#1a1a1a', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #2a2a2a', cursor: 'pointer' }}>
                    
                    {/* 1. 등수 */}
                    <div style={{ width: '20px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: index < 3 ? '#FFD700' : '#555', fontStyle: 'italic' }}>
                        {index + 1}
                    </div>

                    {/* 2. 정보 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <span style={{ backgroundColor: '#2a2a2a', padding: '1px 4px', borderRadius: '3px', color: '#ccc' }}>
                                {CATEGORY_EMOJIS[place.category] || ""} {place.category}
                            </span>
                            <span>{place.location}</span>
                            {place.isStudyFriendly && <span style={{ color: '#34d399', fontWeight: 'bold' }}>📚 카공</span>}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{place.name}</div>
                    </div>

                    {/* 3. 점수판 (컴팩트 & /3 강조) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#222', padding: '6px 10px', borderRadius: '8px' }}>
                        
                        {/* 😋 맛 */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '34px' }}>
                            <span style={{ fontSize: '8px', color: sortBy === 'taste' ? '#FFD700' : '#888' }}>맛</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{place.avgTaste ?? '-'}</span>
                                <span style={{ fontSize: '9px', color: '#666', fontWeight: 'bold' }}>/3</span>
                            </div>
                        </div>

                        <div style={{ width: '1px', height: '14px', backgroundColor: '#333' }}></div>

                        {/* 💰 가성비 */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '34px' }}>
                            <span style={{ fontSize: '8px', color: sortBy === 'cost' ? '#34d399' : '#888' }}>가성비</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#34d399' }}>{place.avgCost ?? '-'}</span>
                                <span style={{ fontSize: '9px', color: '#666', fontWeight: 'bold' }}>/3</span>
                            </div>
                        </div>

                        {/* ⭐ 별 (있을 때만 표시하거나, 항상 표시하되 0이면 회색) */}
                        {place.totalHonorStars > 0 && (
                            <>
                                <div style={{ width: '1px', height: '14px', backgroundColor: '#333' }}></div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '16px' }}>
                                    <span style={{ fontSize: '8px', color: '#FFD700' }}>별</span>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#FFD700' }}>{place.totalHonorStars}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default RestaurantFinder;