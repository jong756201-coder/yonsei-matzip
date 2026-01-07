import React, { useState, useEffect } from 'react';
import { Edit3, MessageSquare, ThumbsUp, ThumbsDown, Paperclip, X, ChevronLeft, FileText, Download, Trash2, Lock } from 'lucide-react';
import { db, storage } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, increment, serverTimestamp, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAstroRank } from '../utils/rankHelper';

// 🔥 [수정됨] 게시판 순서 변경 및 신메뉴리뷰 추가, 버그제보 삭제
const BOARDS = [
  { id: 'newmenu', name: '🔥 신메뉴리뷰' }, // 맨 앞으로 배치
  { id: 'restaurant', name: '🍱 맛집공유' },
  { id: 'free', name: '🗣 자유게시판' },     // 뒤로 이동
  { id: 'jokbo', name: '📄 족보게시판' },
];

const Community = ({ user, onLogin }) => {
  // 🔥 기본 탭을 'newmenu'(신메뉴리뷰)로 설정
  const [activeBoard, setActiveBoard] = useState('newmenu');
  const [view, setView] = useState('list'); 
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null); 

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [showAuthWarning, setShowAuthWarning] = useState(false); // 🔥 [NEW] 권한 경고 모달 상태

  // 권한 체크 함수
  const checkMemberAuth = () => {
      if (!user || user.role !== 'member') {
          setShowAuthWarning(true);
          return false;
      }
      return true;
  };

  // 🔥 [삭제됨] 기존의 전체 차단 로직 제거
  // if (!user || user.role !== 'member') { ... }

  // 1. 게시글 목록 구독 (JS 정렬)
  useEffect(() => {
    setPosts([]); 

    const q = query(
      collection(db, "posts"), 
      where("boardType", "==", activeBoard) 
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // 날짜 내림차순 정렬
      fetchedPosts.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
      });

      setPosts(fetchedPosts);
    });

    return () => unsubscribe();
  }, [activeBoard]);

  // 2. 상세 글 보기 시 댓글 구독
  useEffect(() => {
    if (view === 'detail' && selectedPost) {
      const postUnsub = onSnapshot(doc(db, "posts", selectedPost.id), (doc) => {
          if (doc.exists()) setSelectedPost({ id: doc.id, ...doc.data() });
      });

      const q = query(collection(db, `posts/${selectedPost.id}/comments`));
      
      const commentUnsub = onSnapshot(q, (snapshot) => {
        const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // 날짜 오름차순 정렬
        fetchedComments.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeA - timeB;
        });
        
        setComments(fetchedComments);
      });

      return () => { postUnsub(); commentUnsub(); };
    }
  }, [view, selectedPost?.id]);

  // 3. 글 작성
  const handleWriteSubmit = async () => {
    if (!title.trim() || !content.trim()) return alert("내용을 입력하세요.");
    
    setIsUploading(true);
    try {
      let fileUrl = null;
      let fileName = null;

      if (file) {
        const fileRef = ref(storage, `community/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        fileUrl = await getDownloadURL(fileRef);
        fileName = file.name;
      }

      const postData = {
        boardType: activeBoard,
        title,
        content,
        authorId: user.id,
        authorName: user.nickname || user.name,
        authorInfo: user.studentInfo || "정보없음",
        authorReviewCount: user.reviewCount || 0,
        fileUrl,
        fileName,
        likes: 0,
        dislikes: 0,
        likedBy: [],
        dislikedBy: [],
        commentCount: 0,
        createdAt: serverTimestamp()
      };

      const savePromise = addDoc(collection(db, "posts"), postData);

      if (!file) {
          setView('list');
          setTitle(""); setContent(""); setFile(null);
          setIsUploading(false);
          await savePromise;
      } else {
          await savePromise;
          alert("등록되었습니다!");
          setView('list');
          setTitle(""); setContent(""); setFile(null);
          setIsUploading(false);
      }
    } catch (e) {
      console.error(e);
      alert("업로드 실패");
      setIsUploading(false);
    }
  };

  const handleDeletePost = async () => {
      if (!window.confirm("삭제하시겠습니까?")) return;
      try {
          await deleteDoc(doc(db, "posts", selectedPost.id));
          setView('list');
          setSelectedPost(null);
      } catch (e) { console.error(e); }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    try {
      const commPromise = addDoc(collection(db, `posts/${selectedPost.id}/comments`), {
        text: commentText,
        authorId: user.id,
        authorName: user.nickname || user.name,
        authorInfo: user.studentInfo || "정보없음",
        authorReviewCount: user.reviewCount || 0,
        createdAt: serverTimestamp()
      });
      const countPromise = updateDoc(doc(db, "posts", selectedPost.id), {
        commentCount: increment(1)
      });
      setCommentText("");
      await Promise.all([commPromise, countPromise]);
    } catch (e) { console.error(e); }
  };

  const handleDeleteComment = async (commentId) => {
      if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
      try {
          await deleteDoc(doc(db, `posts/${selectedPost.id}/comments`, commentId));
          await updateDoc(doc(db, "posts", selectedPost.id), {
              commentCount: increment(-1)
          });
      } catch (e) { console.error(e); }
  };

  const handleVote = async (type) => {
    const postRef = doc(db, "posts", selectedPost.id);
    const userId = user.id;
    try {
        if (type === 'like') {
            const isLiked = selectedPost.likedBy?.includes(userId);
            if (isLiked) {
                await updateDoc(postRef, { likes: increment(-1), likedBy: arrayRemove(userId) });
            } else {
                await updateDoc(postRef, {
                    likes: increment(1), likedBy: arrayUnion(userId),
                    dislikes: selectedPost.dislikedBy?.includes(userId) ? increment(-1) : increment(0),
                    dislikedBy: arrayRemove(userId)
                });
            }
        } else {
            const isDisliked = selectedPost.dislikedBy?.includes(userId);
            if (isDisliked) {
                await updateDoc(postRef, { dislikes: increment(-1), dislikedBy: arrayRemove(userId) });
            } else {
                await updateDoc(postRef, {
                    dislikes: increment(1), dislikedBy: arrayUnion(userId),
                    likes: selectedPost.likedBy?.includes(userId) ? increment(-1) : increment(0),
                    likedBy: arrayRemove(userId)
                });
            }
        }
    } catch (e) { console.error(e); }
  };

  const AuthorBadge = ({ name, info, count }) => {
    const rank = getAstroRank(count);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
        <span style={{ fontWeight: 'bold', color: '#fff' }}>{name}</span>
        <span style={{ 
            fontSize: '10px', color: rank.color, border: `1px solid ${rank.color}`, 
            padding: '0 4px', borderRadius: '4px', display: 'flex', alignItems: 'center' 
        }}>
            {rank.emoji} {rank.name.split(' ')[0]}
        </span>
        <span style={{ color: '#666', fontSize: '11px' }}>{info}</span>
      </div>
    );
  };

  if (view === 'list') {
    return (
      <div style={{ padding: '20px', paddingBottom: '80px', height: '100%', backgroundColor: '#000', color: 'white', overflowY: 'auto', position: 'relative' }}>
        
        {/* 🔥 [NEW] 권한 경고 모달 */}
        {showAuthWarning && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                <div style={{ backgroundColor: '#1a1a1a', width: '100%', maxWidth: '300px', borderRadius: '20px', padding: '24px', border: '1px solid #333', textAlign: 'center', position: 'relative' }}>
                    <button onClick={() => setShowAuthWarning(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={20}/></button>
                    <Lock size={40} style={{ color: '#c92a2a', marginBottom: '16px' }} />
                    <h3 style={{ color: 'white', fontSize: '18px', margin: '0 0 8px 0' }}>정회원 전용 기능</h3>
                    <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '20px' }}>게시글을 보거나 작성하려면<br/>로그인이 필요합니다.</p>
                    
                    {!user && (
                        <button 
                            onClick={onLogin}
                            style={{ 
                                backgroundColor: '#FEE500', color: '#000', border: 'none', 
                                borderRadius: '8px', padding: '10px 20px', fontSize: '14px', 
                                fontWeight: 'bold', cursor: 'pointer', width: '100%'
                            }}
                        >
                            카카오 로그인
                        </button>
                    )}
                </div>
            </div>
        )}

        {/* 🔥 [NEW] 상단 제목 추가 */}
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
             <MessageSquare size={24} /> 커뮤니티
        </h2>

        {/* 게시판 탭 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto' }} className="hide-scrollbar">
          <style>{` .hide-scrollbar::-webkit-scrollbar { display: none; } `}</style>
          {BOARDS.map(b => (
            <button key={b.id} onClick={() => setActiveBoard(b.id)}
              style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', backgroundColor: activeBoard === b.id ? '#c92a2a' : '#222', color: activeBoard === b.id ? 'white' : '#888', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {b.name}
            </button>
          ))}
        </div>

        {/* 글쓰기 버튼 */}
        <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'flex-end' }}>
             <button onClick={() => { if (checkMemberAuth()) setView('write'); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#222', padding: '8px 12px', borderRadius: '8px', border: '1px solid #333', color: '#ccc', cursor: 'pointer' }}>
                 <Edit3 size={16} /> 새 글 쓰기
             </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {posts.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#444' }}>
                    <p>게시글이 없습니다.</p>
                </div>
            ) : (
                posts.map(post => (
                    <div key={post.id} onClick={() => { if (checkMemberAuth()) { setSelectedPost(post); setView('detail'); } }}
                         style={{ padding: '16px 0', borderBottom: '1px solid #222', cursor: 'pointer' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '6px' }}>{post.title}</div>
                        <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.content}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <AuthorBadge name={post.authorName} info={post.authorInfo} count={post.authorReviewCount} />
                            <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#c92a2a', fontWeight: 'bold' }}>
                                {post.likes > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><ThumbsUp size={12} /> {post.likes}</span>}
                                {post.commentCount > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#0ca678' }}><MessageSquare size={12} /> {post.commentCount}</span>}
                                {post.fileUrl && <Paperclip size={12} color="#888" />}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    );
  }

  if (view === 'write') {
    return (
      <div style={{ padding: '20px', height: '100%', backgroundColor: '#000', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', color: 'white' }}><X size={24}/></button>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                글 쓰기 ({BOARDS.find(b => b.id === activeBoard)?.name})
            </h3>
            <button onClick={handleWriteSubmit} disabled={isUploading} style={{ background: 'none', border: 'none', color: '#c92a2a', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
                {isUploading ? "..." : "완료"}
            </button>
        </div>
        <input 
            type="text" placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid #333', color: 'white', fontSize: '18px', padding: '10px 0', outline: 'none', marginBottom: '20px' }}
        />
        <textarea 
            placeholder="내용을 입력하세요." value={content} onChange={(e) => setContent(e.target.value)}
            style={{ width: '100%', height: '40%', backgroundColor: 'transparent', border: 'none', color: 'white', fontSize: '15px', outline: 'none', resize: 'none', marginBottom: '20px' }}
        />
        <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888', cursor: 'pointer', width: 'fit-content' }}>
                <Paperclip size={20} />
                {file ? <span style={{ color: '#3b82f6' }}>{file.name}</span> : "파일 첨부 (사진/PDF)"}
                <input type="file" onChange={(e) => setFile(e.target.files[0])} style={{ display: 'none' }} />
            </label>
        </div>
      </div>
    );
  }

  if (view === 'detail' && selectedPost) {
    const isMyPost = selectedPost.authorId === user.id;
    const amILiked = selectedPost.likedBy?.includes(user.id);
    const amIDisliked = selectedPost.dislikedBy?.includes(user.id);

    return (
      <div style={{ padding: '0', height: '100%', backgroundColor: '#000', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><ChevronLeft size={24}/></button>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{BOARDS.find(b => b.id === selectedPost.boardType)?.name}</span>
            </div>
            {isMyPost && (
                <button onClick={handleDeletePost} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}>
                    <Trash2 size={20} />
                </button>
            )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <AuthorBadge name={selectedPost.authorName} info={selectedPost.authorInfo} count={selectedPost.authorReviewCount} />
                <span style={{ fontSize: '12px', color: '#666' }}>
                    {selectedPost.createdAt?.seconds ? new Date(selectedPost.createdAt.seconds * 1000).toLocaleDateString() : '방금'}
                </span>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>{selectedPost.title}</h2>
            <div style={{ fontSize: '15px', lineHeight: '1.6', color: '#ddd', marginBottom: '30px', whiteSpace: 'pre-wrap' }}>
                {selectedPost.content}
            </div>

            {selectedPost.fileUrl && (
                <div style={{ marginBottom: '30px' }}>
                    {selectedPost.fileName?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img src={selectedPost.fileUrl} alt="첨부" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                    ) : (
                        <a href={selectedPost.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#222', borderRadius: '8px', color: '#3b82f6', textDecoration: 'none' }}>
                            <FileText size={20} /> {selectedPost.fileName} <Download size={16} />
                        </a>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '40px' }}>
                <button onClick={() => handleVote('like')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px', border: 'none', backgroundColor: amILiked ? '#c92a2a' : '#222', color: amILiked ? 'white' : '#c92a2a', fontWeight: 'bold', cursor: 'pointer' }}>
                    <ThumbsUp size={16} /> {selectedPost.likes || 0}
                </button>
                <button onClick={() => handleVote('dislike')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px', border: 'none', backgroundColor: amIDisliked ? '#888' : '#222', color: amIDisliked ? 'white' : '#888', fontWeight: 'bold', cursor: 'pointer' }}>
                    <ThumbsDown size={16} /> {selectedPost.dislikes || 0}
                </button>
            </div>

            <div style={{ borderTop: '1px solid #222', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '16px' }}>댓글 {comments.length}</h4>
                {comments.map(c => (
                    <div key={c.id} style={{ marginBottom: '16px', borderBottom: '1px solid #1a1a1a', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                             <AuthorBadge name={c.authorName} info={c.authorInfo} count={c.authorReviewCount} />
                             {c.authorId === user.id && (
                                 <button onClick={() => handleDeleteComment(c.id)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0 }}>
                                     <X size={14} />
                                 </button>
                             )}
                        </div>
                        <div style={{ fontSize: '14px', color: '#ddd' }}>{c.text}</div>
                    </div>
                ))}
            </div>
        </div>

        <div style={{ padding: '10px', backgroundColor: '#1a1a1a', borderTop: '1px solid #333', display: 'flex', gap: '8px' }}>
            <input 
                type="text" placeholder="댓글을 입력하세요" 
                value={commentText} onChange={(e) => setCommentText(e.target.value)}
                style={{ flex: 1, backgroundColor: '#333', border: 'none', borderRadius: '8px', padding: '10px', color: 'white', outline: 'none' }}
            />
            <button onClick={handleCommentSubmit} style={{ backgroundColor: '#c92a2a', border: 'none', borderRadius: '8px', width: '40px', color: 'white', cursor: 'pointer' }}>
                <MessageSquare size={18} />
            </button>
        </div>
      </div>
    );
  }

  return null;
};

export default Community;