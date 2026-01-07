import React, { useState, useEffect } from 'react';
import { X, Trash2, MessageSquare, MapPin, CheckCircle } from 'lucide-react'; 
import { db } from '../firebase'; 
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'; 
import ReviewForm from './ReviewForm'; 
import { getAstroRank } from '../utils/rankHelper'; 

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
                <button onClick={() => onDelete(review)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '4px' }}>
                    <Trash2 size={16} />
                </button>
            )}
        </div>
        <div style={{ fontSize: '14px', color: '#ddd', marginBottom: '10px', lineHeight: '1.4' }}>{review.reviewText}</div>
        <div style={{ display: 'flex', gap: '8px', fontSize: '11px', backgroundColor: '#333', padding: '6px 10px', borderRadius: '6px', width: 'fit-content' }}>
            <span style={{ color: '#FFD700' }}>😋 맛 {review.tasteRating}</span>
            <span style={{ width: '1px', height: '100%', backgroundColor: '#555' }}></span>
            <span style={{ color: '#34d399' }}>💰 가성비 {review.costRating}</span>
            {review.honorStars > 0 && (
                <>
                    <span style={{ width: '1px', height: '100%', backgroundColor: '#555' }}></span>
                    <span style={{ color: '#FFD700', fontWeight: 'bold' }}>💎 {review.honorStars}</span>
                </>
            )}
        </div>
    </div>
  );
};

// 🔴 메인 컴포넌트
const PlaceDetailSheet = ({ 
  place, user, stats, reviews = [], onClose, onMoveStart, onReviewSubmit, onReviewDelete 
}) => {
  
  // 내 리뷰가 있는지 여부를 저장하는 상태
  const [hasMyReview, setHasMyReview] = useState(false);

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
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1a1a1a', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '0', zIndex: 100, borderTop: '1px solid #333', boxShadow: '0 -4px 30px rgba(0,0,0,0.8)', maxHeight: '80%', overflowY: 'auto' }}>
      
      <div style={{ padding: '24px 24px 10px' }}>
        <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '12px' }}>
          {user && user.role === 'member' && (
            <button 
                onClick={() => onMoveStart(place)} 
                style={{ background: 'none', border: 'none', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
                <MapPin size={16} /> 위치 이동
            </button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888' }}><X size={24} /></button>
        </div>

        <span style={{ color: '#888', fontSize: '13px', marginBottom: '6px', display: 'block' }}>{place.location} • {place.category}</span>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '22px', fontWeight: 'bold' }}>{place.name}</h2>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <div style={{ flex: 1, backgroundColor: '#252525', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#aaa' }}>😋 맛 평균</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFD700' }}>
                    {stats.taste} <span style={{ fontSize: '10px', color: '#666' }}>/ 3</span>
                </div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#252525', padding: '10px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#aaa' }}>💰 가성비</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#34d399' }}>
                    {stats.cost} <span style={{ fontSize: '10px', color: '#666' }}>/ 3</span>
                </div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#252525', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid #FFD700' }}>
                <div style={{ fontSize: '11px', color: '#FFD700' }}>💎 누적 별</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>{stats.totalHonor}</div>
            </div>
        </div>

        {/* 🔥 리뷰 작성 칸 제어 로직 */}
        {user && user.role === 'member' ? (
            hasMyReview ? (
                // 1. 리뷰가 있으면: 안내 메시지
                <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', marginBottom: '24px', border: '1px solid #3b82f6', color: '#3b82f6', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <CheckCircle size={18} />
                    이미 평가를 완료하셨습니다!
                </div>
            ) : (
                // 2. 리뷰가 없으면: 작성 폼 표시
                <ReviewForm user={user} onSubmit={onReviewSubmit} />
            )
        ) : (
            <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#222', borderRadius: '12px', marginBottom: '24px', border: '1px dashed #444' }}>
                <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
                    {user ? "🚫 정회원만 평가를 남길 수 있습니다." : "🔒 로그인하면 리뷰를 남길 수 있습니다."}
                </p>
            </div>
        )}
      </div>

      <div style={{ backgroundColor: '#111', padding: '20px 24px 80px', minHeight: '300px' }}>
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