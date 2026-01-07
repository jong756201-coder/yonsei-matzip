// src/utils/rankHelper.js

export const getAstroRank = (count) => {
    // 안전장치: count가 없으면 0으로 취급
    const safeCount = count || 0;

    if (safeCount === 0) return { name: "성운 (Nebula)", color: "#868e96", emoji: "🌫️", next: 1 };
    if (safeCount < 5) return { name: "원시성 (Protostar)", color: "#fab005", emoji: "✨", next: 5 };
    if (safeCount < 20) return { name: "주계열성 (Main Sequence)", color: "#ffec99", emoji: "☀️", next: 20 };
    if (safeCount < 50) return { name: "적색거성 (Red Giant)", color: "#ff6b6b", emoji: "🔴", next: 50 };
    if (safeCount < 100) return { name: "초신성 (Supernova)", color: "#cc5de8", emoji: "💥", next: 100 };
    
    // 그 이상
    return { name: "블랙홀 (Black Hole)", color: "#ffffff", border: "1px solid #333", emoji: "🕳️", next: Infinity };
};