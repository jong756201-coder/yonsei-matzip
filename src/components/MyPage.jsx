import React, { useEffect, useState } from 'react';
import { User, Star, Save, MessageSquare, Edit2, FileText, MessageCircle, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { 
    doc, updateDoc, collection, query, where, getDocs, 
    deleteDoc, increment, collectionGroup, getDoc 
} from 'firebase/firestore';

import { getAstroRank } from '../utils/rankHelper';

// 학적 정보 선택지
const DEGREES = ["학부", "석사", "박사"];
const GRADES = ["1", "2", "3", "4", "5이상"];

const MyPage = ({ user, setUser }) => {
  // 탭 상태: 'reviews' | 'posts' | 'comments'
  const [activeTab, setActiveTab] = useState('reviews');
  
  // 데이터 상태
  const [myReviews, setMyReviews] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [myComments, setMyComments] = useState([]);

  // 수정 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editDegree, setEditDegree] = useState("학부");
  const [editGrade, setEditGrade] = useState("1");

  // 초기 학적 정보 파싱
  useEffect(() => {
    if (user?.studentInfo) {
        const parts = user.studentInfo.split(' ');
        if (parts.length >= 2) {
            setEditDegree(parts[0]);
            setEditGrade(parts[1].replace('학년', ''));
        }
    }
  }, [user]);

  // 🔥 데이터 불러오기
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
        // 1. 나의 리뷰
        const rQuery = query(collection(db, "reviews"), where("userId", "==", user.id));
        const rSnap = await getDocs(rQuery);
        const rList = rSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        rList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setMyReviews(rList);

        // 2. 나의 게시글
        const pQuery = query(collection(db, "posts"), where("authorId", "==", user.id));
        const pSnap = await getDocs(pQuery);
        const pList = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        pList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setMyPosts(pList);

        // 3. 나의 댓글 (Collection Group Query)
        // 주의: 콘솔에서 색인 생성 링크가 뜨면 클릭 필요
        try {
            const cQuery = query(collectionGroup(db, 'comments'), where('authorId', '==', user.id));
            const cSnap = await getDocs(cQuery);
            const cList = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            cList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setMyComments(cList);
        } catch (e) {
            console.warn("댓글 로딩 실패 (색인 필요):", e);
        }
    };
    fetchData();
  }, [user]);

  // 정보 수정 저장
  const handleSaveInfo = async () => {
    if (!user) return;
    const newInfo = `${editDegree} ${editGrade}학년`;
    try {
        const userRef = doc(db, "users", user.id);
        await updateDoc(userRef, { studentInfo: newInfo });
        setUser({ ...user, studentInfo: newInfo });
        setIsEditing(false);
        alert("정보가 수정되었습니다.");
    } catch (e) { console.error(e); }
  };

  // 🔥 리뷰 삭제 로직 (점수 재계산 포함)
  const handleDeleteReview = async (review) => {
    if (!window.confirm("정말 리뷰를 삭제하시겠습니까? (별은 환불됩니다)")) return;

    try {
        // 1. 리뷰 삭제
        await deleteDoc(doc(db, "reviews", review.id));

        // 2. 유저 정보 복구
        const userRef = doc(db, "users", user.id);
        await updateDoc(userRef, { 
            remainingStars: increment(review.honorStars),
            reviewCount: increment(-1) 
        });
        
        // 3. 식당 명예 별 차감
        if (review.honorStars > 0) {
            await updateDoc(doc(db, "places", review.placeId), { 
                totalHonorStars: increment(-review.honorStars) 
            });
        }

        // 4. 🔥 식당 점수 재계산 (청소부 로직 내장)
        const q = query(collection(db, "reviews"), where("placeId", "==", review.placeId));
        const snapshot = await getDocs(q);
        const allReviews = snapshot.docs.map(d => d.data());
        
        if (allReviews.length === 0) {
            await updateDoc(doc(db, "places", review.placeId), { avgTaste: 0, avgCost: 0, reviewCount: 0 });
        } else {
            const tTaste = allReviews.reduce((sum, r) => sum + (r.tasteRating || 0), 0);
            const tCost = allReviews.reduce((sum, r) => sum + (r.costRating || 0), 0);
            await updateDoc(doc(db, "places", review.placeId), {
                avgTaste: parseFloat((tTaste / allReviews.length).toFixed(1)),
                avgCost: parseFloat((tCost / allReviews.length).toFixed(1)),
                reviewCount: allReviews.length
            });
        }

        // 5. 로컬 상태 업데이트
        setMyReviews(prev => prev.filter(r => r.id !== review.id));
        setUser(prev => ({ 
            ...prev, 
            remainingStars: prev.remainingStars + review.honorStars,
            reviewCount: prev.reviewCount - 1
        }));

        alert("리뷰가 삭제되었습니다.");

    } catch (e) {
        console.error("삭제 실패:", e);
        alert("오류가 발생했습니다.");
    }
  };

  if (!user) return <div style={{ padding:'40px', textAlign:'center', color:'#888' }}>로그인이 필요합니다.</div>;

  // 등급 계산
  const rank = getAstroRank(user.reviewCount || 0);
  // 다음 등급 정보 계산
  const nextRankInfo = getAstroRank(rank.next);
  const reviewsLeft = rank.next - (user.reviewCount || 0);

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', height: '100%', overflowY: 'auto', backgroundColor: '#000', color: 'white' }}>
      
      {/* 🏷️ 헤더 */}
      <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <User /> 내 정보
      </h2>

      {/* 🌌 프로필 카드 */}
      <div style={{ backgroundColor: '#1a1a1a', borderRadius: '20px', padding: '24px', border: '1px solid #333', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
              <div style={{ 
                  width: '64px', height: '64px', borderRadius: '50%', 
                  backgroundColor: '#222', border: `2px solid ${rank.color}`,
                  display: 'flex', justifyContent: 'center', alignItems: 'center', 
                  fontSize: '32px', boxShadow: `0 0 15px ${rank.color}40`
              }}>
                  {rank.emoji}
              </div>
              
              <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {user.nickname || user.name} 
                      <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#888', marginLeft: '6px' }}>회원님</span>
                  </div>
                  <div style={{ color: rank.color, fontSize: '13px', fontWeight: 'bold', display: 'inline-block', padding: '4px 8px', borderRadius: '4px', backgroundColor: `${rank.color}15` }}>
                      {rank.name}
                  </div>
              </div>
          </div>

          {/* 소속 정보 (수정 가능) */}
          <div style={{ backgroundColor: '#252525', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#aaa' }}>소속 정보</span>
                  <button onClick={isEditing ? handleSaveInfo : () => setIsEditing(true)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                      {isEditing ? <Save size={14} /> : <Edit2 size={14} />}
                      {isEditing ? "저장" : "수정"}
                  </button>
              </div>
              
              {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                          {DEGREES.map(d => (
                              <button key={d} onClick={() => setEditDegree(d)}
                                style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', fontSize: '12px', backgroundColor: editDegree === d ? '#3b82f6' : '#333', color: editDegree === d ? 'white' : '#888', cursor: 'pointer' }}>
                                {d}
                              </button>
                          ))}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                          {GRADES.map(g => (
                              <button key={g} onClick={() => setEditGrade(g)}
                                style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', fontSize: '12px', backgroundColor: editGrade === g ? '#3b82f6' : '#333', color: editGrade === g ? 'white' : '#888', cursor: 'pointer' }}>
                                {g}학년
                              </button>
                          ))}
                      </div>
                  </div>
              ) : (
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>
                      {user.studentInfo || "정보 없음"}
                  </div>
              )}
          </div>

          {/* 스탯 정보 */}
          <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, backgroundColor: '#252525', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '6px' }}>남은 별</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Star size={18} fill="#FFD700" /> {user.remainingStars}
                  </div>
              </div>
              <div style={{ flex: 1, backgroundColor: '#252525', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '6px' }}>리뷰 개수</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
                      {user.reviewCount || 0}
                  </div>
              </div>
          </div>
          
          {/* 다음 단계 안내 (수정됨) */}
          {rank.next !== Infinity && (
              <div style={{ marginTop: '20px' }}>
                  <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px', textAlign: 'center' }}>
                      다음 등급 <span style={{ color: nextRankInfo.color, fontWeight: 'bold' }}>{nextRankInfo.name.split(' ')[0]}</span> 까지 <span style={{ color: 'white', fontWeight: 'bold' }}>{reviewsLeft}개</span> 남았습니다!
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ 
                          width: `${Math.min(100, (user.reviewCount / rank.next) * 100)}%`, 
                          height: '100%', 
                          backgroundColor: rank.color,
                          transition: 'width 0.5s ease'
                      }}></div>
                  </div>
              </div>
          )}
      </div>

      {/* 🗂️ 탭 메뉴 */}
      <div style={{ display: 'flex', borderBottom: '1px solid #333', marginBottom: '20px' }}>
          <button onClick={() => setActiveTab('reviews')} style={{ flex: 1, padding: '12px', background: 'none', border: 'none', color: activeTab === 'reviews' ? 'white' : '#666', borderBottom: activeTab === 'reviews' ? '2px solid white' : 'none', fontWeight: 'bold', cursor: 'pointer' }}>나의 리뷰</button>
          <button onClick={() => setActiveTab('posts')} style={{ flex: 1, padding: '12px', background: 'none', border: 'none', color: activeTab === 'posts' ? 'white' : '#666', borderBottom: activeTab === 'posts' ? '2px solid white' : 'none', fontWeight: 'bold', cursor: 'pointer' }}>나의 게시글</button>
          <button onClick={() => setActiveTab('comments')} style={{ flex: 1, padding: '12px', background: 'none', border: 'none', color: activeTab === 'comments' ? 'white' : '#666', borderBottom: activeTab === 'comments' ? '2px solid white' : 'none', fontWeight: 'bold', cursor: 'pointer' }}>나의 댓글</button>
      </div>

      {/* 📝 콘텐츠 영역 */}
      <div>
          {/* 1. 나의 리뷰 */}
          {activeTab === 'reviews' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {myReviews.length === 0 ? <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>작성한 리뷰가 없습니다.</div> : 
                    myReviews.map((review) => (
                      <div key={review.id} style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '16px', border: '1px solid #333' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#fff' }}>{review.placeName}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ fontSize: '12px', color: '#666' }}>
                                      {review.createdAt?.seconds ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                                  </span>
                                  {/* 삭제 버튼 */}
                                  <button onClick={() => handleDeleteReview(review)} style={{ background: 'none', border: 'none', color: '#ff4d4d', padding: 0, cursor: 'pointer' }}>
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          </div>
                          <div style={{ fontSize: '14px', color: '#ccc', marginBottom: '12px', lineHeight: '1.5' }}>{review.reviewText}</div>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', backgroundColor: '#252525', padding: '8px 12px', borderRadius: '8px', width: 'fit-content' }}>
                              <span style={{ color: '#FFD700' }}>😋 {review.tasteRating}</span>
                              <span style={{ color: '#34d399' }}>💰 {review.costRating}</span>
                              {review.honorStars > 0 && <span style={{ color: '#FFD700', fontWeight: 'bold' }}>💎 {review.honorStars}</span>}
                          </div>
                      </div>
                  ))}
              </div>
          )}

          {/* 2. 나의 게시글 */}
          {activeTab === 'posts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {myPosts.length === 0 ? <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>작성한 게시글이 없습니다.</div> : 
                    myPosts.map((post) => (
                      <div key={post.id} style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '12px', border: '1px solid #333' }}>
                          <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '6px' }}>{post.title}</div>
                          <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '8px' }}>{post.content.slice(0, 50)}...</div>
                          <div style={{ fontSize: '12px', color: '#666', display: 'flex', gap: '8px' }}>
                              <span>👍 {post.likes || 0}</span>
                              <span>💬 {post.commentCount || 0}</span>
                              <span>{post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : '-'}</span>
                          </div>
                      </div>
                  ))}
              </div>
          )}

          {/* 3. 나의 댓글 */}
          {activeTab === 'comments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {myComments.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                          <p>작성한 댓글이 없습니다.</p>
                          <p style={{ fontSize: '11px', marginTop: '4px' }}>(만약 썼는데 안 보이면 색인 생성 대기중일 수 있습니다)</p>
                      </div>
                   ) : 
                    myComments.map((comment) => (
                      <div key={comment.id} style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '12px', border: '1px solid #333' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                              <MessageCircle size={14} color="#666" />
                              <span style={{ fontSize: '14px', color: '#ddd' }}>{comment.text}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                              {comment.createdAt?.seconds ? new Date(comment.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};

export default MyPage;