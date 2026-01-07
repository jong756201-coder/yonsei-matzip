import { useEffect, useState } from 'react';
import { Search, Plus, X, Map as MapIcon, User, MessageCircle, Check } from 'lucide-react'; 
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
  
  const [isAddMode, setIsAddMode] = useState(false);
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [placeToMove, setPlaceToMove] = useState(null);
  const [moveTargetPos, setMoveTargetPos] = useState(null);

  const { stats, reviews, submitReview, deleteReview } = useReviewLogic(selectedPlace, user, setUser);

  // 🔑 카카오 키 상수 선언 (실수 방지)
  const KAKAO_KEY = '828f5dfbdbe7b7cb988a36270ba02040';

  // 🛡️ 안전한 초기화 함수 (이미 되어있으면 건너뜀)
  const initKakao = () => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_KEY);
      console.log("Kakao Initialized ✅");
    }
  };

  // 1. 앱 시작 시: 카카오 SDK 로딩 대기 및 자동 로그인
  useEffect(() => {
    // 0.5초 간격으로 카카오 스크립트가 로드됐는지 체크 (네트워크가 느릴 경우 대비)
    const waitForKakao = setInterval(() => {
      if (window.Kakao) {
        initKakao();
        clearInterval(waitForKakao); // 로드되면 타이머 종료
      }
    }, 500);

    // 자동 로그인 로직
    const checkLoginStatus = async () => {
      const savedUserId = localStorage.getItem('userId');
      if (savedUserId) {
        try {
          const userRef = doc(db, "users", savedUserId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUser({ id: savedUserId, ...userSnap.data() });
          } else {
            localStorage.removeItem('userId');
          }
        } catch (e) {
          console.error("자동 로그인 확인 중 오류:", e);
        }
      }
    };
    checkLoginStatus();

    // 5초 뒤에도 못 찾으면 타이머 강제 종료 (메모리 누수 방지)
    setTimeout(() => clearInterval(waitForKakao), 5000);

    return () => clearInterval(waitForKakao);
  }, []);

  // 2. 로그인 버튼 클릭 핸들러
  const handleKakaoLogin = () => {
    // A. 스크립트 로드 확인
    if (!window.Kakao) {
      alert("카카오 기능이 아직 로드되지 않았습니다. 잠시 후 다시 시도하거나 새로고침 해주세요.");
      return;
    }
    
    // B. 초기화 재확인 (안전장치)
    initKakao();

    // C. 로그인 시도
    window.Kakao.Auth.login({
      success: (authObj) => {
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
              localStorage.setItem('userId', kakaoId); 
            } else {
              setPendingUser({ id: kakaoId, kakaoNickname: res.properties.nickname });
            }
          },
          fail: (err) => {
            console.error("사용자 정보 요청 실패:", err);
            alert("정보를 불러오는데 실패했습니다.");
          },
        });
      },
      fail: (err) => {
        console.error("로그인 실패:", err);
        // 토큰 에러 발생 시 사용자에게 인지시킴
        if (JSON.stringify(err).includes("limit exceeded")) {
           alert("⛔️ 잠시 로그인 제한이 걸렸습니다. 1시간 뒤에 다시 시도해주세요.");
        }
      },
    });
  };

  const handleSignupComplete = async (formData) => {
    if (!pendingUser) return;
    try {
        const newUser = {
            name: formData.name,            
            nickname: formData.name,        
            studentInfo: formData.studentInfo, 
            role: 'guest', 
            remainingStars: 10,             
            reviewCount: 0,                 
            createdAt: serverTimestamp()
        };
        
        await setDoc(doc(db, "users", pendingUser.id), newUser);
        
        setUser({ id: pendingUser.id, ...newUser });
        localStorage.setItem('userId', pendingUser.id);
        setPendingUser(null);
        alert(`환영합니다, ${formData.name}님! 가입 승인 대기 중입니다.`);
    } catch (e) {
        console.error("가입 실패:", e);
        alert("오류가 발생했습니다.");
    }
  };

  const handleAddPlace = async () => {
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
             onMapClick={(data) => { 
               if (isMoveMode) {
                   setMoveTargetPos({ lat: data.lat, lng: data.lng });
               } else if (isAddMode) {
                   setNewPlacePos({ lat: data.lat, lng: data.lng });
                   setNewPlaceLocation(data.detectedZone);
                   setSelectedPlace(null);
               } else {
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