import React, { useState, useRef, useEffect } from 'react';
import { LogIn, Search, X, HelpCircle, Star, MapPin } from 'lucide-react';
import { getAstroRank } from '../utils/rankHelper';

const Header = ({ user, onLogin, places = [], onPlaceSelect }) => {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  // 검색창 열리면 자동 포커스
  useEffect(() => {
    if (isSearchActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchActive]);

  // 🔍 검색 로직
  const handleSearchChange = (e) => {
    const text = e.target.value;
    setQuery(text);

    if (!text.trim()) {
      setResults([]);
      return;
    }

    const filtered = places.filter(p => {
      const name = p.name || ""; 
      const category = p.category || "";
      const location = p.location || "";
      const searchText = text.toLowerCase();

      return (
        name.toLowerCase().includes(searchText) || 
        category.includes(text) ||
        location.includes(text)
      );
    });

    // 별점순 정렬
    filtered.sort((a, b) => (b.totalHonorStars || 0) - (a.totalHonorStars || 0));
    setResults(filtered.slice(0, 5));
  };

  const handleResultClick = (place) => {
    setIsSearchActive(false);
    setQuery("");
    setResults([]);
    if (onPlaceSelect) {
        onPlaceSelect(place);
    }
  };

  const closeSearch = () => {
    setIsSearchActive(false);
    setQuery("");
    setResults([]);
  };

  const userRank = user ? getAstroRank(user.reviewCount || 0) : null;

  return (
    <>
      <div style={{ 
          position: 'absolute', top: 0, left: 0, right: 0, 
          zIndex: 9999, // 지도 요소들보다 위에
          padding: '0 16px', 
          background: 'rgba(0,0,0,0.8)', 
          backdropFilter: 'blur(10px)', 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          borderBottom: '1px solid #333',
          height: '60px',
          transition: 'all 0.3s ease'
      }}>
        
        {!isSearchActive ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 'bold', letterSpacing: '1px', color: '#fff', fontSize: '18px' }}>
                ASTROMAP
              </span>
              <button 
                onClick={() => setIsSearchActive(true)}
                style={{ background: 'none', border: 'none', color: '#fff', padding: '4px', cursor: 'pointer', display: 'flex' }}
              >
                <Search size={18} />
              </button>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              {user ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button 
                        onClick={() => alert("도움말: 지도를 클릭해 맛집을 등록하고, 별점을 남겨보세요! 🚀")} 
                        style={{ background: 'none', border: 'none', color: '#888', padding: 0, cursor: 'pointer', display: 'flex' }}
                      >
                        <HelpCircle size={16} />
                      </button>

                      {userRank && (
                          <span style={{ 
                              fontSize: '10px', 
                              fontWeight: 'bold', 
                              color: userRank.color, 
                              border: `1px solid ${userRank.color}`, 
                              padding: '2px 6px', 
                              borderRadius: '4px',
                              backgroundColor: `${userRank.color}15`, // 아주 연한 배경색
                              display: 'flex', alignItems: 'center', gap: '2px'
                          }} title={userRank.name}>
                              {userRank.emoji} {userRank.name.split(' ')[0]}
                          </span>
                      )}

                      <span style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>
                          {user.name}
                      </span>

                      <span style={{ fontSize: '11px', color: '#888' }}>
                          {user.studentInfo}
                      </span>
                  </div>
              ) : (
                  <button 
                      onClick={onLogin}
                      style={{ 
                          backgroundColor: '#FEE500', color: '#000', border: 'none', 
                          borderRadius: '6px', padding: '6px 12px', fontSize: '12px', 
                          fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' 
                      }}
                  >
                      <LogIn size={14} /> 로그인
                  </button>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', height: '100%' }}>
            <Search size={20} color="#3b82f6" />
            <input 
              ref={inputRef}
              type="text" 
              placeholder="식당 이름, 메뉴 검색..." 
              value={query}
              onChange={handleSearchChange}
              style={{ 
                  background: 'transparent', border: 'none', color: 'white', 
                  fontSize: '16px', flex: 1, outline: 'none', height: '100%'
              }}
            />
            <button onClick={closeSearch} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
            </button>
          </div>
        )}
      </div>

      {isSearchActive && results.length > 0 && (
          <div style={{ 
              position: 'absolute', top: '60px', left: 0, right: 0, 
              backgroundColor: 'rgba(20, 20, 20, 0.98)', borderBottom: '1px solid #333', 
              boxShadow: '0 4px 15px rgba(0,0,0,0.8)', zIndex: 9998, 
              backdropFilter: 'blur(5px)'
          }}>
              {results.map((place) => (
                  <div 
                    key={place.id} 
                    onClick={() => handleResultClick(place)}
                    style={{ 
                        padding: '14px 16px', 
                        borderBottom: '1px solid rgba(255,255,255,0.05)', 
                        color: 'white', 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        cursor: 'pointer'
                    }}
                  >
                      <div>
                          <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {place.name}
                              <span style={{ fontSize: '11px', color: '#888', border: '1px solid #444', padding: '1px 5px', borderRadius: '4px' }}>
                                  {place.category}
                              </span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={10} /> {place.location}
                          </div>
                      </div>
                      {place.totalHonorStars > 0 && (
                        <div style={{ textAlign: 'right', color: '#FFD700', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Star size={12} fill="#FFD700" /> {place.totalHonorStars}
                        </div>
                      )}
                  </div>
              ))}
          </div>
      )}
      
      {/* 검색 결과 없음 메시지 */}
      {isSearchActive && query && results.length === 0 && (
          <div style={{ 
              position: 'absolute', top: '60px', left: 0, right: 0, 
              padding: '20px', backgroundColor: 'rgba(20,20,20,0.95)', color: '#888', textAlign: 'center', fontSize: '14px',
              zIndex: 9998
          }}>
              검색 결과가 없습니다. 🛰️
          </div>
      )}
    </>
  );
};

export default Header;