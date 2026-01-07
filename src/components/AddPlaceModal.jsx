// src/components/AddPlaceModal.js
import React from 'react';
import { X } from 'lucide-react';

const AddPlaceModal = ({ 
  user, 
  newPlaceName, setNewPlaceName, 
  newPlaceCategory, setNewPlaceCategory,
  newPlaceLocation, setNewPlaceLocation,
  isStudyFriendly, setIsStudyFriendly,
  onClose, 
  onAdd,
  onLogin 
}) => {

  // 내부 UI 렌더링
  if (!user) {
    return (
      <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', backgroundColor: '#1a1a1a', borderRadius: '16px', padding: '24px', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.9)', border: '1px solid #333' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>📍 신규 맛집 등록</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888' }}><X size={20}/></button>
         </div>
         <div style={{ textAlign: 'center', padding: '10px' }}>
            <p style={{ color: '#aaa', marginBottom: '15px' }}>로그인이 필요한 기능입니다.</p>
            <button onClick={onLogin} style={{ padding: '12px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#FEE500', color: '#000', fontWeight: 'bold' }}>카카오 로그인</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', backgroundColor: '#1a1a1a', borderRadius: '16px', padding: '24px', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.9)', border: '1px solid #333' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>📍 신규 관측 지점 등록</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888' }}><X size={20}/></button>
       </div>
       
       {user.role === 'member' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="text" placeholder="식당 이름" value={newPlaceName} onChange={(e) => setNewPlaceName(e.target.value)} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#222', color: 'white' }} />
            
            <div style={{ display: 'flex', gap: '10px' }}>
                {/* 🔥 [핵심] 여기에 모든 카테고리를 다 넣었습니다! */}
                <select value={newPlaceCategory} onChange={(e) => setNewPlaceCategory(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#222', color: 'white' }}>
                    <option value="한식">🍚 한식</option>
                    <option value="양식">🍝 양식</option>
                    <option value="중식">🥟 중식</option>
                    <option value="일식">🍣 일식</option>
                    <option value="패스트푸드">🍔 패스트푸드</option>
                    <option value="고기">🥩 고기</option>
                    <option value="술집">🍻 술집</option>
                    <option value="카페">☕ 카페</option>
                    <option value="외국">🌮 외국</option>
                    <option value="기타">🎸 기타</option>
                </select>

                <select 
                    value={newPlaceLocation} 
                    onChange={(e) => setNewPlaceLocation(e.target.value)} 
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#222', color: 'white' }}
                >
                    <option value="정문">🏛️ 정문</option>
                    <option value="서문">🌲 서문</option>
                    <option value="연희">🏡 연희동</option>
                    <option value="연남">🎨 연남/서교</option>
                    <option value="이대">🌸 이대</option>
                    <option value="학식">🎓 학식</option>
                    <option value="기타">🎸 기타</option>
                </select>
            </div>

            {/* 카페일 때 카공 체크 */}
            {newPlaceCategory === '카페' && (
                <div onClick={() => setIsStudyFriendly(!isStudyFriendly)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: '#333', borderRadius: '8px', cursor: 'pointer' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: '2px solid #555', backgroundColor: isStudyFriendly ? '#34d399' : 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {isStudyFriendly && <span style={{ color: 'black', fontSize: '14px', fontWeight: 'bold' }}>✓</span>}
                    </div>
                    <span style={{ fontSize: '14px', color: '#ddd' }}>📚 카공하기 좋은 곳인가요?</span>
                </div>
            )}

            <button onClick={onAdd} style={{ marginTop: '10px', width: '100%', padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold' }}>등록하기</button>
          </div>
       ) : (
          <p style={{ color: '#888', textAlign: 'center', fontSize: '14px' }}>🚫 정회원만 등록 가능합니다.</p>
       )}
    </div>
  );
};

export default AddPlaceModal;