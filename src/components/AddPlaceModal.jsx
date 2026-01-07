import React from 'react';
import { X } from 'lucide-react';

const CATEGORIES = ["🍚 한식", "🍝 양식", "🥟 중식", "🍣 일식","패스트푸드", "🥩 고기", "🍻 술집", "☕ 카페", "🌮 외국", "🎸 기타"];

const AddPlaceModal = ({ 
  user, newPlaceName, setNewPlaceName, newPlaceCategory, setNewPlaceCategory, 
  newPlaceLocation, setNewPlaceLocation, isStudyFriendly, setIsStudyFriendly, 
  onClose, onAdd, onLogin 
}) => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: '#1a1a1a', padding: '24px', borderRadius: '20px', width: '85%', maxWidth: '360px', border: '1px solid #333' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          {/* 🔥 텍스트 변경: 신규 관측 지점 등록 -> 식당 등록 */}
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', margin: 0 }}>📍 식당 등록</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888' }}><X /></button>
        </div>

        {!user ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ color: '#ccc', marginBottom: '16px' }}>로그인 후 등록할 수 있습니다.</p>
            <button onClick={onLogin} style={{ backgroundColor: '#FEE500', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>카카오 로그인</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* 위치 정보 (자동 입력됨) */}
            <div style={{ padding: '12px', backgroundColor: '#252525', borderRadius: '8px', fontSize: '14px', color: '#ccc' }}>
                위치: <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{newPlaceLocation}</span>
            </div>

            <input type="text" placeholder="식당 이름" value={newPlaceName} onChange={(e) => setNewPlaceName(e.target.value)} 
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#252525', color: 'white', outline: 'none' }} />

            {/* 카테고리 선택 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {CATEGORIES.map(cat => {
                   const pureCat = cat.split(" ")[1];
                   return (
                     <button key={cat} onClick={() => setNewPlaceCategory(pureCat)}
                       style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid',
                         borderColor: newPlaceCategory === pureCat ? '#3b82f6' : '#444', 
                         backgroundColor: newPlaceCategory === pureCat ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                         color: newPlaceCategory === pureCat ? '#3b82f6' : '#888', fontSize: '12px', cursor: 'pointer' }}>
                       {cat}
                     </button>
                   );
                })}
            </div>

            {/* 카페일 때만 카공 옵션 */}
            {newPlaceCategory === '카페' && (
               <div onClick={() => setIsStudyFriendly(!isStudyFriendly)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px', backgroundColor: '#252525', borderRadius: '8px' }}>
                 <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: isStudyFriendly ? 'none' : '1px solid #666', backgroundColor: isStudyFriendly ? '#34d399' : 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {isStudyFriendly && <div style={{ width: '8px', height: '8px', backgroundColor: '#000', borderRadius: '2px' }} />}
                 </div>
                 <span style={{ fontSize: '14px', color: isStudyFriendly ? '#34d399' : '#aaa' }}>📚 카공하기 좋은 곳인가요?</span>
               </div>
            )}

            <button onClick={onAdd} style={{ padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: '16px', marginTop: '8px', cursor: 'pointer' }}>
                등록하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddPlaceModal;