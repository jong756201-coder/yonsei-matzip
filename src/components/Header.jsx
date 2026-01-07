// src/components/Header.js
import React from 'react';
import { LogIn } from 'lucide-react'; // 아이콘 추가

const Header = ({ user, onLogin }) => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, padding: '12px 20px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
      <span style={{ fontWeight: 'bold', letterSpacing: '1px', color: '#fff' }}>ASTROMAP</span>
      
      <div style={{ textAlign: 'right' }}>
        {/* 유저가 있을 때: 기존처럼 정보 표시 */}
        {user ? (
            <div>
                <div style={{ fontSize: '12px', color: user.role === 'member' ? '#FFD700' : '#888' }}>
                {user.name} {user.role === 'member' ? '회원님' : '(비회원)'}
                </div>
                {user.role === 'member' && (
                <div style={{ fontSize: '11px', color: '#aaa' }}>
                </div>
                )}
            </div>
        ) : (
            /* 유저가 없을 때: 로그인 버튼 표시 */
            <button 
                onClick={onLogin}
                style={{ 
                    backgroundColor: '#FEE500', color: '#000', border: 'none', 
                    borderRadius: '6px', padding: '6px 12px', fontSize: '12px', 
                    fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' 
                }}
            >
                <LogIn size={14} /> 로그인
            </button>
        )}
      </div>
    </div>
  );
};

export default Header;