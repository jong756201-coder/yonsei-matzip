import React, { useState } from 'react';

const ReviewForm = ({ user, onSubmit }) => {
  const [tasteRating, setTasteRating] = useState(0);
  const [costRating, setCostRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [honorStarsToGive, setHonorStarsToGive] = useState(1);

  // 🔥 [변경] 0.5 단위 멘트 정의
  const getRatingText = (score) => {
    if (score === 3) return "👍👍👍 (최고!)";
    if (score === 2.5) return "👍👍 (아주 훌륭함)";
    if (score === 2) return "👍👍 (훌륭함)";
    if (score === 1.5) return "👍👍 (꽤 괜찮음)";
    if (score === 1) return "👍 (좋음)";
    if (score === 0.5) return "👍 (나쁘지 않음)";
    if (score === 0) return "😐 (보통)";
    if (score === -0.5) return "🤔 (살짝 아쉬움)";
    if (score === -1) return "👎 (아쉬움)";
    if (score === -1.5) return "👎 (별로)";
    return "👎👎 (비추천)";
  };

  const handleSubmit = () => {
    onSubmit({
      tasteRating,
      costRating,
      reviewText,
      honorStarsToGive
    });
    setReviewText("");
    setTasteRating(0);
    setCostRating(0);
    setHonorStarsToGive(1);
  };

  return (
    <div style={{ marginBottom: '24px', backgroundColor: '#252525', padding: '16px', borderRadius: '16px' }}>
      {/* 맛 슬라이더 */}
      <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span style={{ color: '#aaa' }}>😋 맛</span>
              {/* 점수 표시 부분도 / 3 추가 */}
              <span style={{ color: tasteRating === 3 ? '#FFD700' : 'white' }}>
                  {tasteRating} <span style={{ fontSize: '10px', color: '#666' }}>/ 3</span> : {getRatingText(tasteRating)}
              </span>
          </div>
          {/* 🔥 step="0.5" 추가 및 parseFloat 사용 */}
          <input 
            type="range" min="-2" max="3" step="0.5" 
            value={tasteRating} 
            onChange={(e) => setTasteRating(parseFloat(e.target.value))} 
            style={{ width: '100%', accentColor: tasteRating === 3 ? '#FFD700' : '#4a90e2' }} 
          />
      </div>
      
      {/* 가성비 슬라이더 */}
      <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span style={{ color: '#aaa' }}>💰 가성비</span>
              <span style={{ color: 'white' }}>
                  {costRating} <span style={{ fontSize: '10px', color: '#666' }}>/ 3</span> : {getRatingText(costRating)}
              </span>
          </div>
          <input 
            type="range" min="-2" max="3" step="0.5" 
            value={costRating} 
            onChange={(e) => setCostRating(parseFloat(e.target.value))} 
            style={{ width: '100%', accentColor: '#34d399' }} 
          />
      </div>

      {/* 리뷰 텍스트 */}
      <textarea 
          value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="후기를 남겨주세요 (선택사항)"
          style={{ width: '100%', height: '60px', backgroundColor: '#333', border: 'none', borderRadius: '8px', color: 'white', padding: '10px', fontSize: '13px', marginBottom: '12px', resize: 'none' }}
      />

      {/* 별 하사 옵션 (정확히 3점일 때만 가능하게 유지) */}
      {tasteRating === 3 && (
          <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: 'rgba(255, 215, 0, 0.1)', borderRadius: '8px', border: '1px solid #FFD700' }}>
              <div style={{ fontSize: '13px', color: '#FFD700', marginBottom: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                  <span>💎 별 하사하기 (투자)</span>
                  <span>보유: {user.remainingStars}개</span>
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                  {[1, 2, 3].map(num => (
                      <button 
                          key={num} 
                          onClick={() => setHonorStarsToGive(num)}
                          disabled={user.remainingStars < num}
                          style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: honorStarsToGive === num ? '#FFD700' : '#444', color: honorStarsToGive === num ? 'black' : '#aaa', opacity: user.remainingStars < num ? 0.3 : 1, fontWeight: 'bold', cursor: 'pointer' }}
                      >
                          {num}개
                      </button>
                  ))}
              </div>
          </div>
      )}

      <button onClick={handleSubmit} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: tasteRating === 3 ? 'linear-gradient(135deg, #FFD700, #FFA500)' : '#3b82f6', color: tasteRating === 3 ? 'black' : 'white', fontWeight: 'bold', fontSize: '15px' }}>
          {tasteRating === 3 ? `💎 별 ${honorStarsToGive}개 투자하고 평가하기` : '평가 제출하기'}
      </button>
    </div>
  );
};

export default ReviewForm;