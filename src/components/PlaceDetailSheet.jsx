import React, { useState, useEffect } from 'react';
import { X, Trash2, MessageSquare, MapPin, CheckCircle, Star } from 'lucide-react'; 
import { db } from '../firebase'; 
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'; 
import ReviewForm from './ReviewForm'; 
import { getAstroRank } from '../utils/rankHelper'; 

// 🔥 [수정] 이모지 매핑을 컴포넌트 밖으로 이동 (전역 상수)
const CATEGORY_EMOJIS = {
    "한식": "🍚", "양식": "🍝", "중식": "🥟", "일식": "🍣", 
    "분식": "🍢", "패스트푸드": "🍔", "고기": "🥩", "술집": "🍻", 
    "카페": "☕", "외국": "🌮", "기타": "🎸"
};

// 🟢 개별 리뷰 아이템
const ReviewItem = ({ review, currentUser, onDelete }) => {
  const [authorRank, setAuthorRank] = useState(null);

  useEffect(() => {
    const fetchAuthorInfo = async () => {
      try {
        const userRef = doc(db, "users", review.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setAuthorRank(getAstroRank(userData.reviewCount || 0));
        } else {
          setAuthorRank(getAstroRank(0));
        }
      } catch (e) { console.error(e); }
    };
    
    if (review.userId) fetchAuthorInfo();
  }, [review.userId]);

  const rank = authorRank || getAstroRank(0);

  return (
    <div style={{ backgroundColor: '#222', padding: '16px', borderRadius: '12px', border: '1px solid #333' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{review.userName}</span>
                    {authorRank && (
                        <span style={{ 
                            fontSize: '10px', fontWeight: 'bold', 
                            color: rank.color, border: `1px solid ${rank.color}`, 
                            padding: '1px 5px', borderRadius: '4px',
                            display: 'flex', alignItems: 'center', gap: '2px'
                        }}>
                            {rank.emoji} {rank.name.split(' ')[0]}
                        </span>
                    )}
                </div>
                <span style={{ fontSize: '11px', color: '#666' }}>
                    {review.createdAt?.seconds ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : '방금 전'}
                </span>
            </div>
            {/* 🔥 String() 변환으로 아이디 타입 불일치 방지 */}
            {currentUser && String(currentUser.id) === String(review.userId) && (
                <button onClick={() => onDelete(review.id)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '4px' }}>
                    <Trash2 size={16} />
                </button>
            )}
        </div>
        <div style={{ fontSize: '14px', color: '#ddd', marginBottom: '10px', lineHeight: '1.4' }}>{review.reviewText}</div>
        
        {/* 리뷰 별점 표시 (ReviewForm에서 rating, taste, cost 등을 받아온다고 가정) */}
        <div style={{ display: 'flex', gap: '8px', fontSize: '11px', backgroundColor: '#333', padding: '6px 10px', borderRadius: '6px', width: 'fit-content' }}>
             {/* 예시: 만약 review 객체에 tasteRating이 있다면 표시 */}
            {review.tasteRating && <span style={{ color: '#FFD700' }}>😋 맛 {review.tasteRating}</span>}
            {review.costRating && (
                <>
                    <span style={{ width: '1px', height: '100%', backgroundColor: '#555' }}></span>
                    <span style={{ color: '#34d399' }}>💰 가성비 {review.costRating}</span>
                </>
            )}
            {/* 명예점수(별)가 있다면 표시 */}
            {review.honorStars > 0 && (
                <>
                    <span style={{ width: '1px', height: '100%', backgroundColor: '#555' }}></span>
                    <span style={{ color: '#FFD700', fontWeight: 'bold' }}>💎 {review.honorStars}</span>
                </>
            )}
            {/* 단순 별점(rating)만 있는 경우 */}
            {!review.tasteRating && review.rating && (
                <span style={{ color: '#FFD700', fontWeight: 'bold' }}>⭐ {review.rating}</span>
            )}
        </div>
    </div>
  );
};

// 🔴 메인 컴포넌트
const PlaceDetailSheet = ({ 
  place, user, stats, reviews = [], onClose, onMoveStart, onReviewSubmit, onReviewDelete, onShowMap 
}) => {
  
  // 내 리뷰가 있는지 여부를 저장하는 상태
  const [hasMyReview, setHasMyReview] = useState(false);

  // 맛집찾기 탭 등에서 켰을 때 "지도에서 보기" 버튼 표시 여부
  const showMapButton = !!onShowMap;

  // 🔥 [핵심] reviews(목록)나 user가 바뀔 때마다 "내가 쓴 글 있나?" 감시
  useEffect(() => {
    if (!user || !place) {
        setHasMyReview(false);
        return;
    }

    const checkReviewStatus = async () => {
        // 1. 가장 빠른 방법: 현재 불러와진 reviews 목록에서 내 아이디 찾기
        const foundInList = reviews.some(r => String(r.userId) === String(user.id));
        
        if (foundInList) {
            setHasMyReview(true);
        } else {
            // 2. 목록에 없다면(혹시 로딩 덜 됐거나 잘렸을 때): DB에 직접 물어보기 (확실한 검증)
            try {
                const q = query(
                    collection(db, "places", place.id, "reviews"),
                    where("userId", "==", user.id) // 여기도 타입 주의 (저장할때 string이면 string)
                );
                const snapshot = await getDocs(q);
                setHasMyReview(!snapshot.empty); // 결과가 비어있지 않으면(있으면) true
            } catch (e) {
                console.error("리뷰 확인 중 에러:", e);
                setHasMyReview(false);
            }
        }
    };

    checkReviewStatus();
  }, [reviews, user, place]); // reviews 배열이 변하면(추가/삭제됨) 즉시 재실행됨!

  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1a1a1a', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '0', zIndex: 100, borderTop: '1px solid #333', boxShadow: '0 -4px 30px rgba(0,0,0,0.8)', maxHeight: '80%', height: '80%', overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      {/* 상단 고정 영역 (제목, 정보, 버튼) */}
      <div style={{ padding: '24px 24px 10px', flexShrink: 0 }}>
        
        {/* 닫기 및 이동 버튼 */}
        <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '12px' }}>
          {user && user.role === 'member' && (
            <button 
                onClick={() => onMoveStart(place)} 
                style={{ background: 'none', border: 'none', color: '#666', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer' }}
            >
                (위치 수정)
            </button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' }}>
            <span style={{ color: '#3b82f6', fontSize: '13px', display: 'inline-block', border: '1px solid #3b82f6', padding: '2px 6px', borderRadius: '4px', marginRight: '6px' }}>
                {CATEGORY_EMOJIS[place.category] || ""} {place.category}
            </span>
            {place.category === '카페' && place.isStudyFriendly && (
                <span style={{ color: '#34d399', fontSize: '13px', display: 'inline-block', border: '1px solid #34d399', padding: '2px 6px', borderRadius: '4px' }}>
                    📚 카공
                </span>
            )}
        </div>
        
        {/* 이름 & 위치보기 버튼 행 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'white', flex: 1 }}>{place.name}</h2>
            {showMapButton && (
                <button 
                    onClick={onShowMap}
                    style={{ 
                        background: 'none', border: '1px solid #444', borderRadius: '8px', 
                        padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px',
                        color: '#3b82f6', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                    }}
                >
                    <MapPin size={14} /> 위치확인
                </button>
            )}
        </div>

        <div style={{ fontSize: '14px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
            <MapPin size={14} /> {place.location}
        </div>
        
        {/* 통계 박스 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <div style={{ flex: 1, backgroundColor: '#252525', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>😋 맛 평균</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFD700' }}>
                    {stats.taste || '-'} <span style={{ fontSize: '10px', color: '#666' }}>/ 3</span>
                </div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#252525', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>💰 가성비</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#34d399' }}>
                    {stats.cost || '-'} <span style={{ fontSize: '10px', color: '#666' }}>/ 3</span>
                </div>
            </div>
            {/* 🔥 [수정] 명예점수 스타일 통일 (강조 테두리 제거) */}
            <div style={{ flex: 1, backgroundColor: '#252525', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>⭐ 받은 별</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>{stats.totalStars || 0}</div>
            </div>
        </div>
      </div>

      {/* 스크롤 영역 (리뷰 작성 폼 + 리뷰 목록) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 40px', backgroundColor: '#111' }}>
        
        {/* 🔥 리뷰 작성 칸 */}
        <div style={{ marginBottom: '30px' }}>
            {user && user.role === 'member' ? (
                hasMyReview ? (
                    <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid #3b82f6', color: '#3b82f6', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <CheckCircle size={18} />
                        이미 평가를 완료하셨습니다!
                    </div>
                ) : (
                    <ReviewForm user={user} onSubmit={onReviewSubmit} />
                )
            ) : (
                <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#222', borderRadius: '12px', border: '1px dashed #444' }}>
                    <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
                        {user ? "🚫 정회원만 평가를 남길 수 있습니다." : "🔒 로그인하면 리뷰를 남길 수 있습니다."}
                    </p>
                </div>
            )}
        </div>

        <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquare size={16} /> 최근 리뷰 ({reviews.length})
        </h3>

        {reviews.length === 0 ? (
            <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', padding: '20px' }}>아직 등록된 리뷰가 없습니다.</p>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reviews.map((review) => (
                    <ReviewItem 
                        key={review.id} 
                        review={review} 
                        currentUser={user} 
                        onDelete={onReviewDelete} 
                    />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default PlaceDetailSheet;