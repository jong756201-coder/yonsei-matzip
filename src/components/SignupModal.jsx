import React, { useState } from 'react';

const DEGREES = ["학부", "석사", "박사"];
const GRADES = ["1", "2", "3", "4", "5"];

const SignupModal = ({ kakaoProfile, onComplete }) => {
  // 카카오에서 가져온 닉네임을 기본 이름으로 설정 (수정 가능)
  const [name, setName] = useState(kakaoProfile.kakaoNickname || "");
  const [degree, setDegree] = useState("학부");
  const [grade, setGrade] = useState("1");

  const handleSubmit = () => {
    if (!name.trim()) return alert("이름을 입력해주세요.");
    
    // 데이터 정리해서 부모(App.js)로 전달
    const finalData = {
        name: name,
        // 닉네임 필드에도 이름을 넣어서 기존 로직과 호환성 유지
        nickname: name, 
        studentInfo: `${degree} ${grade}학년`
    };
    onComplete(finalData);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: '#1a1a1a', width: '100%', maxWidth: '340px', padding: '30px', borderRadius: '24px', border: '1px solid #333', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        
        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>🚀 대원 등록</h2>
        <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px' }}>
            정회원 등록을 위해 정보를 입력해주세요.<br/>
            입력된 정보는 커뮤니티 활동에 사용됩니다.
        </p>

        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 1. 이름 입력 */}
            <div>
                <label style={{ color: '#ccc', fontSize: '12px', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>이름 (실명 권장)</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    style={{ width: '100%', padding: '12px', backgroundColor: '#252525', border: '1px solid #444', borderRadius: '8px', color: 'white', outline: 'none', fontSize: '15px' }}
                />
            </div>

            {/* 2. 학적 정보 선택 */}
            <div>
                <label style={{ color: '#ccc', fontSize: '12px', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>소속 과정</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {DEGREES.map(d => (
                        <button key={d} onClick={() => setDegree(d)}
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid', 
                            borderColor: degree === d ? '#3b82f6' : '#444', backgroundColor: degree === d ? 'rgba(59, 130, 246, 0.2)' : '#252525', 
                            color: degree === d ? '#3b82f6' : '#888', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                            {d}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. 학년 선택 */}
            <div>
                <label style={{ color: '#ccc', fontSize: '12px', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>학년</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                    {GRADES.map(g => (
                        <button key={g} onClick={() => setGrade(g)}
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid', 
                            borderColor: grade === g ? '#3b82f6' : '#444', backgroundColor: grade === g ? 'rgba(59, 130, 246, 0.2)' : '#252525', 
                            color: grade === g ? '#3b82f6' : '#888', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                            {g}
                        </button>
                    ))}
                </div>
            </div>

        </div>

        <button onClick={handleSubmit} style={{ marginTop: '30px', width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)' }}>
            등록 완료
        </button>

      </div>
    </div>
  );
};

export default SignupModal;