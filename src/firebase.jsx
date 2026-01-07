// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // 데이터베이스(장부)
import { getAuth } from "firebase/auth"; // 로그인(문지기)
import { getStorage } from "firebase/storage"; // 🔥 추가됨
// 회장님의 비밀 키 (스크린샷 내용)
const firebaseConfig = {
  apiKey: "AIzaSyAXTvDxLL2ieUpL2d9uza933u26MoCo_Hk",
  authDomain: "astromap-2598e.firebaseapp.com",
  projectId: "astromap-2598e",
  storageBucket: "astromap-2598e.firebasestorage.app",
  messagingSenderId: "955564077224",
  appId: "1:955564077224:web:4148ed06f4a2bdf3cd929d",
  measurementId: "G-X8JL41VC5E"
};

// 1. 파이어베이스 앱 시작!
const app = initializeApp(firebaseConfig);

// 2. 다른 곳에서 쓸 수 있게 내보내기
export const db = getFirestore(app); // 장부 내보내기
export const auth = getAuth(app);    // 문지기 내보내기
export const storage = getStorage(app)
export default app;