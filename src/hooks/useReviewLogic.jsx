import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { 
  doc, setDoc, deleteDoc, updateDoc, increment, 
  collection, query, where, getDocs, serverTimestamp, getDoc 
} from 'firebase/firestore';

export const useReviewLogic = (selectedPlace, user, setUser) => {
  const [stats, setStats] = useState({ taste: "0.0", cost: "0.0", count: 0, totalHonor: 0 });
  const [reviews, setReviews] = useState([]);

  // ✅ 1. [청소부 함수] DB의 상태를 완벽하게 재계산해서 덮어씌움
  // 이 함수는 리뷰 추가/삭제가 끝난 후 무조건 실행됨.
  const recalculatePlaceStats = async (placeId) => {
    try {
      // A. 해당 장소의 모든 리뷰를 긁어옴
      const q = query(collection(db, "reviews"), where("placeId", "==", placeId));
      const snapshot = await getDocs(q);
      const allReviews = snapshot.docs.map(doc => doc.data());

      // B. 리뷰가 하나도 없으면 0으로 초기화 (꼬임 방지)
      if (allReviews.length === 0) {
        await updateDoc(doc(db, "places", placeId), {
          avgTaste: 0,
          avgCost: 0,
          reviewCount: 0,
          // totalHonorStars는 increment로 관리하므로 굳이 건드리지 않음 (혹은 여기서 재계산 가능)
        });
        return { taste: "0.0", cost: "0.0", count: 0 };
      }

      // C. 처음부터 다시 계산 (전수 조사)
      const totalTaste = allReviews.reduce((sum, r) => sum + (r.tasteRating || 0), 0);
      const totalCost = allReviews.reduce((sum, r) => sum + (r.costRating || 0), 0);
      
      const avgTaste = (totalTaste / allReviews.length).toFixed(1); // 소수점 1자리
      const avgCost = (totalCost / allReviews.length).toFixed(1);
      const count = allReviews.length;

      // D. DB에 덮어쓰기 (무조건 이 값이 정답임)
      await updateDoc(doc(db, "places", placeId), {
        avgTaste: parseFloat(avgTaste),
        avgCost: parseFloat(avgCost),
        reviewCount: count
      });

      console.log(`✅ [${placeId}] 데이터 무결성 검사 완료: ${count}개 리뷰`);
      return { taste: avgTaste, cost: avgCost, count: count };

    } catch (e) {
      console.error("❌ 재계산 중 오류 발생:", e);
      return null;
    }
  };

  // ✅ 2. 화면에 보여줄 데이터 가져오기
  const fetchStatsAndReviews = useCallback(async () => {
    if (!selectedPlace) {
        setReviews([]);
        setStats({ taste: "0.0", cost: "0.0", count: 0, totalHonor: 0 });
        return;
    }

    // 로딩 중 잔상 제거
    setReviews([]); 
    setStats({ taste: "0.0", cost: "0.0", count: 0, totalHonor: 0 });

    try {
      // 리뷰 가져오기
      const q = query(collection(db, "reviews"), where("placeId", "==", selectedPlace.id));
      const querySnapshot = await getDocs(q);
      
      let fetchedReviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); 
      
      // 최신순 정렬 (JS 처리)
      fetchedReviews.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setReviews(fetchedReviews);

      // 로컬 통계 계산
      if (fetchedReviews.length > 0) {
        const totalTaste = fetchedReviews.reduce((sum, r) => sum + (r.tasteRating || 0), 0);
        const totalCost = fetchedReviews.reduce((sum, r) => sum + (r.costRating || 0), 0);
        const totalHonor = fetchedReviews.reduce((sum, r) => sum + (r.honorStars || 0), 0); // 로컬 표시용 누적
        
        setStats({
          taste: (totalTaste / fetchedReviews.length).toFixed(1),
          cost: (totalCost / fetchedReviews.length).toFixed(1),
          totalHonor: totalHonor, // 참고: 실제 DB의 totalHonorStars와는 다를 수 있음 (여기선 리뷰들의 합)
          count: fetchedReviews.length
        });
      } else {
        setStats({ taste: "0.0", cost: "0.0", count: 0, totalHonor: 0 });
      }

    } catch (e) {
      console.error("데이터 로드 실패:", e);
    }
  }, [selectedPlace]);

  // ✅ 3. 리뷰 제출 (Transaction 개념 적용)
  const submitReview = async (data) => {
    if (!user || !selectedPlace) return;
    
    // 별 하사 로직
    let finalHonorStars = 0;
    if (data.tasteRating === 3) finalHonorStars = data.honorStarsToGive;
    if (finalHonorStars > 0 && data.honorStarsToGive > user.remainingStars) {
        return alert(`보유한 별이 부족합니다! (보유: ${user.remainingStars})`);
    }

    try {
      const reviewId = `${selectedPlace.id}_${user.id}_${Date.now()}`; 
      
      const newReviewData = {
        userId: user.id,
        userName: user.nickname || user.name, // 닉네임 우선
        placeId: selectedPlace.id,
        placeName: selectedPlace.name,
        tasteRating: data.tasteRating,
        costRating: data.costRating,
        reviewText: data.reviewText,
        honorStars: finalHonorStars,
        createdAt: serverTimestamp() 
      };

      // --- [STEP 1] 리뷰 저장 ---
      await setDoc(doc(db, "reviews", reviewId), newReviewData);

      // --- [STEP 2] 유저 정보 업데이트 (별 차감, 리뷰수 증가) ---
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, { 
          remainingStars: increment(-finalHonorStars),
          reviewCount: increment(1) 
      });
      // 로컬 유저 상태 즉시 반영 (UI 반응성)
      setUser(prev => ({ 
          ...prev, 
          remainingStars: prev.remainingStars - finalHonorStars,
          reviewCount: (prev.reviewCount || 0) + 1
      }));

      // --- [STEP 3] 식당 명예 별 누적 ---
      if (finalHonorStars > 0) {
          const placeRef = doc(db, "places", selectedPlace.id);
          await updateDoc(placeRef, { totalHonorStars: increment(finalHonorStars) });
      }

      // --- [STEP 4] 🔥 식당 평점/개수 재계산 (청소부 호출) ---
      // 여기가 핵심입니다. 위에서 뭘 더하든 빼든 상관없이, 여기서 다시 세서 덮어씁니다.
      await recalculatePlaceStats(selectedPlace.id);

      alert("리뷰가 등록되었습니다!");
      
      // 화면 갱신
      fetchStatsAndReviews();

    } catch (error) {
      console.error("저장 실패:", error);
      alert("오류가 발생했습니다.");
    }
  };

  // ✅ 4. 리뷰 삭제
  const deleteReview = async (review) => {
    if (!window.confirm("삭제하시겠습니까? (사용한 별은 환불됩니다)")) return;

    try {
        // --- [STEP 1] 리뷰 삭제 ---
        await deleteDoc(doc(db, "reviews", review.id));

        // --- [STEP 2] 유저 정보 복구 (별 환불, 리뷰수 감소) ---
        const userRef = doc(db, "users", user.id);
        await updateDoc(userRef, { 
            remainingStars: increment(review.honorStars),
            reviewCount: increment(-1) 
        });
        setUser(prev => ({ 
            ...prev, 
            remainingStars: prev.remainingStars + review.honorStars,
            reviewCount: Math.max(0, (prev.reviewCount || 0) - 1)
        }));

        // --- [STEP 3] 식당 명예 별 차감 ---
        if (review.honorStars > 0) {
            const placeRef = doc(db, "places", review.placeId);
            await updateDoc(placeRef, { totalHonorStars: increment(-review.honorStars) });
        }

        // --- [STEP 4] 🔥 식당 평점/개수 재계산 (청소부 호출) ---
        // 삭제 후 남은 것들로 다시 계산하므로 절대 꼬이지 않음.
        await recalculatePlaceStats(review.placeId);

        alert("삭제되었습니다.");
        
        // 화면 갱신
        fetchStatsAndReviews();

    } catch (error) {
        console.error("삭제 실패:", error);
    }
  };

  useEffect(() => {
    fetchStatsAndReviews();
  }, [fetchStatsAndReviews]); // 의존성 배열 수정

  return { stats, reviews, submitReview, deleteReview };
};