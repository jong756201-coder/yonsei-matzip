import React, { useState, useMemo } from 'react'; 
import { Filter, Star, Dices, X, ChevronRight } from 'lucide-react'; 

// 카테고리
const CATEGORIES = ["전체", "🍚 한식", "🍝 양식", "🥟 중식", "🍣 일식", "🍔 패스트푸드", "🥩 고기", "🍻 술집", "☕ 카페", "🌮 외국", "🎸 기타"];
const LOCATIONS = ["전체", "정문", "서문", "연희", "연남", "이대", "학식", "기타"];

const RestaurantFinder = ({ places, onPlaceClick }) => {
  const [locFilter, setLocFilter] = useState("전체");
  const [catFilter, setCatFilter] = useState("전체");
  const [isStudyOnly, setIsStudyOnly] = useState(false);
  
  // 🔥 [변경 1] 기본 정렬을 'taste'(맛 평가 순)으로 변경
  const [sortBy, setSortBy] = useState("taste"); 
  
  const [randomWinner, setRandomWinner] = useState(null);

  // 실시간 필터링 (useMemo)
  const filteredData = useMemo(() => {
    let result = [...places];

    // 1. 장소 필터
    if (locFilter !== "전체") result = result.filter(p => p.location === locFilter);

    // 2. 카테고리 필터
    if (catFilter !== "전체") {
        const pureCategory = catFilter.split(" ")[1] || catFilter; 
        result = result.filter(p => p.category === pureCategory);
    }
    
    // 3. 카공 필터
    if (catFilter.includes('카페') && isStudyOnly) {
      result = result.filter(p => p.isStudyFriendly === true);
    }

    // 4. 정렬 (내림차순)
    result.sort((a, b) => {
        if (sortBy === "honor") return (b.totalHonorStars || 0) - (a.totalHonorStars || 0);
        if (sortBy === "taste") return (b.avgTaste || 0) - (a.avgTaste || 0);
        if (sortBy === "cost") return (b.avgCost || 0) - (a.avgCost || 0);
        return 0;
    });

    return result;
  }, [places, locFilter, catFilter, isStudyOnly, sortBy]); 

  // 랜덤 뽑기
  const handleRandomPick = () => {
    if (filteredData.length === 0) {
        alert("현재 조건에 맞는 맛집이 없습니다!");
        return;
    }
    const randomIndex = Math.floor(Math.random() * filteredData.length);
    setRandomWinner(filteredData[randomIndex]);
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', height: '100%', overflowY: 'auto', backgroundColor: '#000', color: 'white', position: 'relative' }}>
      
      {/* 🎲 랜덤 결과 모달 */}
      {randomWinner && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div style={{ backgroundColor: '#1a1a1a', width: '100%', maxWidth: '320px', borderRadius: '24px', padding: '30px', border: '2px solid #FFD700', textAlign: 'center', boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)', position: 'relative' }}>
                <button onClick={() => setRandomWinner(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#666' }}><X /></button>
                
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎉</div>
                <h3 style={{ color: '#FFD700', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>오늘의 추천 맛집</h3>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>{randomWinner.name}</h2>
                
                <div style={{ backgroundColor: '#252525', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
                    <div style={{ color: '#ccc', fontSize: '14px', marginBottom: '5px' }}>{randomWinner.category} / {randomWinner.location}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '13px', fontWeight: 'bold' }}>
                        <span style={{ color: '#FFD700' }}>⭐ {randomWinner.totalHonorStars}</span>
                        <span style={{ color: '#fff' }}>😋 {randomWinner.avgTaste ?? 0}</span>
                        <span style={{ color: '#34d399' }}>💰 {randomWinner.avgCost ?? 0}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={handleRandomPick} 
                        style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #444', backgroundColor: 'transparent', color: '#ccc', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        다시 돌리기
                    </button>
                    <button 
                        onClick={() => { onPlaceClick(randomWinner); setRandomWinner(null); }} 
                        style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#FFD700', color: 'black', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
                    >
                        이동 <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 헤더 */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>🔎 맛집 찾기</h2>
        <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>조건에 맞는 맛집을 찾아보세요.</p>
      </div>

      {/* 장소 필터 */}
      <div style={{ marginBottom: '16px', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '5px', scrollbarWidth: 'none' }} className="hide-scrollbar">
        <style>{` .hide-scrollbar::-webkit-scrollbar { display: none; } `}</style>
        {LOCATIONS.map(loc => (
          <button key={loc} onClick={() => setLocFilter(loc)}
            style={{ padding: '8px 16px', marginRight: '8px', borderRadius: '20px', border: 'none', fontSize: '13px', fontWeight: 'bold',
              backgroundColor: locFilter === loc ? '#3b82f6' : '#222', color: locFilter === loc ? 'white' : '#888', transition: 'all 0.2s', cursor: 'pointer' }}>
            {loc}
          </button>
        ))}
      </div>

      {/* 카테고리 필터 */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => { setCatFilter(cat); if (!cat.includes('카페')) setIsStudyOnly(false); }}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid',
              borderColor: catFilter === cat ? '#FFD700' : '#333', backgroundColor: catFilter === cat ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
              color: catFilter === cat ? '#FFD700' : '#666', fontSize: '12px', transition: 'all 0.2s', cursor: 'pointer' }}>
            {cat}
          </button>
        ))}
      </div>

      {/* 옵션 및 정렬 바 + 랜덤 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', height: '34px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {catFilter.includes('카페') && (
            <div onClick={() => setIsStudyOnly(!isStudyOnly)} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px', backgroundColor: isStudyOnly ? 'rgba(52, 211, 153, 0.1)' : '#222', border: isStudyOnly ? '1px solid #34d399' : '1px solid #333' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isStudyOnly ? '#34d399' : '#555' }} />
                <span style={{ fontSize: '12px', color: isStudyOnly ? '#34d399' : '#888', fontWeight: 'bold' }}>카공</span>
            </div>
            )}
            
            <button 
                onClick={handleRandomPick}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', backgroundColor: '#7048e8', border: 'none', color: 'white', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 6px rgba(112, 72, 232, 0.4)' }}
            >
                <Dices size={14} /> 랜덤 추천
            </button>
        </div>

        {/* 🔥 [변경 2] 정렬 옵션 순서 및 이름 변경 */}
        <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)} 
            style={{ backgroundColor: '#222', color: 'white', border: '1px solid #444', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
        >
            <option value="taste">😋 맛 평가 순</option>
            <option value="cost">💰 가성비 순</option>
            <option value="honor">🏆 별 개수 순</option>
        </select>
      </div>

      {/* 리스트 출력 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#444' }}>
                <Filter size={48} style={{ margin: '0 auto 15px', display: 'block', opacity: 0.3 }} />
                <p>조건에 맞는 맛집이 없어요.</p>
            </div>
        ) : (
            filteredData.map((place, index) => (
                <div key={place.id} 
                     onClick={() => onPlaceClick(place)} 
                     style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #333', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                    
                    {/* 1. 등수 */}
                    <div style={{ width: '24px', textAlign: 'center', fontSize: '16px', fontWeight: 'bold', color: index < 3 ? '#FFD700' : '#555', fontStyle: 'italic' }}>
                        {index + 1}
                    </div>

                    {/* 2. 정보 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ backgroundColor: '#333', padding: '2px 6px', borderRadius: '4px', color: '#ccc' }}>{place.category}</span>
                            <span>{place.location}</span>
                            {place.isStudyFriendly && <span style={{ color: '#34d399', fontWeight: 'bold', fontSize: '10px' }}>📚 카공</span>}
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{place.name}</div>
                    </div>

                    {/* 3. 점수판 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#252525', padding: '8px 12px', borderRadius: '12px' }}>
                        
                        {/* 😋 맛 */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '24px' }}>
                            <span style={{ fontSize: '9px', color: sortBy === 'taste' ? '#FFD700' : '#aaa', marginBottom: '2px', fontWeight: sortBy === 'taste' ? 'bold' : 'normal' }}>맛</span>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{place.avgTaste ?? '-'}</span>
                        </div>

                        <div style={{ width: '1px', height: '20px', backgroundColor: '#444' }}></div>

                        {/* 💰 가성비 */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '24px' }}>
                            <span style={{ fontSize: '9px', color: sortBy === 'cost' ? '#34d399' : '#aaa', marginBottom: '2px', fontWeight: sortBy === 'cost' ? 'bold' : 'normal' }}>가성비</span>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#34d399' }}>{place.avgCost ?? '-'}</span>
                        </div>

                        <div style={{ width: '1px', height: '20px', backgroundColor: '#444' }}></div>

                        {/* ⭐ 별 */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '24px' }}>
                            <span style={{ fontSize: '9px', color: sortBy === 'honor' ? '#FFD700' : '#aaa', marginBottom: '2px', fontWeight: sortBy === 'honor' ? 'bold' : 'normal' }}>별</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFD700' }}>{place.totalHonorStars || 0}</span>
                            </div>
                        </div>

                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default RestaurantFinder;