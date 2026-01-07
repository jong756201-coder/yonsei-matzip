import React, { useState } from 'react';

const SignupModal = ({ kakaoProfile, onComplete }) => {
  const [realName, setRealName] = useState("");
  const [nickname, setNickname] = useState(""); 
  
  // 초기값 설정
  const [degree, setDegree] = useState("학부"); 
  const [grade, setGrade] = useState("1");      

  // 선택지 배열
  const DEGREES = ["학부", "석사", "박사"];
  const GRADES = ["1", "2", "3", "4", "5이상"];

  const handleSubmit = () => {
    if (!realName.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }

    const finalNickname = nickname.trim() ? nickname.trim() : realName.trim();
    const studentInfoStr = `${degree} ${grade}학년`;

    onComplete({
      name: realName,
      nickname: finalNickname,
      studentInfo: studentInfoStr
    });
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '85%', maxWidth: '340px', backgroundColor: '#1a1a1a', padding: '24px', borderRadius: '16px', border: '1px solid #333', boxShadow: '0 10px 40px rgba(0,0,0,1)' }}>
        
        <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '8px', textAlign: 'center' }}>🚀 신규 대원 등록</h2>
        <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px', textAlign: 'center' }}>
            천문 맛집지도에 오신 것을 환영합니다.<br/>
            기본 정보를 입력해주세요.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 1. 이름 */}
            <div>
                <label style={{ color: '#ccc', fontSize: '12px', display: 'block', marginBottom: '8px' }}>이름 (실명)</label>
                <input 
                    type="text" 
                    placeholder="홍길동"
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: '#333', border: '1px solid #444', color: 'white', outline: 'none', fontSize: '15px' }}
                />
            </div>

            {/* 2. 닉네임 */}
            <div>
                <label style={{ color: '#ccc', fontSize: '12px', display: 'block', marginBottom: '8px' }}>닉네임 (선택)</label>
                <input 
                    type="text" 
                    placeholder={realName ? `${realName}` : "미입력 시 이름 사용"}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: '#333', border: '1px solid #444', color: 'white', outline: 'none', fontSize: '15px' }}
                />
            </div>

            {/* 3. 학적 정보 (바 형태 선택) */}
            <div>
                <label style={{ color: '#ccc', fontSize: '12px', display: 'block', marginBottom: '8px' }}>과정 선택</label>
                <div style={{ display: 'flex', gap: '8px', backgroundColor: '#222', padding: '4px', borderRadius: '12px' }}>
                    {DEGREES.map((d) => (
                        <button
                            key={d}
                            onClick={() => setDegree(d)}
                            style={{
                                flex: 1,
                                padding: '10px 0',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: degree === d ? 'bold' : 'normal',
                                backgroundColor: degree === d ? '#3b82f6' : 'transparent',
                                color: degree === d ? 'white' : '#888',
                                transition: 'all 0.2s'
                            }}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            </div>

            {/* 4. 학년 선택 (바 형태 선택) */}
            <div>
                <label style={{ color: '#ccc', fontSize: '12px', display: 'block', marginBottom: '8px' }}>학년 선택</label>
                <div style={{ display: 'flex', gap: '6px', backgroundColor: '#222', padding: '4px', borderRadius: '12px' }}>
                    {GRADES.map((g) => (
                        <button
                            key={g}
                            onClick={() => setGrade(g)}
                            style={{
                                flex: 1,
                                padding: '10px 0',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: grade === g ? 'bold' : 'normal',
                                backgroundColor: grade === g ? '#3b82f6' : 'transparent',
                                color: grade === g ? 'white' : '#888',
                                transition: 'all 0.2s'
                            }}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            <button 
                onClick={handleSubmit}
                style={{ marginTop: '10px', width: '100%', padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
            >
                회원가입 완료
            </button>

        </div>
      </div>
    </div>
  );
};

export default SignupModal;