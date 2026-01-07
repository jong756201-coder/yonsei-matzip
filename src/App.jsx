import { useEffect, useState } from 'react';
import { Search, Plus, X, Map as MapIcon, User, MessageCircle, MapPin, Check } from 'lucide-react'; 
import { db } from './firebase'; 
import { doc, getDoc, setDoc, addDoc, updateDoc, collection, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore'; 

import Header from './components/Header';
import PlaceDetailSheet from './components/PlaceDetailSheet';
import RestaurantFinder from './components/RestaurantFinder'; 
import AddPlaceModal from './components/AddPlaceModal'; 
import MapContainer from './components/MapContainer';
import MyPage from './components/MyPage';
import SignupModal from './components/SignupModal'; 
import Community from './components/Community'; 
import { useReviewLogic } from './hooks/useReviewLogic';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('map'); 
  const [places, setPlaces] = useState([]); 
  const [selectedPlace, setSelectedPlace] = useState(null); 
  const [pendingUser, setPendingUser] = useState(null); 
  const [newPlacePos, setNewPlacePos] = useState(null); 
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceCategory, setNewPlaceCategory] = useState("한식");
  const [newPlaceLocation, setNewPlaceLocation] = useState("정문");
  const [isStudyFriendly, setIsStudyFriendly] = useState(false);
  
  // 모드 상태
  const [isAddMode, setIsAddMode] = useState(false);
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [placeToMove, setPlaceToMove] = useState(null);
  const [moveTargetPos, setMoveTargetPos] = useState(null);

  const { stats, reviews, submitReview, deleteReview } = useReviewLogic(selectedPlace, user, setUser);

  const toggleAddMode = () => {
    setIsAddMode(!isAddMode);
    setNewPlacePos(null);
    setSelectedPlace(null);
    setIsMoveMode(false);
    setMoveTargetPos(null);
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSelectedPlace(null);
    setIsAddMode(false);
    setNewPlacePos(null);
    setIsMoveMode(false);
    setMoveTargetPos(null);
  };

  const handleKakaoLogin = () => { /* ... 기존 로그인 코드 ... */ 
      if (!window.Kakao || !window.Kakao.isInitialized()) {
      window.Kakao && window.Kakao.init('828f5dfbdbe7b7cb988a36270ba02040');
    }
    window.Kakao.Auth.login({
      success: async (authObj) => {
        window.Kakao.API.request({
          url: '/v2/user/me',
          success: async (res) => {
            const kakaoId = res.id.toString();
            const userRef = doc(db, "users", kakaoId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const userData = userSnap.data();
              if (userData.remainingStars === undefined) {
                  await updateDoc(userRef, { remainingStars: 10 });
                  userData.remainingStars = 10;
              }
              setUser({ id: kakaoId, ...userData });
            } else {
              setPendingUser({ id: kakaoId, kakaoNickname: res.properties.nickname });
            }
          },
          fail: (err) => console.error(err),
        });
      },
      fail: (err) => console.error(err),
    });
  };

  // === 회원가입 완료 핸들러 (App.js 내부) ===
  const handleSignupComplete = async (formData) => {
    if (!pendingUser) return;
    try {
        // 🔥 Firebase로 전송될 데이터 객체
        const newUser = {
            name: formData.name,            // 입력받은 이름
            nickname: formData.name,        // 기존 로직 호환성을 위해 닉네임 필드에도 이름 저장
            studentInfo: formData.studentInfo, // "학부 2학년" 형태의 문자열
            role: 'member',                 // 정회원 권한 부여
            remainingStars: 10,             // 기본 별 지급
            reviewCount: 0,                 
            createdAt: serverTimestamp()
        };
        
        // 🚀 여기가 바로 Firebase DB에 저장하는 코드입니다!
        await setDoc(doc(db, "users", pendingUser.id), newUser);
        
        // 로컬 상태 업데이트 (로그인 처리)
        setUser({ id: pendingUser.id, ...newUser });
        setPendingUser(null);
        alert(`환영합니다, ${formData.name} 회원님! 🚀`);
    } catch (e) {
        console.error("가입 실패:", e);
        alert("오류가 발생했습니다.");
    }
  };

  const handleAddPlace = async () => { /* ... 기존 추가 코드 ... */ 
      if (!user) return alert("로그인이 필요한 기능입니다.");
    if (user.role !== 'member') return alert("정회원만 가능합니다.");
    if (!newPlaceName) return alert("식당 이름을 입력해주세요.");

    try {
      await addDoc(collection(db, "places"), {
        name: newPlaceName, 
        category: newPlaceCategory, 
        location: newPlaceLocation, 
        lat: newPlacePos.lat, 
        lng: newPlacePos.lng, 
        creatorId: user.id, 
        creatorName: user.nickname || user.name, 
        totalHonorStars: 0,
        isStudyFriendly: newPlaceCategory === '카페' ? isStudyFriendly : false, 
        createdAt: serverTimestamp()
      });
      alert(`✅ 등록 완료!`);
      setIsAddMode(false);
      setNewPlacePos(null); 
      setNewPlaceName("");
      setIsStudyFriendly(false); 
    } catch (error) { console.error(error); alert("오류 발생"); }
  };

  const handleStartMove = (place) => {
      setPlaceToMove(place);
      setSelectedPlace(null); 
      setIsMoveMode(true); 
      setMoveTargetPos(null);
      setIsAddMode(false); 
      setActiveTab('map'); 
  };

  const handleConfirmMove = async () => {
      if (!placeToMove || !moveTargetPos) return;
      
      const confirmMove = window.confirm(`'${placeToMove.name}' 위치를 여기로 옮기시겠습니까?`);
      if (confirmMove) {
          try {
              const placeRef = doc(db, "places", placeToMove.id);
              await updateDoc(placeRef, { lat: moveTargetPos.lat, lng: moveTargetPos.lng });
              alert("위치가 수정되었습니다! 🛰️");
          } catch (e) {
              console.error(e);
              alert("위치 수정 실패");
          } finally {
              setIsMoveMode(false);
              setPlaceToMove(null);
              setMoveTargetPos(null);
          }
      }
  };

  useEffect(() => {
    const q = query(collection(db, "places"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const placeList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlaces(placeList);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#000', color: 'white', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      
      {pendingUser && <SignupModal kakaoProfile={pendingUser} onComplete={handleSignupComplete} />}
      {activeTab === 'map' && <Header user={user} onLogin={handleKakaoLogin} />}

      <div style={{ flex: 1, position: 'relative', width: '100%', overflow: 'hidden' }}>
        
        <div style={{ width: '100%', height: '100%', display: activeTab === 'map' ? 'block' : 'none' }}>
           <MapContainer 
             places={places} 
             isAddMode={isAddMode}
             isMoveMode={isMoveMode}
             onPlaceClick={setSelectedPlace}
             tempMarkerPos={newPlacePos} 
             moveTargetPos={moveTargetPos}
             
             // 🔥 [여기가 중요] 조건문이 App.js로 왔습니다!
             onMapClick={(data) => { 
               if (isMoveMode) {
                   console.log("이동 모드 클릭:", data);
                   setMoveTargetPos({ lat: data.lat, lng: data.lng });
               } else if (isAddMode) {
                   console.log("추가 모드 클릭:", data);
                   setNewPlacePos({ lat: data.lat, lng: data.lng });
                   setNewPlaceLocation(data.detectedZone);
                   setSelectedPlace(null);
               } else {
                   console.log("일반 모드 클릭 (상세창 닫기)");
                   setSelectedPlace(null);
               }
             }}
           />
        </div>
        
        {isAddMode && activeTab === 'map' && !newPlacePos && (
            <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(59, 130, 246, 0.9)', padding: '10px 20px', borderRadius: '20px', zIndex: 100, boxShadow: '0 4px 10px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>📍 등록할 위치를 선택하세요</span>
                <button onClick={toggleAddMode} style={{ background: 'none', border: 'none', color: 'white', display: 'flex' }}><X size={16}/></button>
            </div>
        )}

        {isMoveMode && activeTab === 'map' && (
            <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', zIndex: 100 }}>
                <div style={{ backgroundColor: 'rgba(255, 171, 0, 0.95)', padding: '10px 20px', borderRadius: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'black' }}>
                        {moveTargetPos ? "이 위치로 변경할까요?" : "새로운 위치를 찍어주세요"}
                    </span>
                    <button onClick={() => { setIsMoveMode(false); setPlaceToMove(null); setMoveTargetPos(null); }} style={{ background: 'none', border: 'none', color: 'black', display: 'flex' }}><X size={16}/></button>
                </div>
                {moveTargetPos && (
                    <button onClick={handleConfirmMove} style={{ backgroundColor: '#fff', color: 'black', padding: '12px 24px', borderRadius: '30px', border: '2px solid #FFD700', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', cursor: 'pointer' }}>
                        <Check size={18} color="#0ca678" /> 위치 변경하기
                    </button>
                )}
            </div>
        )}

        {!isAddMode && !isMoveMode && activeTab === 'map' && !selectedPlace && !newPlacePos && (
            <button onClick={toggleAddMode} style={{ position: 'absolute', bottom: '30px', right: '20px', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                <Plus size={28} strokeWidth={3} />
            </button>
        )}

        {newPlacePos && activeTab === 'map' && (
           <AddPlaceModal user={user} newPlaceName={newPlaceName} setNewPlaceName={setNewPlaceName} newPlaceCategory={newPlaceCategory} setNewPlaceCategory={setNewPlaceCategory} newPlaceLocation={newPlaceLocation} setNewPlaceLocation={setNewPlaceLocation} isStudyFriendly={isStudyFriendly} setIsStudyFriendly={setIsStudyFriendly} onClose={() => { setNewPlacePos(null); setIsAddMode(false); }} onAdd={handleAddPlace} onLogin={handleKakaoLogin} />
        )}

        {selectedPlace && !newPlacePos && (activeTab === 'map' || activeTab === 'find') && (
            <PlaceDetailSheet place={selectedPlace} user={user} stats={stats} reviews={reviews} onClose={() => setSelectedPlace(null)} onMoveStart={handleStartMove} onReviewSubmit={submitReview} onReviewDelete={deleteReview} />
        )}

        {activeTab === 'find' && <RestaurantFinder places={places} onPlaceClick={setSelectedPlace} />}
        {activeTab === 'community' && <Community user={user} />}
        {activeTab === 'mypage' && <MyPage user={user} setUser={setUser} />}
      </div>

      <div style={{ height: '70px', flexShrink: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#000', borderTop: '1px solid #222', paddingBottom: '10px', zIndex: 200 }}>
        <button onClick={() => handleTabChange('map')} style={{ background: 'none', border: 'none', color: activeTab === 'map' ? '#fff' : '#444', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><MapIcon size={24} strokeWidth={activeTab === 'map' ? 3 : 2} /><span style={{ fontSize: '10px', fontWeight: activeTab === 'map' ? 'bold' : 'normal' }}>지도</span></button>
        <button onClick={() => handleTabChange('find')} style={{ background: 'none', border: 'none', color: activeTab === 'find' ? '#fff' : '#444', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><Search size={24} strokeWidth={activeTab === 'find' ? 3 : 2} /><span style={{ fontSize: '10px', fontWeight: activeTab === 'find' ? 'bold' : 'normal' }}>맛집찾기</span></button>
        <button onClick={() => handleTabChange('community')} style={{ background: 'none', border: 'none', color: activeTab === 'community' ? '#fff' : '#444', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><MessageCircle size={24} strokeWidth={activeTab === 'community' ? 3 : 2} /><span style={{ fontSize: '10px', fontWeight: activeTab === 'community' ? 'bold' : 'normal' }}>커뮤니티</span></button>
        <button onClick={() => handleTabChange('mypage')} style={{ background: 'none', border: 'none', color: activeTab === 'mypage' ? '#fff' : '#444', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><User size={24} strokeWidth={activeTab === 'mypage' ? 3 : 2} /><span style={{ fontSize: '10px', fontWeight: activeTab === 'mypage' ? 'bold' : 'normal' }}>내정보</span></button>
      </div>
    </div>
  );
}

export default App;