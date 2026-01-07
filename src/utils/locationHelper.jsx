// src/utils/locationHelper.js

const ZONES = [
  // 1. [교내] 학생회관 근처 (반경을 넓게 줌)
  { name: "학식", lat: 37.5645, lng: 126.9375, radius: 0.00030 }, 
  
  // 2. [정문] 신촌역 ~ 정문 사이
  { name: "정문", lat: 37.5596, lng: 126.9368, radius: 0.00020 },

  // 3. [서문] 연희동 초입 (반경을 좁힘)
  // 🔥 성산로(큰길) 북쪽만 해당되도록 로직에서 제어할 예정
  { name: "서문", lat: 37.5648, lng: 126.9315, radius: 0.00015 }, 

  // 4. [연희] 연희동 깊은 곳
  { name: "연희", lat: 37.5680, lng: 126.9305, radius: 0.00025 },

  // 5. [이대] 이대 후문/정문 (반경을 아주 좁힘, 너무 넓게 잡히지 않게)
  { name: "이대", lat: 37.5575, lng: 126.9455, radius: 0.00012 },

  // 6. [NEW] 연남/서교 (홍대입구역 3번출구 근처)
  { name: "연남", lat: 37.5615, lng: 126.9255, radius: 0.00025 },
];

export const classifyLocation = (targetLat, targetLng) => {
  let closestZone = "기타";
  let minDistance = Infinity;

  // 성산로(성산회관~동교동삼거리)의 대략적인 위도 경계선
  // 이 위도보다 작으면(남쪽이면) 절대 '서문'이 될 수 없음.
  const SEONG_SAN_RO_LIMIT = 37.5625;

  ZONES.forEach((zone) => {
    // 1. 거리 제곱 계산
    const distance = Math.pow(zone.lat - targetLat, 2) + Math.pow(zone.lng - targetLng, 2);

    // 2. [핵심] 경계 조건 검사 (Boundary Condition)
    // 서문인데, 사용자가 찍은 위치가 성산로 남쪽(아래)이라면? -> 무시(Skip)
    if (zone.name === "서문" && targetLat < SEONG_SAN_RO_LIMIT) {
      return; 
    }

    // 3. 거리 비교 및 유효 반경(Radius) 체크
    // 각 구역마다 설정된 radius보다 가까울 때만 인정
    if (distance < minDistance && distance < zone.radius) {
      minDistance = distance;
      closestZone = zone.name;
    }
  });

  return closestZone;
};