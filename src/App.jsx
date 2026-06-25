"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";

const C = {
  bg: "#FFF8F0", pink: "#FF6B8A", pinkLight: "#FFE4EC",
  orange: "#FFB74D", orangeLight: "#FFF3E0",
  blue: "#4FC3F7", blueDark: "#1565C0", blueLight: "#E3F2FD",
  green: "#66BB6A", greenLight: "#E8F5E9", greenDark: "#2E7D32",
  red: "#EF5350", redLight: "#FFEBEE",
  gray: "#90A4AE", grayLight: "#ECEFF1", grayDark: "#455A64",
  white: "#FFFFFF", text: "#37474F", textLight: "#78909C",
  gold: "#FFC107", purple: "#AB47BC",
  mapLand: "#F5E6D3", mapLandSouth: "#EDD9C4",
  river: "#81D4FA", riverDark: "#4FC3F7",
  mountain: "#A5D6A7", mountainDark: "#66BB6A",
  stamina: "#FF7043",
};

const S = {
  card: { 
    background: C.white, 
    borderRadius: 20, 
    padding: 20, 
    boxShadow: "0 8px 0px #ECEFF1, 0 8px 24px rgba(0,0,0,0.04)", 
    border: `3.5px solid ${C.grayLight}`, 
    transition: "transform 0.2s ease, box-shadow 0.2s ease" 
  },
  btn: (c, tc = C.white) => ({ 
    background: c, 
    color: tc, 
    border: "3px solid rgba(0, 0, 0, 0.15)", 
    borderRadius: 16, 
    padding: "12px 24px", 
    fontSize: 16, 
    fontWeight: 900, 
    cursor: "pointer", 
    transition: "transform 0.1s ease, box-shadow 0.1s ease, filter 0.2s ease", 
    display: "inline-flex", 
    alignItems: "center", 
    gap: 8, 
    justifyContent: "center", 
    boxShadow: "0 6px 0px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.08)" 
  }),
  tag: (bg, c) => ({ 
    background: bg, 
    color: c, 
    borderRadius: 20, 
    padding: "4px 12px", 
    fontSize: 12, 
    fontWeight: 800, 
    display: "inline-block",
    border: "1.5px solid rgba(0,0,0,0.05)"
  }),
  container: { maxWidth: 800, margin: "0 auto", padding: "16px 16px 32px", fontFamily: "'Pretendard','Noto Sans KR',system-ui,sans-serif", color: C.text, minHeight: "100vh", background: C.bg },
};

const fmt = (n) => n.toLocaleString() + "원";
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// Web Audio API Sound Synthesizer
function playSFX(type) {
  if (typeof window === "undefined") return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    if (type === "coin") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === "success") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      osc.frequency.setValueAtTime(1046.50, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === "fail") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(147, now + 0.15);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === "exhausted") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.setValueAtTime(100, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    }
  } catch (e) {
    console.error("Audio error", e);
  }
}

// ─── Zone-based transport ───
const ZONE = { jongno:1,jung:1,yongsan:1, seongdong:2,gwangjin:2,dongdaemun:2,jungnang:2,seongbuk:2,gangbuk:2,dobong:2,nowon:2, eunpyeong:3,seodaemun:3,mapo:3, yangcheon:4,gangseo:4,guro:4,geumcheon:4,yeongdeungpo:4,dongjak:4,gwanak:4, seocho:5,gangnam:5,songpa:5,gangdong:5 };
const NEAR = new Set(["1-2","2-1","1-3","3-1","1-4","4-1","3-4","4-3","4-5","5-4","1-5","5-1"]);
function calcTC(fromDist, toDistOfLoc) {
  if (fromDist === toDistOfLoc) return 0;
  const z1 = ZONE[fromDist], z2 = ZONE[toDistOfLoc];
  if (z1 === z2) return 1400;
  return NEAR.has(`${z1}-${z2}`) ? 2400 : 3400;
}
function staminaCostFor(tc) { return tc === 0 ? 5 : tc <= 1400 ? 15 : tc <= 2400 ? 25 : 35; }

// ─── Districts ───
const DISTRICTS = [
  { id:"jongno",name:"종로구",a:"도심" },{ id:"jung",name:"중구",a:"도심" },{ id:"yongsan",name:"용산구",a:"도심" },
  { id:"seongdong",name:"성동구",a:"동북" },{ id:"gwangjin",name:"광진구",a:"동북" },{ id:"dongdaemun",name:"동대문구",a:"동북" },{ id:"jungnang",name:"중랑구",a:"동북" },{ id:"seongbuk",name:"성북구",a:"동북" },{ id:"gangbuk",name:"강북구",a:"동북" },{ id:"dobong",name:"도봉구",a:"동북" },{ id:"nowon",name:"노원구",a:"동북" },
  { id:"eunpyeong",name:"은평구",a:"서북" },{ id:"seodaemun",name:"서대문구",a:"서북" },{ id:"mapo",name:"마포구",a:"서북" },
  { id:"yangcheon",name:"양천구",a:"서남" },{ id:"gangseo",name:"강서구",a:"서남" },{ id:"guro",name:"구로구",a:"서남" },{ id:"geumcheon",name:"금천구",a:"서남" },{ id:"yeongdeungpo",name:"영등포구",a:"서남" },{ id:"dongjak",name:"동작구",a:"서남" },{ id:"gwanak",name:"관악구",a:"서남" },
  { id:"seocho",name:"서초구",a:"동남" },{ id:"gangnam",name:"강남구",a:"동남" },{ id:"songpa",name:"송파구",a:"동남" },{ id:"gangdong",name:"강동구",a:"동남" },
];

const DISTRICT_COORDS = {
  jongno: { x: 420, y: 300 },
  jung: { x: 480, y: 390 },
  yongsan: { x: 460, y: 530 },
  seongdong: { x: 640, y: 490 },
  gwangjin: { x: 780, y: 540 },
  dongdaemun: { x: 720, y: 380 },
  jungnang: { x: 880, y: 320 },
  seongbuk: { x: 620, y: 260 },
  gangbuk: { x: 580, y: 150 },
  dobong: { x: 660, y: 80 },
  nowon: { x: 820, y: 120 },
  eunpyeong: { x: 260, y: 200 },
  seodaemun: { x: 320, y: 340 },
  mapo: { x: 220, y: 460 },
  yangcheon: { x: 100, y: 640 },
  gangseo: { x: 60, y: 480 },
  guro: { x: 120, y: 760 },
  geumcheon: { x: 240, y: 880 },
  yeongdeungpo: { x: 280, y: 620 },
  dongjak: { x: 430, y: 680 },
  gwanak: { x: 410, y: 800 },
  seocho: { x: 580, y: 780 },
  gangnam: { x: 720, y: 740 },
  songpa: { x: 860, y: 720 },
  gangdong: { x: 920, y: 560 }
};

// ─── Locations ───
const ALL_LOCATIONS = [
  { id:"gwangjang", name:"광장시장", type:"market", dist:"jongno", emoji:"🏮", x:55,y:26, desc:"먹거리가 유명한 전통시장", spec:"고기·먹거리 최저가", color:"#E53935", mode:"easy" },
  { id:"mangwon", name:"망원시장", type:"market", dist:"mapo", emoji:"🥬", x:22,y:35, desc:"신선한 채소가 가득", spec:"채소·신선식품 최저가", color:"#43A047", mode:"easy" },
  { id:"namdaemun", name:"남대문시장", type:"market", dist:"jung", emoji:"🏯", x:46,y:40, desc:"600년 역사의 종합시장", spec:"잡화·양념 최저가", color:"#FB8C00", mode:"easy" },
  { id:"mart_a", name:"행복마트", type:"mart", dist:"gangnam", emoji:"🏬", x:60,y:68, desc:"깔끔한 대형마트", spec:"품질 균일, 가격 비쌈", color:"#1565C0", mode:"easy" },
  { id:"gyeongdong", name:"경동시장", type:"market", dist:"dongdaemun", emoji:"🌿", x:72,y:28, desc:"약재·농산물 전문시장", spec:"건강식품·농산물 최저가", color:"#6D4C41", mode:"hard" },
  { id:"tongin", name:"통인시장", type:"market", dist:"jongno", emoji:"🪙", x:38,y:24, desc:"엽전 도시락으로 유명", spec:"전통음식·떡 최저가", color:"#8E24AA", mode:"hard" },
  { id:"mart_b", name:"편리마트", type:"mart", dist:"yeongdeungpo", emoji:"🛒", x:30,y:62, desc:"영등포의 대형마트", spec:"품질 균일, 행복마트보다 약간 저렴", color:"#0277BD", mode:"hard" },
  { id:"mart_c", name:"큰마트", type:"nowon", emoji:"🏪", x:78,y:10, desc:"노원의 대형마트", spec:"품질 균일, 북쪽 주민에게 유리", color:"#00838F", mode:"hard" },
];

// ─── Missions ───
function makeItem(name, emoji, p) {
  return { name, emoji, prices: { gwangjang:p[0], mangwon:p[1], namdaemun:p[2], mart_a:p[3], gyeongdong:p[4], tongin:p[5], mart_b:p[6], mart_c:p[7] }};
}
const MISSIONS = [
  { id:1, title:"가족 저녁 찌개 준비", emoji:"🍲", budget:22000,
    desc:"오늘 저녁, 온 가족이 먹을 김치찌개를 끓이려고 해요!",
    required: [
      makeItem("돼지고기 300g","🥩",[4500,6500,7000,8500,5500,6000,8000,9000]),
      makeItem("배추 1포기","🥬",[3000,1500,2500,3500,2000,2800,3200,3800]),
      makeItem("두부 1모","🫘",[1000,800,1200,2000,900,1000,1800,2200]),
      makeItem("대파 1단","🧅",[2000,1000,1500,2500,1200,1800,2200,2800]),
      makeItem("고춧가루","🌶️",[3000,3500,2000,4500,1800,2800,4000,5000]),
    ],
    optional: [makeItem("사과 3개","🍎",[3000,2000,3500,5000,2500,3000,4500,5500])],
  },
  { id:2, title:"소풍 도시락 만들기", emoji:"🍱", budget:17000,
    desc:"내일 소풍! 맛있는 김밥 도시락을 만들어요!",
    required: [
      makeItem("김밥용 김 10장","🍙",[1500,1800,1000,2500,1600,1200,2300,2800]),
      makeItem("단무지","💛",[800,600,1000,1500,700,800,1300,1600]),
      makeItem("햄 1줄","🥓",[1500,2000,2200,3000,1800,1600,2800,3200]),
      makeItem("당근 2개","🥕",[1200,800,1000,1800,700,1000,1600,2000]),
      makeItem("음료수 2개","🧃",[1800,2000,1800,2200,2000,1800,2000,2400]),
    ],
    optional: [makeItem("과자 1봉","🍪",[1500,1500,1200,1500,1500,1500,1400,1600])],
  },
  { id:3, title:"친구 생일파티 준비", emoji:"🎂", budget:20000,
    desc:"친한 친구의 생일파티를 멋지게 준비해봐요!",
    required: [
      makeItem("케이크 믹스","🎂",[3000,3500,3200,4500,3200,2800,4000,4800]),
      makeItem("딸기 1팩","🍓",[3500,2500,4000,5500,3000,3500,5000,5800]),
      makeItem("생크림","🥛",[2500,2800,2500,3500,2800,2500,3200,3800]),
      makeItem("주스 3개","🧃",[2500,2500,2000,3000,2500,2200,2800,3200]),
      makeItem("종이접시 세트","🍽️",[2000,2500,1000,2000,1800,1500,1800,2200]),
    ],
    optional: [makeItem("풍선 10개","🎈",[2000,2500,1500,3000,2000,1800,2800,3200])],
  },
];

const TEMPTATIONS = [
  { name:"붕어빵 3개",emoji:"🐟",price:1500,heal:15,msg:"맛있는 냄새가 솔솔~ 따끈따끈 붕어빵을 사먹을까? (체력 +15 회복)" },
  { name:"떡볶이 1인분",emoji:"🍢",price:2500,heal:25,msg:"시장 떡볶이가 정말 맛있어 보여요! (체력 +25 회복)" },
  { name:"캐릭터 스티커",emoji:"⭐",price:2000,heal:0,msg:"좋아하는 캐릭터 스티커를 발견했어요! 귀엽지만 체력은 안 올라요." },
  { name:"솜사탕",emoji:"🍭",price:2000,heal:10,msg:"알록달록 솜사탕이 눈에 들어와요! 달콤해서 기운이 나요! (체력 +10 회복)" },
  { name:"뽑기 1회",emoji:"🎯",price:1000,heal:0,msg:"뽑기 기계! 원하는 게 나올 것 같아요! 재미있지만 체력은 안 올라요." },
  { name:"호떡",emoji:"🥞",price:1500,heal:15,msg:"따끈따끈 호떡 냄새가 솔솔! (체력 +15 회복)" },
];

const QUIZZES = [
  { q: "전통시장에서 대형마트보다 저렴하게 장을 보고, 지역 경제를 돕는 데 쓸 수 있는 특별한 상품권의 이름은?", a: "온누리상품권", options: ["온누리상품권", "문화상품권", "도서상품권"] },
  { q: "물건을 살 때 내가 포기해야 하는 다른 선택지 중 가장 가치가 큰 것을 뜻하는 말은?", a: "기회비용", options: ["기회비용", "할인비용", "교통비용"] },
  { q: "물건을 사기 전에 쓸 수 있는 돈의 한도를 미리 정해두는 계획을 무엇이라고 할까요?", a: "예산", options: ["예산", "용돈", "결제"] },
  { q: "같은 품질의 물건이라면 여러 곳의 가격을 비교해 가장 저렴한 곳에서 사는 현명한 행동을 무엇이라고 할까요?", a: "합리적 소비", options: ["합리적 소비", "충동 구매", "과소비"] }
];

const AREA_ORDER = ["도심","동북","서북","서남","동남"];
const AREA_CLR = { "도심":C.pink, "동북":C.orange, "서북":C.green, "서남":C.purple, "동남":C.blueDark };
const DIFF = { easy:{ maxVisits:4, stamina:false, label:"쉬움" }, hard:{ maxVisits:8, stamina:true, startStamina:100, label:"어려움" }};

const MOM_IMG = "/images/mother_character_1781675642725.png";

const MOM_BRIEFING = {
  1: "오늘 저녁에 김치찌개를 끓일 거야.\n여기 돈이니까 재료 좀 사다 줄래?\n잘 골라서 사오렴~",
  2: "내일 소풍이잖아~\n김밥 재료를 사다 줄래?\n남는 돈은 잘 가져오고!",
  3: "친구 생일파티를 준비해야 해.\n이 돈으로 필요한 것 사오렴!\n엄마가 믿을게~",
};

// ─── Mom Bubble Component ───
function MomBubble({ expression, text, size }) {
  const sz = size || 85;
  const moodText = expression === "proud" ? "엄마 (자랑스러움! 🌟)" 
                 : expression === "happy" ? "엄마 (기쁨! 😄)" 
                 : expression === "worried" ? "엄마 (걱정... 😟)" 
                 : "엄마 (기본 🙂)";
  return (
    <div style={{ background: C.white, borderRadius: 20, padding: "16px 20px", boxShadow: "0 8px 0px #ECEFF1, 0 8px 24px rgba(0,0,0,0.06)", border: `3.5px solid ${C.grayLight}`, display: "flex", gap: 16, alignItems: "center" }}>
      <div style={{ position: "relative", width: sz, height: sz * 1.1, flexShrink: 0 }}>
        <img src={MOM_IMG} alt="엄마" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 12 }} />
        <span style={{ position: "absolute", bottom: -4, right: -4, background: C.pink, color: C.white, borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, boxShadow: "0 2px 6px rgba(0,0,0,0.2)", fontWeight: "bold" }}>
          {expression === "proud" ? "🌟" : expression === "happy" ? "😄" : expression === "worried" ? "😟" : "🙂"}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: C.pink, marginBottom: 4 }}>{moodText}</div>
        <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-line", color: C.text, fontWeight: 600 }}>{text}</div>
      </div>
    </div>
  );
}

// ─── TopBar ───
function TopBar({ budget, spent, transportTotal, difficulty, stamina }) {
  const rem = budget - spent;
  const pct = Math.max(0,(rem/budget)*100);
  return (
    <div style={{ background: C.white, borderRadius: 20, padding: "12px 16px", marginBottom: 14, boxShadow: "0 8px 0px #ECEFF1, 0 8px 20px rgba(0,0,0,0.04)", border: `3.5px solid ${C.grayLight}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:13, color:C.textLight, fontWeight: 700 }}>💰 남은 예산</span>
        <span style={{ fontSize:15, fontWeight:900, color:rem<budget*0.2?C.red:C.green }}>{fmt(rem)}</span>
      </div>
      <div style={{ background:C.grayLight, borderRadius:8, height:10, overflow: "hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", borderRadius:8, background:pct<20?C.red:pct<40?C.orange:C.green, transition:"width 0.4s" }} />
      </div>
      {transportTotal > 0 && <div style={{ fontSize:11, color:C.textLight, marginTop:4, textAlign:"right", fontWeight: 600 }}>🚇 누적 교통비: {fmt(transportTotal)}</div>}
      {difficulty === "hard" && (
        <div style={{ marginTop:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ fontSize:13, color:C.textLight, fontWeight: 700 }}>🏃 남은 체력</span>
            <span style={{ fontSize:13, fontWeight:900, color:stamina<30?C.red:stamina<60?C.orange:C.stamina }}>{stamina}/100</span>
          </div>
          <div style={{ background:C.grayLight, borderRadius:8, height:10, overflow: "hidden" }}>
            <div style={{ width:`${stamina}%`, height:"100%", borderRadius:8, background:stamina<30?C.red:stamina<60?C.orange:C.stamina, transition:"width 0.4s" }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Screens ───
function IntroScreen({ onStart }) {
  return (
    <div style={{ textAlign:"center", paddingTop:20 }}>
      <div style={{ fontSize:72, marginBottom:4, filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.1))" }}>🛒</div>
      <h1 style={{ fontSize:32, fontWeight:900, color:C.pink, margin:"0 0 6px", letterSpacing: "-1px" }}>시장에 가면</h1>
      <p style={{ fontSize:14, color:C.textLight, margin:"0 0 28px", fontWeight: 600 }}>서울의 전통시장과 마트에서 경제 관념을 배워요!</p>
      <div style={{ ...S.card, textAlign:"left", marginBottom:24 }}>
        <h3 style={{ fontSize:16, fontWeight:900, margin:"0 0 10px", color:C.pink }}>🎯 합리적 심부름 미션</h3>
        <p style={{ fontSize:14, lineHeight:1.8, margin:0, fontWeight: 600 }}><b>물건값</b>과 <b>교통비</b>, 그리고 소비의 <b>유혹</b>까지 조절하며 엄마가 내준 미션을 성공시켜 보세요.</p>
      </div>
      <button onClick={onStart} className="clay-btn" style={{ ...S.btn(C.pink), width:"100%", fontSize:18, padding:"16px 0" }}>심부름 시작하기 🚀</button>
    </div>
  );
}

function DifficultyScreen({ onSelect }) {
  return (
    <div>
      <h2 style={{ fontSize:22, fontWeight:900, textAlign:"center", margin:"20px 0 6px" }}>⚡ 난이도 선택</h2>
      <p style={{ textAlign:"center", fontSize:14, color:C.textLight, margin:"0 0 24px", fontWeight: 600 }}>심부름의 난이도를 결정해 주세요.</p>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <button onClick={()=>onSelect("easy")} className="clay-card-hover" style={{ ...S.card, cursor:"pointer", textAlign:"left", border:`3.5px solid ${C.green}`, display:"block", width:"100%", padding:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
            <span style={{ fontSize:38 }}>😊</span>
            <div><div style={{ fontWeight:900, fontSize:18, color:C.green }}>쉬움 모드</div><span style={S.tag(C.greenLight,C.green)}>입문용 추천</span></div>
          </div>
          <p style={{ fontSize:13, color:C.textLight, margin:0, lineHeight:1.6, fontWeight: 600 }}>시장 3곳 + 마트 1곳에서 골라요.<br/>방문지는 최대 2곳! 체력 제약 없이 장보기에 집중해요.</p>
        </button>
        <button onClick={()=>onSelect("hard")} className="clay-card-hover" style={{ ...S.card, cursor:"pointer", textAlign:"left", border:`3.5px solid ${C.red}`, display:"block", width:"100%", padding:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
            <span style={{ fontSize:38 }}>🔥</span>
            <div><div style={{ fontWeight:900, fontSize:18, color:C.red }}>어려움 모드</div><span style={S.tag(C.redLight,C.red)}>고급 도전자용</span></div>
          </div>
          <p style={{ fontSize:13, color:C.textLight, margin:0, lineHeight:1.6, fontWeight: 600 }}>시장 5곳 + 마트 3곳의 넓은 서울 맵!<br/>최대 3곳 방문 가능하며, <b>🏃 체력 관리</b>도 필요해요.</p>
        </button>
      </div>
    </div>
  );
}

function MissionScreen({ onSelect }) {
  return (
    <div>
      <h2 style={{ fontSize:22, fontWeight:900, textAlign:"center", margin:"12px 0 6px" }}>📋 미션 선택</h2>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {MISSIONS.map(m=>(
          <button key={m.id} onClick={()=>onSelect(m)} className="clay-card-hover" style={{ ...S.card, cursor:"pointer", textAlign:"left", border:`3.5px solid ${C.grayLight}`, display:"block", width:"100%", padding:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
              <span style={{ fontSize:32 }}>{m.emoji}</span>
              <div><div style={{ fontWeight:900, fontSize:17 }}>{m.title}</div><span style={S.tag(C.pinkLight,C.pink)}>예산 {fmt(m.budget)}</span></div>
            </div>
            <p style={{ fontSize:13, color:C.textLight, margin:"0 0 10px", fontWeight: 600 }}>{m.desc}</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
              {m.required.map((it,i)=><span key={i} style={{ ...S.tag(C.grayLight,C.grayDark), fontSize:11 }}>{it.emoji} {it.name}</span>)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DistrictScreen({ onSelect }) {
  return (
    <div>
      <h2 style={{ fontSize:22, fontWeight:900, textAlign:"center", margin:"12px 0 4px" }}>📍 출발 동네 선택</h2>
      <div style={{ ...S.card, padding:14, marginBottom:16, background:C.blueLight, border:`3.5px solid ${C.blue}` }}>
        <p style={{ margin:0, fontSize:13, lineHeight:1.6, fontWeight: 700 }}>💡 동네에 따라 상점과의 거리(교통비, 체력 소모)가 달라집니다!</p>
      </div>
      {AREA_ORDER.map(area=>(
        <div key={area} style={{ marginBottom:14 }}>
          <div style={{ ...S.tag(AREA_CLR[area]+"22",AREA_CLR[area]), marginBottom:8, fontSize:13 }}>{area} 권역</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {DISTRICTS.filter(d=>d.a===area).map(d=>(
              <button key={d.id} onClick={()=>onSelect(d)} className="clay-btn" style={{ background:C.white, border:`2.5px solid ${C.grayLight}`, borderRadius:12, padding:"8px 14px", fontSize:14, fontWeight:900, cursor:"pointer", boxShadow: "0 3px 0px rgba(0,0,0,0.1)", color: C.text }}>{d.name}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BriefingScreen({ mission, district, difficulty, onGo }) {
  return (
    <div style={{ 
      backgroundImage: "url('/images/board_game_card_frame.png')", 
      backgroundSize: "100% 100%", 
      padding: "60px 45px 50px 45px", 
      boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
      borderRadius: 24,
      backgroundPosition: "center"
    }}>
      <div style={{ textAlign:"center", marginBottom:12 }}>
        <span style={{ ...S.tag(C.pinkLight,C.pink), fontSize:14, fontWeight: "900", padding: "6px 16px", borderRadius: 12 }}>
          {mission.emoji} {mission.title}
        </span>
      </div>
      
      <MomBubble expression="normal" text={MOM_BRIEFING[mission.id]} size={72} />
      
      <div style={{ ...S.card, marginTop:12, padding:14, background: "rgba(255,255,255,0.9)", border: `2.5px dashed ${C.pink}` }}>
        <div style={{ fontSize:13, fontWeight:900, marginBottom:6, color: C.pink }}>🛒 사와야 할 물건 목록</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {mission.required.map((r,i)=><span key={i} style={{ ...S.tag(C.pinkLight,C.pink), fontSize:11 }}>{r.emoji} {r.name}</span>)}
          {mission.optional.map((o,i)=><span key={`o${i}`} style={{ ...S.tag(C.orangeLight,C.orange), fontSize:11 }}>{o.emoji} {o.name} (선택)</span>)}
        </div>
      </div>
      
      <div style={{ ...S.card, marginTop:8, padding:12, display:"flex", justifyContent:"space-between", alignItems:"center", background: "rgba(255,255,255,0.9)" }}>
        <span style={{ fontSize:13, fontWeight: 800, color: C.textLight }}>💰 지원받은 용돈</span>
        <span style={{ fontSize:18, fontWeight:900, color:C.pink }}>{fmt(mission.budget)}</span>
      </div>
      
      <div style={{ display:"flex", gap:6, marginTop:10 }}>
        <div style={{ ...S.tag(C.pinkLight,C.pink), fontSize:11, flex: 1, textAlign: "center" }}>📍 {district.name} 출발</div>
        <div style={{ ...S.tag(difficulty==="hard"?C.redLight:C.greenLight, difficulty==="hard"?C.red:C.green), fontSize:11, flex: 1, textAlign: "center" }}>{DIFF[difficulty].label} 난이도</div>
      </div>
      
      <button onClick={onGo} className="clay-btn" style={{ ...S.btn(C.pink), width:"100%", marginTop:16, fontSize:16, padding:"12px 0", borderRadius: 14 }}>
        심부름 출발! 🏃
      </button>
    </div>
  );
}

// ─── Seoul Map Boundary Clamp Utility ───
function clampPan(x, y, s) {
  // 1000x1000 SVG ViewBox 단위 기준 경계 제한
  const minX = 1000 - 1000 * s;
  const minY = 1000 - 1000 * s;
  return {
    x: Math.min(0, Math.max(minX, x)),
    y: Math.min(0, Math.max(minY, y))
  };
}

// ─── Seoul Map ───
function SeoulMap({ locations, onPin, visited, selPin, district }) {
  const [scale, setScale] = useState(1.1);
  const [pan, setPan] = useState(() => clampPan(-100, -100, 1.1));
  const [isDragging, setIsDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: -100, y: -100 });
  const [hoveredPin, setHoveredPin] = useState(null);
  const movedRef = useRef(false);
  const pinchRef = useRef(null);
  const svgRef = useRef(null);

  // ── Mouse handlers (desktop) ──
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStart({ x: e.clientX, y: e.clientY });
    setStartPan({ ...pan });
    movedRef.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const viewDX = dx * (1000 / rect.width);
    const viewDY = dy * (1000 / rect.height);
    const nextX = startPan.x + viewDX;
    const nextY = startPan.y + viewDY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true;
    setPan(clampPan(nextX, nextY, scale));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const nextScale = Math.min(2.5, Math.max(1.0, scale - e.deltaY * 0.0015));
    setScale(nextScale);
    setPan(clampPan(pan.x, pan.y, nextScale));
  };

  // ── Touch handlers (mobile) ──
  const getTouchDist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  const handleTouchStart = (e) => {
    e.preventDefault();
    const t = e.touches;
    if (t.length === 1) {
      setIsDragging(true);
      setStart({ x: t[0].clientX, y: t[0].clientY });
      setStartPan({ ...pan });
      movedRef.current = false;
    } else if (t.length === 2) {
      setIsDragging(false);
      pinchRef.current = { dist: getTouchDist(t), scale, pan: { ...pan } };
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const t = e.touches;
    if (t.length === 1 && isDragging) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const dx = t[0].clientX - start.x;
      const dy = t[0].clientY - start.y;
      const viewDX = dx * (1000 / rect.width);
      const viewDY = dy * (1000 / rect.height);
      const nextX = startPan.x + viewDX;
      const nextY = startPan.y + viewDY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true;
      setPan(clampPan(nextX, nextY, scale));
    } else if (t.length === 2 && pinchRef.current) {
      movedRef.current = true;
      const newDist = getTouchDist(t);
      const ratio = newDist / pinchRef.current.dist;
      const nextScale = Math.min(2.5, Math.max(1.0, pinchRef.current.scale * ratio));
      setScale(nextScale);
      setPan(clampPan(pinchRef.current.pan.x, pinchRef.current.pan.y, nextScale));
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length === 0) {
      setIsDragging(false);
      pinchRef.current = null;
    }
  };

  // Pin click guard: only fire if not dragged
  const handlePinClick = (loc) => {
    if (movedRef.current) return;
    onPin(loc);
  };

  // 출발지 좌표 구하기
  const startCoord = DISTRICT_COORDS[district?.id] || { x: 500, y: 500 };

  // 선택된 핀의 좌표 구하기
  let selX = 0, selY = 0;
  if (selPin) {
    const selLoc = locations.find(l => l.id === selPin);
    if (selLoc) {
      selX = selLoc.x * 10;
      selY = selLoc.y * 10;
      if (selLoc.id === "gwangjang") { selX = 680; selY = 460; }
      else if (selLoc.id === "mangwon") { selX = 150; selY = 640; }
      else if (selLoc.id === "namdaemun") { selX = 560; selY = 390; }
      else if (selLoc.id === "mart_a") { selX = 800; selY = 790; }
      else if (selLoc.id === "gyeongdong") { selX = 850; selY = 300; }
      else if (selLoc.id === "tongin") { selX = 200; selY = 320; }
      else if (selLoc.id === "mart_b") { selX = 320; selY = 820; }
      else if (selLoc.id === "mart_c") { selX = 800; selY = 180; }
    }
  }

  return (
    <div 
      style={{ 
        width: "100%", 
        maxWidth: 600, 
        margin: "0 auto", 
        aspectRatio: "1 / 1", 
        overflow: "hidden", 
        borderRadius: 24, 
        border: `3.5px solid ${C.grayLight}`, 
        background: C.mapLand, 
        position: "relative", 
        cursor: isDragging ? "grabbing" : "grab", 
        boxShadow: "inset 0 4px 12px rgba(0,0,0,0.08)", 
        touchAction: "none", 
        userSelect: "none" 
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <svg 
        ref={svgRef}
        viewBox="0 0 1000 1000" 
        style={{ width: "100%", height: "100%", userSelect: "none" }}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`} style={{ transformOrigin: "50% 50%", transition: isDragging ? "none" : "transform 0.1s ease-out" }}>
          {/* 서울 그림 지도 일러스트 배경 */}
          <image href="/images/seoul_game_map.png" x="0" y="0" width="1000" height="1000" />

          {/* 한글 랜드마크 및 지역 텍스트 */}
          <g opacity="0.8" style={{ pointerEvents: "none" }}>
            <text x="520" y="140" fontSize="14" fill="#2E7D32" fontWeight="900" textAnchor="middle">북한산 국립공원</text>
            <text x="500" y="445" fontSize="13" fill="#37474F" fontWeight="900" textAnchor="middle">🗼 N서울타워</text>
            <text x="460" y="270" fontSize="12" fill="#5D4037" fontWeight="900" textAnchor="middle">🏯 경복궁</text>
            <text x="490" y="565" fontSize="16" fill="#1565C0" fontWeight="900" letterSpacing="6" textAnchor="middle">한 강</text>

            <text x="180" y="480" fontSize="11" fill="#78909C" fontWeight="800" textAnchor="middle">마포</text>
            <text x="720" y="770" fontSize="11" fill="#78909C" fontWeight="800" textAnchor="middle">강남</text>
            <text x="580" y="810" fontSize="11" fill="#78909C" fontWeight="800" textAnchor="middle">서초</text>
            <text x="480" y="380" fontSize="11" fill="#78909C" fontWeight="800" textAnchor="middle">중구</text>
            <text x="400" y="310" fontSize="11" fill="#78909C" fontWeight="800" textAnchor="middle">종로</text>
            <text x="820" y="140" fontSize="11" fill="#78909C" fontWeight="800" textAnchor="middle">노원</text>
            <text x="280" y="640" fontSize="11" fill="#78909C" fontWeight="800" textAnchor="middle">영등포</text>
          </g>

          {/* 출발지에서 선택한 핀으로의 경로선 및 교통비 배지 */}
          {selPin && district && (
            <g>
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="25" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={C.red} />
                </marker>
              </defs>
              <path 
                d={`M ${startCoord.x} ${startCoord.y} L ${selX} ${selY}`} 
                fill="none" 
                stroke={C.red} 
                strokeWidth="4.5" 
                strokeDasharray="8 6" 
                markerEnd="url(#arrow)" 
                opacity="0.85" 
              />
              {(() => {
                const midX = (startCoord.x + selX) / 2;
                const midY = (startCoord.y + selY) / 2;
                const selLoc = locations.find(l => l.id === selPin);
                const tc = selLoc ? calcTC(district.id, selLoc.dist) : 0;
                const badgeText = tc === 0 ? "🚶 도보이동" : `🚇 교통비 ${fmt(tc)}`;
                const badgeW = tc === 0 ? 76 : 100;
                const badgeH = 22;
                return (
                  <g transform={`translate(${midX - badgeW/2}, ${midY - badgeH/2})`}>
                    <rect width={badgeW} height={badgeH} rx={11} fill={C.white} stroke={C.red} strokeWidth="2.5" />
                    <text x={badgeW/2} y={badgeH/2 + 0.5} fontSize="10" fill={C.text} fontWeight="900" textAnchor="middle" dominantBaseline="central">
                      {badgeText}
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* 출발지 3D 핀 렌더링 */}
          {district && (
            <g transform={`translate(${startCoord.x}, ${startCoord.y})`} style={{ pointerEvents: "none" }}>
              <image href="/images/start_pin.png" x="-25" y="-50" width="50" height="50" />
              <rect x="-40" y="5" width="80" height="18" rx="9" fill={C.red} stroke={C.white} strokeWidth="1.5" />
              <text x="0" y="14" fontSize="10" fill={C.white} fontWeight="900" textAnchor="middle" dominantBaseline="central">
                📍 {district.name}
              </text>
            </g>
          )}

          {/* 상점 핀 렌더링 */}
          {locations.map(loc => {
            let cx = loc.x * 10;
            let cy = loc.y * 10;
            
            if (loc.id === "gwangjang") { cx = 680; cy = 460; }
            else if (loc.id === "mangwon") { cx = 150; cy = 640; }
            else if (loc.id === "namdaemun") { cx = 560; cy = 390; }
            else if (loc.id === "mart_a") { cx = 800; cy = 790; }
            else if (loc.id === "gyeongdong") { cx = 850; cy = 300; }
            else if (loc.id === "tongin") { cx = 200; cy = 320; }
            else if (loc.id === "mart_b") { cx = 320; cy = 820; }
            else if (loc.id === "mart_c") { cx = 800; cy = 180; }

            const iv = visited.includes(loc.id), isSel = selPin === loc.id;
            const tc = calcTC(district.id, loc.dist);
            const isHovered = hoveredPin === loc.id;
            const showTooltip = isSel || isHovered;

            const pw = 50;
            const ph = 50;
            const px = cx - pw/2;
            const py = cy - ph;

            const pinImg = loc.type === "market" ? "/images/traditional_market_pin.png" : "/images/mart_pin.png";

            return (
              <g 
                key={loc.id} 
                className={`map-pin-hover ${isSel ? "map-pin-active" : ""}`} 
                opacity={iv ? 0.45 : 1}
              >
                {/* 3D 부루마블 핀 이미지 (마우스 반응 차단) */}
                <image href={pinImg} x={px} y={py} width={pw} height={ph} style={{ pointerEvents: "none" }} />

                {/* 핀 이름 (기본 노출용 소형 말풍선) (마우스 반응 차단) */}
                {!showTooltip && (
                  <g transform={`translate(${cx - 40}, ${cy + 4})`} style={{ pointerEvents: "none" }}>
                    <rect width="80" height="18" rx="9" fill={C.white} stroke={loc.color} strokeWidth="1.5" />
                    <text x="40" y="9.5" fontSize="10" fill={C.text} fontWeight="900" textAnchor="middle" dominantBaseline="central">
                      {loc.name}
                    </text>
                  </g>
                )}

                {/* 상세 툴팁 카드 (호버/선택 시) (마우스 반응 차단) */}
                {showTooltip && (
                  <g transform={`translate(${cx - 75}, ${cy - ph - 65})`} style={{ pointerEvents: "none" }}>
                    <rect x="0" y="3" width="150" height="56" rx="12" fill="rgba(0,0,0,0.15)" />
                    <rect x="0" y="0" width="150" height="56" rx="12" fill={C.white} stroke={loc.color} strokeWidth="3" />
                    
                    <text x="75" y="14" fontSize="11" fill={C.text} fontWeight="900" textAnchor="middle" dominantBaseline="central">
                      {loc.name}
                    </text>
                    <text x="75" y="29" fontSize="9" fill={loc.color} fontWeight="800" textAnchor="middle" dominantBaseline="central">
                      ✨ {loc.spec}
                    </text>
                    <text x="75" y="43" fontSize="9" fill={C.textLight} fontWeight="800" textAnchor="middle" dominantBaseline="central">
                      {tc === 0 ? "🚶 도보 이동 가능" : `🚇 교통비: ${fmt(tc)}`}
                    </text>
                  </g>
                )}

                {/* 방문 완료 체크 배지 (마우스 반응 차단) */}
                {iv && (
                  <g transform={`translate(${cx + 12}, ${cy - ph + 8})`} style={{ pointerEvents: "none" }}>
                    <circle cx="0" cy="0" r="9" fill={C.green} stroke={C.white} strokeWidth="1.5"/>
                    <text x="0" y="1" fontSize="9" fill={C.white} fontWeight="900" textAnchor="middle" dominantBaseline="central">✓</text>
                  </g>
                )}

                {/* 실질적 마우스 이벤트 감지 투명 히트박스 (레이아웃 변동 없는 이벤트 수신기) */}
                <rect
                  x={cx - 40}
                  y={cy - 50}
                  width="80"
                  height="72"
                  fill="transparent"
                  style={{ cursor: iv ? "default" : "pointer" }}
                  onClick={() => !iv && handlePinClick(loc)}
                  onMouseEnter={() => !iv && setHoveredPin(loc.id)}
                  onMouseLeave={() => setHoveredPin(null)}
                />
              </g>
            );
          })}
        </g>
      </svg>
      {/* 줌 컨트롤 버튼 */}
      <div style={{ position: "absolute", top: 12, right: 12, display: "flex", flexDirection: "column", gap: 4, zIndex: 10 }}>
        <button onClick={(e) => { e.stopPropagation(); const ns = Math.min(2.5, scale + 0.3); setScale(ns); setPan(clampPan(pan.x, pan.y, ns)); }} style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${C.grayLight}`, background: "rgba(255,255,255,0.95)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>+</button>
        <button onClick={(e) => { e.stopPropagation(); const ns = Math.max(1.0, scale - 0.3); setScale(ns); setPan(clampPan(pan.x, pan.y, ns)); }} style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${C.grayLight}`, background: "rgba(255,255,255,0.95)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>−</button>
        {scale > 1.15 && <button onClick={(e) => { e.stopPropagation(); setScale(1.1); setPan(clampPan(-100, -100, 1.1)); }} style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${C.grayLight}`, background: "rgba(255,255,255,0.95)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>↺</button>}
      </div>
      {/* 지도 조작 가이드 */}
      <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(255,255,255,0.95)", borderRadius: 10, padding: "6px 12px", fontSize: 11, pointerEvents: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", border: `1px solid ${C.grayLight}`, display: "flex", gap: 8, fontWeight: "bold" }}>
        <span>👆 드래그로 이동</span>
        <span>🤏 핀치/휠로 확대</span>
      </div>
    </div>
  );
}

function MapScreen({ mission, visited, cart, spent, district, difficulty, stamina, locations, onVisit, onFinish }) {
  const [selPin, setSelPin] = useState(null);
  const sel = locations.find(l=>l.id===selPin);
  const cfg = DIFF[difficulty];
  const canMore = visited.length < cfg.maxVisits;
  const hasAll = mission.required.every(r=>cart.some(c=>c.name===r.name));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:6, marginBottom:6, flexWrap:"wrap" }}>
        <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>🗺️ 서울 지도</h2>
        <span style={{ ...S.tag(C.pinkLight,C.pink), fontSize:11 }}>📍 출발: {district.name}</span>
        <span style={{ ...S.tag(difficulty==="hard"?C.redLight:C.greenLight, difficulty==="hard"?C.red:C.green), fontSize:11 }}>{cfg.label}</span>
      </div>
      <p style={{ textAlign:"center", fontSize:13, color:C.textLight, margin:"0 0 8px", fontWeight: "bold" }}>
        {visited.length===0?"장보러 갈 곳을 눌러주세요!":canMore?`${cfg.maxVisits-visited.length}곳 더 갈 수 있어요!`:"방문 완료!"}
      </p>
      <SeoulMap locations={locations} onPin={l=>setSelPin(l.id===selPin?null:l.id)} visited={visited} selPin={selPin} district={district}/>

      {sel && !visited.includes(sel.id) && canMore && (()=>{
        const tc = calcTC(district.id, sel.dist);
        const sc = staminaCostFor(tc);
        const rem = mission.budget - spent;
        const canAfford = rem >= tc;
        const canStamina = !cfg.stamina || stamina >= sc;
        return (
          <div style={{ ...S.card, marginTop:12, padding:16, border:`3.5px solid ${sel.color}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <span style={{ fontSize:28 }}>{sel.emoji}</span>
              <div>
                <div style={{ fontWeight:900, fontSize:16 }}>{sel.name}</div>
                <div style={{ fontSize:12, color:C.textLight, fontWeight: 700 }}>{DISTRICTS.find(d=>d.id===sel.dist)?.name} · {sel.desc}</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
              <span style={S.tag(sel.type==="market"?C.pinkLight:C.blueLight, sel.type==="market"?C.pink:C.blueDark)}>{sel.spec}</span>
              <span style={S.tag(tc===0?C.greenLight:C.orangeLight, tc===0?C.green:C.orange)}>{tc===0?"🚶 도보 (0원)":`🚇 ${fmt(tc)}`}</span>
              {cfg.stamina && <span style={S.tag(sc<=15?"#FFF3E0":"#FFEBEE", sc<=15?C.orange:C.red)}>🏃 체력 -{sc}</span>}
            </div>
            {tc>0 && <div style={{ background:C.orangeLight, borderRadius:10, padding:"6px 12px", marginBottom:8, fontSize:12, fontWeight: 700 }}>⚠️ 교통비 <b>{fmt(tc)}</b> 차감 (남은 돈: {fmt(rem)}→{fmt(rem-tc)})</div>}
            {cfg.stamina && sc>15 && <div style={{ background:C.redLight, borderRadius:10, padding:"6px 12px", marginBottom:8, fontSize:12, fontWeight: 700 }}>🏃 체력 <b>-{sc}</b> (현재: {stamina}→{stamina-sc})</div>}
            {canAfford && canStamina
              ? <button onClick={()=>{onVisit(sel);setSelPin(null)}} className="clay-btn" style={{ ...S.btn(sel.color), width:"100%", fontSize:15 }}>이 곳으로 출발! 🚶</button>
              : <div style={{ textAlign:"center", color:C.red, fontWeight:900, fontSize:14 }}>{!canAfford?"💸 교통비 부족":"🏃 체력 부족 (쉬어야 해요!)"}</div>}
          </div>
        );
      })()}

      {visited.length>0 && (
        <div style={{ ...S.card, marginTop:12, padding:14 }}>
          <div style={{ fontSize:13, fontWeight:800, marginBottom:8 }}>🛒 장바구니</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {mission.required.map((r,i)=>{const b=cart.find(c=>c.name===r.name);return <span key={i} style={S.tag(b?C.greenLight:C.redLight, b?C.green:C.red)}>{b?"✅":"❌"} {r.name}</span>;})}
          </div>
        </div>
      )}
      {visited.length>0 && <button onClick={onFinish} className="clay-btn" style={{ ...S.btn(hasAll?C.green:C.orange), width:"100%", marginTop:12, fontSize:15 }}>{hasAll?"장보기 완료! 🎉":"⚠️ 필수 물건 부족 (그래도 끝내기)"}</button>}
    </div>
  );
}

// ─── Price Compare ───
function PriceCompare({ item, curLocId, district, locations, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }} onClick={onClose}>
      <div style={{ ...S.card, maxWidth:400, width:"100%", padding:18, maxHeight:"80vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <h3 style={{ margin:"0 0 12px", fontSize:15, fontWeight:900 }}>📊 {item.emoji} {item.name} 가격 비교</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:C.gray }}>✕</button>
        </div>
        <div style={{ fontSize:11, color:C.textLight, marginBottom:8, fontWeight: 700 }}>📍 출발지({district.name}) 기준 [물건값+교통비] 비교</div>
        {locations.map(loc=>{
          const p = item.prices[loc.id], tc = calcTC(district.id, loc.dist), tot = p + tc;
          const allTot = locations.map(l=>item.prices[l.id]+calcTC(district.id,l.dist));
          const best = tot===Math.min(...allTot);
          return (
            <div key={loc.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 10px", marginBottom:3, borderRadius:8, background:loc.id===curLocId?C.pinkLight:best?C.greenLight:C.grayLight, fontSize:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:14 }}>{loc.emoji}</span>
                <span style={{ fontWeight:700, fontSize:12 }}>{loc.name}</span>
                {loc.id===curLocId && <span style={{ ...S.tag(C.pink,C.white), fontSize:9 }}>현재</span>}
              </div>
              <div style={{ textAlign:"right" }}>
                <span style={{ color:C.textLight, fontWeight: 600 }}>{fmt(p)}+🚇{fmt(tc)}</span>
                <span style={{ fontWeight:900, fontSize:13, color:best?C.green:C.text, marginLeft:6 }}>={fmt(tot)}{best?" ✨":""}</span>
              </div>
            </div>
          );
        })}
        <div style={{ marginTop:8, fontSize:11, color:C.blueDark, textAlign:"center", background:C.blueLight, borderRadius:8, padding:6, fontWeight: "bold" }}>💡 물건값 + 교통비 = 총비용으로 비교!</div>
      </div>
    </div>
  );
}

function ShoppingScreen({ location, mission, cart, budget, spent, district, locations, onBuy, onDone, discountLocs, solvedLocs, onSolveQuiz }) {
  const [cmpItem, setCmpItem] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [activeQuiz] = useState(() => pick(QUIZZES));
  
  const isSolved = solvedLocs.includes(location.id);
  const isDiscounted = discountLocs.includes(location.id);
  const rem = budget - spent;
  const all = [...mission.required, ...mission.optional];

  const shopBg = location.type === "market" 
    ? "/images/traditional_market_1781675804324.png"
    : "/images/supermarket_interior_1781675823612.png";

  return (
    <div>
      {cmpItem && <PriceCompare item={cmpItem} curLocId={location.id} district={district} locations={locations} onClose={()=>setCmpItem(null)}/>}
      
      {/* RPG-style Location Graphic Card */}
      <div style={{ position: "relative", height: 180, borderRadius: 20, overflow: "hidden", marginBottom: 14, boxShadow: "0 8px 0px #ECEFF1, 0 8px 20px rgba(0,0,0,0.15)", border: `3.5px solid ${C.grayLight}` }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${shopBg})`, backgroundSize: "cover", backgroundPosition: "center", height: "100%" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1))" }} />
        <div style={{ position: "absolute", bottom: 14, left: 16, right: 16, color: C.white, textAlign: "left" }}>
          <span style={{ fontSize: 32 }}>{location.emoji}</span>
          <h2 style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 900 }}>{location.name}</h2>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.9, fontWeight: 600 }}>{location.spec}</p>
        </div>
      </div>

      {/* Bargain Quiz Banner */}
      {!isSolved ? (
        <div style={{ ...S.card, padding: 12, marginBottom: 12, background: C.orangeLight, border: `3.5px dashed ${C.orange}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 800 }}>💡 흥정 퀴즈를 맞춰 10% 할인을 받아보세요!</span>
          <button onClick={() => setShowQuiz(true)} className="clay-btn" style={{ ...S.btn(C.orange), padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>퀴즈 풀기 ⚡</button>
        </div>
      ) : isDiscounted ? (
        <div style={{ ...S.card, padding: 12, marginBottom: 12, background: C.greenLight, border: `3.5px solid ${C.green}`, textAlign: "center", fontSize: 13, fontWeight: 800, color: C.greenDark }}>
          🎉 흥정 성공! 모든 물건이 10% 할인된 가격으로 적용됩니다!
        </div>
      ) : (
        <div style={{ ...S.card, padding: 12, marginBottom: 12, background: C.grayLight, border: `3.5px solid ${C.gray}`, textAlign: "center", fontSize: 12, color: C.textLight, fontWeight: "bold" }}>
          😔 흥정 실패! 정상가로 장을 봅니다.
        </div>
      )}

      {/* Quiz Pop-up Modal */}
      {showQuiz && activeQuiz && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300, padding:16 }}>
          <div style={{ ...S.card, maxWidth:380, width:"100%", padding:20 }}>
            <h3 style={{ margin:"0 0 12px", fontSize:16, color:C.orange, fontWeight: 900 }}>⚡ 흥정 퀴즈!</h3>
            <p style={{ fontSize:14, lineHeight:1.6, marginBottom:16, fontWeight:800 }}>{activeQuiz.q}</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {activeQuiz.options.map((opt, idx) => (
                <button key={idx} onClick={() => {
                  const correct = opt === activeQuiz.a;
                  if (correct) {
                    playSFX("success");
                    alert("정답입니다! 10% 할인이 적용됩니다.");
                  } else {
                    playSFX("fail");
                    alert(`아쉽게도 오답입니다! 정답은 [${activeQuiz.a}] 입니다.`);
                  }
                  onSolveQuiz(location.id, correct);
                  setShowQuiz(false);
                }} className="clay-btn" style={{ ...S.btn(C.grayLight, C.text), textAlign:"left", padding:"12px 16px", fontSize:13, fontWeight:900 }}>
                  {idx + 1}. {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {all.map((it,i)=>{
          const rawPrice = it.prices[location.id];
          const p = isDiscounted ? Math.round(rawPrice * 0.9) : rawPrice;
          const inC=cart.find(c=>c.name===it.name);
          const isReq=mission.required.includes(it);
          const cheap=Math.min(...Object.values(it.prices).filter((_,j)=>locations.some(l=>l.id===Object.keys(it.prices)[j])));
          const ok=rem>=p&&!inC;
          return (
            <div key={i} style={{ ...S.card, padding:12, border:inC?`3.5px solid ${C.green}`:`3.5px solid ${C.grayLight}`, opacity:inC?0.65:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:0 }}>
                  <span style={{ fontSize:24 }}>{it.emoji}</span>
                  <div>
                    <div style={{ fontWeight:900, fontSize:14 }}>{it.name}</div>
                    <div style={{ display:"flex", gap:4, marginTop:3, flexWrap:"wrap" }}>
                      <span style={S.tag(isReq?C.pinkLight:C.orangeLight, isReq?C.pink:C.orange)}>{isReq?"필수":"선택"}</span>
                      {rawPrice===cheap && <span style={S.tag(C.greenLight,C.green)}>최저가</span>}
                      {isDiscounted && <span style={S.tag(C.greenLight,C.greenDark)}>10% 할인적용</span>}
                      <button onClick={()=>setCmpItem(it)} style={{ ...S.tag(C.blueLight,C.blueDark), cursor:"pointer", border:"none", fontSize:11 }}>📊비교</button>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                  <div style={{ fontWeight:900, fontSize:16, color:rawPrice===cheap?C.green:C.text }}>
                    {isDiscounted && <span style={{ textDecoration: "line-through", fontSize: 12, color: C.gray, marginRight: 6 }}>{fmt(rawPrice)}</span>}
                    {fmt(p)}
                  </div>
                  {inC?<span style={{ fontSize:11, color:C.green }}>✅</span>
                    :ok?<button onClick={()=>{
                      playSFX("coin");
                      onBuy(it,p,location);
                    }} className="clay-btn" style={{ ...S.btn(C.pink), padding:"5px 14px", fontSize:13, marginTop:3 }}>담기</button>
                    :<span style={{ fontSize:11, color:C.red }}>💸</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={onDone} className="clay-btn" style={{ ...S.btn(C.grayDark), width:"100%", marginTop:14, fontSize:15 }}>이 가게 나가기 →</button>
    </div>
  );
}

function TemptationScreen({ tempt, budget, spent, difficulty, onBuy, onSkip }) {
  const ok=(budget-spent)>=tempt.price;
  const temptBg = "/images/street_food_stall_1781675841701.png";
  
  // 쉬움 난이도인 경우 체력 회복 관련 문구 필터링
  let msg = tempt.msg;
  if (difficulty === "easy") {
    msg = msg
      .replace(/\s*\(체력\s*\+\d+\s*회복\)/g, "")
      .replace("귀엽지만 체력은 안 올라요.", "귀엽고 깜찍해요!")
      .replace("달콤해서 기운이 나요! (체력 +10 회복)", "달콤해서 기분이 좋아져요!")
      .replace("재미있지만 체력은 안 올라요.", "재미있어 보여요!");
  }
  
  return (
    <div style={{ textAlign:"center", paddingTop:16 }}>
      {/* RPG-style Street Temptation Graphic Card */}
      <div style={{ position: "relative", height: 220, borderRadius: 24, overflow: "hidden", marginBottom: 16, boxShadow: "0 8px 0px #ECEFF1, 0 8px 24px rgba(0,0,0,0.15)", border: `3.5px solid ${C.grayLight}` }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${temptBg})`, backgroundSize: "cover", backgroundPosition: "center", height: "100%" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0))" }} />
        <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, color: C.white }}>
          <div style={{ fontSize:14, fontWeight:900, color:C.gold, marginBottom: 4 }}>⚡ 길거리 유혹 이벤트!</div>
          <p style={{ fontSize:15, margin:0, fontWeight: 800, lineHeight:1.5 }}>{msg}</p>
        </div>
      </div>

      <div style={{ ...S.card, marginBottom:20, padding:14, background:C.blueLight, border:`3.5px solid ${C.blue}` }}>
        <p style={{ margin:0, fontSize:14, fontWeight: 700 }}>
          {difficulty === "hard" 
            ? "미션에 필요 없는 물건이에요. 먹으면 체력이 회복돼요! 🤔" 
            : "미션에 필요 없는 물건이에요. 기분 전환으로 사먹을까요? 🤔"}
        </p>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={onSkip} className="clay-btn" style={{ ...S.btn(C.green), flex:1, fontSize:15 }}>✋ 안 살래요!</button>
        {ok?<button onClick={onBuy} className="clay-btn" style={{ ...S.btn(C.red), flex:1, fontSize:15 }}>
          {difficulty === "hard" ? `😋 살래요! (+${tempt.heal} 체력)` : "😋 살래요!"}
        </button>
          :<button disabled className="clay-btn" style={{ ...S.btn(C.gray), flex:1, fontSize:15, opacity:0.5, cursor:"default" }}>💸 부족</button>}
      </div>
    </div>
  );
}

function MomResult({ mission, cart, spent, tBought, tResisted, rational, mood }) {
  const remaining = mission.budget - spent;
  const missing = mission.required.filter(r=>!cart.some(c=>c.name===r.name));

  // Determine expression
  const expr = rational>=80&&mood>=60 ? "proud" : rational>=60 ? "happy" : rational>=40 ? "normal" : "worried";

  // Generate dialogue
  let dialogue = "";
  if (rational >= 80 && mood >= 60) {
    dialogue = `우와~ 우리 아이 정말 잘했다! 필요한 것만 알뜰하게 사왔네. 엄마가 자랑스러워! ${remaining > 0 ? `${fmt(remaining)}이나 남겨오다니 최고야!` : ""}`;
  } else if (missing.length > 0) {
    const missingNames = missing.map(m => m.name).join(", ");
    dialogue = `어라? ${missingNames}은(는) 빼먹고 안 사왔네! 필수 재료인데 깜빡한 모양이구나. 다음에는 꼭 메모를 꼼꼼하게 확인해보자!`;
  } else if (tBought.length > 0) {
    const boughtNames = tBought.map(t => t.name).join(", ");
    dialogue = `필요한 물건은 다 사왔는데... 중간에 ${boughtNames}을(를) 사먹었구나! 맛있긴 했겠지만, 예산이 좀 아깝네. 다음엔 꾹 참아보는 거야!`;
  } else if (rational >= 70 && tResisted > 0) {
    dialogue = `심부름 잘 마쳤구나! 길 가다가 유혹이 많았을 텐데 참느라 정말 기특하고 고생 많았어. 아낀 예산으로 이따 맛있는 거 사줄게!`;
  } else if (remaining < 0) {
    dialogue = `필요한 건 다 사왔는데 예산을 초과해버렸네! 교통비나 물건값을 더 아낄 수 있는 방법을 고민해봤어야지. 다음엔 더 현명하게 장을 봐보자.`;
  } else {
    dialogue = `무사히 장을 봐왔구나. 고생했어! 다음에는 물건값과 교통비를 더 꼼꼼히 비교해서 가장 저렴하게 살 수 있는 곳을 찾아보자!`;
  }

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ textAlign:"center", marginBottom:12 }}>
        <span style={{ fontSize:13, fontWeight:700, color:C.textLight }}>🏠 집에 돌아왔어요!</span>
      </div>
      <MomBubble
        expression={expr}
        text={dialogue}
        size={80}
      />
    </div>
  );
}

// ─── Score bar ───
function SB({ label, score, max, desc, color }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:3 }}>
        <span style={{ fontWeight:700 }}>{label}</span>
        <span style={{ fontWeight:800, color }}>+{score} <span style={{ color:C.gray, fontWeight:400 }}>/{max}</span></span>
      </div>
      <div style={{ background:C.grayLight, borderRadius:6, height:8 }}>
        <div style={{ width:`${Math.min(100,(score/max)*100)}%`, height:"100%", background:color, borderRadius:6, transition:"width 0.8s" }}/>
      </div>
      <div style={{ fontSize:11, color:C.textLight, marginTop:2, fontWeight: "bold" }}>{desc}</div>
    </div>
  );
}

// 최적 경로 탐색 함수
function findOptimalPath(mission, district, locations, maxVisits) {
  const reqItems = mission.required;
  let bestCost = Infinity;
  let bestLocs = [];

  const combinations = [];
  function getCombos(activeList, startIdx, k) {
    if (activeList.length === k) {
      combinations.push([...activeList]);
      return;
    }
    for (let i = startIdx; i < locations.length; i++) {
      activeList.push(locations[i]);
      getCombos(activeList, i + 1, k);
      activeList.pop();
    }
  }

  for (let k = 1; k <= maxVisits; k++) {
    getCombos([], 0, k);
  }

  combinations.forEach(combo => {
    let itemsCost = 0;
    reqItems.forEach(item => {
      let minItemP = Infinity;
      combo.forEach(loc => {
        const price = item.prices[loc.id];
        if (price < minItemP) minItemP = price;
      });
      itemsCost += minItemP;
    });

    let transCost = 0;
    combo.forEach(loc => {
      transCost += calcTC(district.id, loc.dist);
    });

    const totalCost = itemsCost + transCost;
    if (totalCost < bestCost) {
      bestCost = totalCost;
      bestLocs = combo;
    }
  });

  return { bestCost, bestLocs };
}

function ResultScreen({ mission, cart, spent, transportSpent, tBought, tResisted, district, difficulty, stamina, locations, onRestart }) {
  const rem = mission.budget - spent;
  const reqB = mission.required.filter(r=>cart.some(c=>c.name===r.name));
  const allReq = reqB.length===mission.required.length;
  const optB = mission.optional.filter(o=>cart.some(c=>c.name===o.name));
  const notB = mission.required.filter(r=>!cart.some(c=>c.name===r.name));

  const maxVisits = DIFF[difficulty].maxVisits;
  const { bestCost, bestLocs } = findOptimalPath(mission, district, locations, maxVisits);
  const potentialSavings = Math.max(0, spent - bestCost);

  const rM = allReq?40:Math.round((reqB.length/mission.required.length)*20);
  const rB = Math.round(Math.max(0,rem/mission.budget)*25);
  let cheapN=0;
  cart.forEach(ci=>{const mi=[...mission.required,...mission.optional].find(m=>m.name===ci.name);if(mi){const ts=locations.map(l=>mi.prices[l.id]+calcTC(district.id,l.dist));if(ci.pricePaid+calcTC(district.id,ci.locationDist)===Math.min(...ts))cheapN++;}});
  const rC = Math.min(25, cheapN*7);
  const rT = Math.min(10, Math.max(0, tResisted*10 - tBought.length*8));
  const rational = Math.min(100, Math.max(0, rM+rB+rC+rT));

  let mood = 50;
  if(allReq) mood+=15; mood+=optB.length*10; mood+=tBought.length*12; mood-=tResisted*8;
  if(rem>=mission.budget*0.3) mood+=8; mood-=notB.length*10;
  if(rem<mission.budget*0.1&&rem>=0) mood-=5;
  if(difficulty==="hard" && stamina<30) mood-=8;
  if(difficulty==="hard" && stamina>=60) mood+=5;
  mood = Math.min(100, Math.max(0, mood));

  const rH=rational>=70, mH=mood>=55;
  const combo = rH&&mH ? { e:"🌟",t:"완벽한 하루!",m:"합리적으로 선택하고 마음도 뿌듯해요!" }
    : rH&&!mH ? { e:"🧠",t:"심부름은 잘했는데...",m:"현명한 선택이었어요! 아쉬운 마음은 자연스러운 거예요." }
    : !rH&&mH ? { e:"😊",t:"기분은 좋은데...",m:"기분은 좋지만 예산이 걱정돼요!" }
    : { e:"🤗",t:"다음엔 더 잘할 수 있어요!",m:"계획을 세우면 마음도 예산도 만족할 수 있어요!",bg:"green-gradient" }; // custom placeholder

  const finalComboBg = rH&&mH ? "linear-gradient(135deg,#FFF9C4,#DCEDC8)"
    : rH&&!mH ? "linear-gradient(135deg,#E3F2FD,#F3E5F5)"
    : !rH&&mH ? "linear-gradient(135deg,#FFF3E0,#FCE4EC)"
    : "linear-gradient(135deg,#ECEFF1,#F5F5F5)";

  return (
    <div style={{ 
      backgroundImage: "url('/images/board_game_card_frame.png')", 
      backgroundSize: "100% 100%", 
      padding: "60px 45px 50px 45px", 
      boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
      borderRadius: 24,
      backgroundPosition: "center"
    }}>
      <MomResult mission={mission} cart={cart} spent={spent} tBought={tBought} tResisted={tResisted} rational={rational} mood={mood} />

      <div style={{ textAlign:"center", padding:"16px 12px", borderRadius:16, marginBottom:12, background:finalComboBg, border: `2.5px solid ${C.grayLight}` }}>
        <div style={{ fontSize:32 }}>{combo.e}</div>
        <h2 style={{ fontSize:16, fontWeight:900, margin:"2px 0", color:C.text }}>{combo.t}</h2>
        <p style={{ fontSize:12, color:C.grayDark, margin:"4px 0 0", lineHeight:1.5, fontWeight: "bold" }}>{combo.m}</p>
        <div style={{ fontSize:10, color:C.textLight, marginTop:4, fontWeight: "bold" }}>📍 {district.name} · {DIFF[difficulty].label}</div>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <div style={{ flex:1, background:C.white, borderRadius:16, padding:10, textAlign:"center", border:`2.5px solid ${rational>=70?C.green:rational>=50?C.orange:C.red}` }}>
          <div style={{ fontSize:11, fontWeight:800, color:C.textLight }}>🧠 합리적 선택</div>
          <div style={{ fontSize:24, fontWeight:900, color:rational>=70?C.green:rational>=50?C.orange:C.red }}>{rational}</div>
        </div>
        <div style={{ flex:1, background:C.white, borderRadius:16, padding:10, textAlign:"center", border:`2.5px solid ${mood>=65?C.pink:mood>=45?C.orange:C.gray}` }}>
          <div style={{ fontSize:11, fontWeight:800, color:C.textLight }}>💛 마음 만족도</div>
          <div style={{ fontSize:24, fontWeight:900, color:mood>=65?C.pink:mood>=45?C.orange:C.gray }}>{mood}</div>
        </div>
      </div>

      {potentialSavings > 0 && (
        <div style={{ ...S.card, marginBottom: 12, padding: 12, border: `2.5px solid ${C.green}`, background: C.greenLight }}>
          <h3 style={{ fontSize: 13, fontWeight: 900, color: C.greenDark, margin: "0 0 4px" }}>💡 장보기 복기 피드백</h3>
          <p style={{ margin: "0 0 8px", fontSize: 12, lineHeight: 1.5, color: C.text, fontWeight: 600 }}>
            계획을 최적으로 세웠다면 <b>{fmt(potentialSavings)}</b>을 더 아껴서 총 <b>{fmt(bestCost)}</b>에 해결할 수 있었어요!
          </p>
          <div style={{ fontSize: 11, color: C.text, fontWeight: "bold" }}>
            <b>최적의 장보기 코스:</b>
            <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
              {bestLocs.map((loc, i) => (
                <span key={i} style={{ ...S.tag(loc.color, C.white), fontSize: 10 }}>{loc.emoji} {loc.name}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ ...S.card, marginBottom:12, padding: 12 }}>
        <h3 style={{ fontSize:13, fontWeight:900, margin:"0 0 8px" }}>🧠 합리적 선택 점수</h3>
        <SB label="미션 완료" score={rM} max={40} desc={`필수 ${reqB.length}/${mission.required.length}개`} color={C.green}/>
        <SB label="예산 관리" score={rB} max={25} desc={`${fmt(rem)} 절약`} color={C.blue}/>
        <SB label="총비용 비교" score={rC} max={25} desc={`최적가 ${cheapN}건`} color={C.orange}/>
        <SB label="유혹 저항" score={rT} max={10} desc={tBought.length>0?`불필요 ${tBought.length}건`:"잘 참았어요!"} color={C.purple}/>
      </div>

      <div style={{ ...S.card, marginBottom:12, padding: 12, background:"#FFF8F8" }}>
        <h3 style={{ fontSize:13, fontWeight:900, margin:"0 0 8px" }}>💛 마음 분석</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {allReq && <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"4px 8px", background:C.greenLight, borderRadius:8 }}><span>✅ 필수 모두 구매</span><span style={{ color:C.green, fontWeight:700 }}>+15</span></div>}
          {notB.length>0 && <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"4px 8px", background:C.redLight, borderRadius:8 }}><span>😰 {notB.map(n=>n.name).join(", ")} 못 삼</span><span style={{ color:C.red, fontWeight:700 }}>-{notB.length*10}</span></div>}
          {tBought.length>0 && <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"4px 8px", background:C.orangeLight, borderRadius:8 }}><span>😋 {tBought.map(t=>t.name).join(", ")}</span><span style={{ color:C.orange, fontWeight:700 }}>+{tBought.length*12}</span></div>}
          {tResisted>0 && <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"4px 8px", background:C.pinkLight, borderRadius:8 }}><span>😔 {tResisted}번 참음 (아쉬움)</span><span style={{ color:C.pink, fontWeight:700 }}>-{tResisted*8}</span></div>}
          {rem>=mission.budget*0.3 && <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"4px 8px", background:C.greenLight, borderRadius:8 }}><span>😌 돈 넉넉 (안심)</span><span style={{ color:C.green, fontWeight:700 }}>+8</span></div>}
          {difficulty==="hard" && stamina<30 && <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"4px 8px", background:C.redLight, borderRadius:8 }}><span>😫 너무 피곤해요</span><span style={{ color:C.red, fontWeight:700 }}>-8</span></div>}
          {difficulty==="hard" && stamina>=60 && <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"4px 8px", background:C.greenLight, borderRadius:8 }}><span>💪 체력 여유</span><span style={{ color:C.green, fontWeight:700 }}>+5</span></div>}
        </div>
      </div>

      <div style={{ ...S.card, marginBottom:12, padding: 12, background:"linear-gradient(135deg,#FFF9C4,#FFF3E0)", border:`2.5px solid ${C.gold}` }}>
        <div style={{ fontSize:13, fontWeight:900, color:C.grayDark, marginBottom:4 }}>💭 친구와 이야기해 봐요</div>
        <div style={{ fontSize:12, lineHeight:1.6, color:C.text, fontWeight: 600 }}>
          {rH&&!mH?"\"합리적으로 잘 골랐는데 왜 아쉬운 기분이 들까요?\""
            :!rH&&mH?"\"기분은 좋은데 예산이 부족했어요. 둘 다 만족하려면?\""
            :rH&&mH?"\"어떤 점이 합리적이면서도 기분 좋게 만들었을까요?\""
            :"\"다음에 장을 본다면, 어떤 계획을 세울 건가요?\""}
        </div>
      </div>

      <div style={{ ...S.card, marginBottom:12, padding: 12 }}>
        <h3 style={{ fontSize:13, fontWeight:900, margin:"0 0 8px" }}>🧾 영수증</h3>
        {transportSpent>0 && <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:`1px solid ${C.grayLight}`, fontSize:11, color:C.blueDark }}><span>🚇 교통비</span><span style={{ fontWeight:600 }}>{fmt(transportSpent)}</span></div>}
        {cart.map((ci,i)=>(<div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:`1px solid ${C.grayLight}`, fontSize:11 }}><span>{ci.emoji} {ci.name} <span style={{ fontSize:10, color:C.textLight }}>@{ci.locationName}</span></span><span style={{ fontWeight:600 }}>{fmt(ci.pricePaid)}</span></div>))}
        {tBought.map((t,i)=>(<div key={`t${i}`} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", fontSize:11, color:C.red }}><span>{t.emoji} {t.name}</span><span style={{ fontWeight:600 }}>{fmt(t.price)}</span></div>))}
        <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0 0", marginTop:4, borderTop:`2px solid ${C.text}`, fontWeight:900, fontSize:13 }}><span>합계</span><span>{fmt(spent)}</span></div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.green, fontWeight:900, marginTop:2 }}><span>남은 돈</span><span>{fmt(rem)}</span></div>
      </div>

      <button onClick={onRestart} className="clay-btn" style={{ ...S.btn(C.pink), width:"100%", fontSize:15, padding:"12px 0", borderRadius: 14 }}>다시 도전하기 🔄</button>
    </div>
  );
}

// ─── Main App ───
// ─── Main App ───
export default function App() {
  const [screen, setScreen] = useState("intro");
  const [difficulty, setDifficulty] = useState(null);
  const [mission, setMission] = useState(null);
  const [district, setDistrict] = useState(null);
  const [cart, setCart] = useState([]);
  const [spent, setSpent] = useState(0);
  const [transportSpent, setTransportSpent] = useState(0);
  const [stamina, setStamina] = useState(100);
  const [visited, setVisited] = useState([]);
  const [curLoc, setCurLoc] = useState(null);
  const [tBought, setTBought] = useState([]);
  const [tResisted, setTResisted] = useState(0);
  const [curTemp, setCurTemp] = useState(null);
  const [usedT, setUsedT] = useState([]);
  const [discountLocs, setDiscountLocs] = useState([]);
  const [solvedLocs, setSolvedLocs] = useState([]);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const locations = difficulty ? ALL_LOCATIONS.filter(l => difficulty==="hard" || l.mode==="easy") : [];

  const reset = useCallback(()=>{
    setScreen("intro"); setDifficulty(null); setMission(null); setDistrict(null);
    setCart([]); setSpent(0); setTransportSpent(0); setStamina(100);
    setVisited([]); setCurLoc(null); setTBought([]); setTResisted(0);
    setCurTemp(null); setUsedT([]); setDiscountLocs([]); setSolvedLocs([]);
    setDashboardOpen(false);
  },[]);

  const visitLoc = useCallback(loc=>{
    const tc = calcTC(district.id, loc.dist);
    const sc = staminaCostFor(tc);
    setSpent(s=>s+tc); setTransportSpent(ts=>ts+tc);
    if(difficulty==="hard") setStamina(st=>Math.max(0,st-sc));
    setCurLoc(loc); setVisited(v=>[...v,loc.id]); setScreen("shopping");
  },[district,difficulty]);

  const buyItem = useCallback((it,p,loc)=>{
    setCart(c=>[...c,{...it,pricePaid:p,locationId:loc.id,locationName:loc.name,locationDist:loc.dist}]);
    setSpent(s=>s+p);
  },[]);

  const doneShopping = useCallback(()=>{
    const avail=TEMPTATIONS.filter(t=>!usedT.includes(t.name));
    if(avail.length>0){const t=pick(avail);setCurTemp(t);setUsedT(u=>[...u,t.name]);setScreen("temptation");}
    else setScreen("map");
  },[usedT]);

  const showBar = screen!=="intro"&&screen!=="difficulty"&&screen!=="mission"&&screen!=="district"&&screen!=="briefing"&&mission;

  return (
    <div className="game-layout" style={{ fontFamily: "'Pretendard','Noto Sans KR',system-ui,sans-serif" }}>
      <style>{`
        @keyframes pin-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .map-pin-active {
          animation: pin-bounce 0.8s infinite ease-in-out;
        }
        .map-pin-hover {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .map-pin-hover:hover {
          filter: brightness(0.95);
          transform: scale(1.05);
        }
        .game-layout {
          min-height: 100vh;
          background: #FFF8F0;
        }
        
        /* Claymorphism Interactive styles */
        .clay-btn {
          transition: transform 0.1s ease, box-shadow 0.1s ease, filter 0.2s ease !important;
        }
        .clay-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 0px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1) !important;
          filter: brightness(1.05);
        }
        .clay-btn:active {
          transform: translateY(4px) !important;
          box-shadow: 0 2px 0px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.08) !important;
        }
        .clay-btn:disabled {
          transform: none !important;
          box-shadow: none !important;
          filter: grayscale(1) opacity(0.6);
          cursor: not-allowed;
        }
        .clay-card-hover {
          transition: transform 0.2s ease, box-shadow 0.2s ease !important;
        }
        .clay-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 0px #ECEFF1, 0 12px 32px rgba(0,0,0,0.05) !important;
        }
        .clay-card-hover:active {
          transform: translateY(2px);
          box-shadow: 0 4px 0px #ECEFF1, 0 4px 12px rgba(0,0,0,0.04) !important;
        }

        @media (min-width: 1024px) {
          .game-layout {
            display: block !important;
            max-width: 800px !important;
            margin: 0 auto !important;
            padding: 32px 16px !important;
          }
          .game-container-mobile {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
      <div className="game-container-mobile" style={{ ...S.container, minHeight: "auto", padding: "16px 16px 32px" }}>
        {showBar && <TopBar budget={mission.budget} spent={spent} transportTotal={transportSpent} difficulty={difficulty} stamina={stamina}/>}
        {screen==="intro" && <IntroScreen onStart={()=>{playSFX("success");setScreen("difficulty")}}/>}
        {screen==="difficulty" && <DifficultyScreen onSelect={d=>{playSFX("coin");setDifficulty(d);setScreen("mission")}}/>}
        {screen==="mission" && <MissionScreen onSelect={m=>{playSFX("coin");setMission(m);setCart([]);setSpent(0);setTransportSpent(0);setStamina(100);setVisited([]);setTBought([]);setTResisted(0);setUsedT([]);setScreen("district")}}/>}
        {screen==="district" && <DistrictScreen onSelect={d=>{playSFX("success");setDistrict(d);setScreen("briefing")}}/>}
        {screen==="briefing"&&mission&&district && <BriefingScreen mission={mission} district={district} difficulty={difficulty} onGo={()=>{playSFX("success");setScreen("map")}} />}
        {screen==="map"&&mission&&district && <MapScreen mission={mission} visited={visited} cart={cart} spent={spent} district={district} difficulty={difficulty} stamina={stamina} locations={locations} onVisit={visitLoc} onFinish={()=>{playSFX("success");setScreen("result")}}/>}
        {screen==="shopping"&&curLoc&&mission&&district && (
          <ShoppingScreen 
            key={curLoc.id}
            location={curLoc} 
            mission={mission} 
            cart={cart} 
            budget={mission.budget} 
            spent={spent} 
            district={district} 
            locations={locations} 
            onBuy={buyItem} 
            onDone={doneShopping}
            discountLocs={discountLocs}
            solvedLocs={solvedLocs}
            onSolveQuiz={(locId, success) => {
              setSolvedLocs(s => [...s, locId]);
              if (success) setDiscountLocs(d => [...d, locId]);
            }}
          />
        )}
        {screen==="temptation"&&curTemp && <TemptationScreen tempt={curTemp} budget={mission.budget} spent={spent} difficulty={difficulty} onBuy={()=>{
          playSFX("coin");
          setTBought(tb=>[...tb,curTemp]);
          setSpent(s=>s+curTemp.price);
          if (difficulty === "hard") {
            setStamina(st=>Math.min(100, st + (curTemp.heal || 0)));
          }
          setCurTemp(null);
          setScreen("map");
        }} onSkip={()=>{
          setTResisted(r=>r+1);
          setCurTemp(null);
          setScreen("map");
        }}/>}
        {screen==="result"&&mission&&district && <ResultScreen mission={mission} cart={cart} spent={spent} transportSpent={transportSpent} tBought={tBought} tResisted={tResisted} district={district} difficulty={difficulty} stamina={stamina} locations={locations} onRestart={reset}/>}
      </div>
      
      {/* Floating Toggle Button */}
      {showBar && (
        <button 
          onClick={() => setDashboardOpen(true)}
          className="clay-btn" 
          style={{ 
            position: "fixed", 
            bottom: 24, 
            right: 24, 
            zIndex: 150, 
            background: C.pink, 
            color: C.white, 
            borderRadius: "50%", 
            width: 56, 
            height: 56, 
            fontSize: 24, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            border: "3.5px solid rgba(0,0,0,0.15)",
            boxShadow: "0 6px 0px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.1)",
            cursor: "pointer"
          }}
          title="장보기 대시보드"
        >
          📋
        </button>
      )}

      {/* Toggleable Modal Dashboard */}
      {dashboardOpen && mission && (
        <div 
          style={{ 
            position: "fixed", 
            inset: 0, 
            background: "rgba(0,0,0,0.4)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            zIndex: 500, 
            padding: 16 
          }}
          onClick={() => setDashboardOpen(false)}
        >
          <div 
            style={{ 
              ...S.card, 
              maxWidth: 440, 
              width: "100%", 
              padding: 24, 
              maxHeight: "85vh", 
              overflowY: "auto", 
              position: "relative" 
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: C.pink, margin: 0 }}>📋 심부름 대시보드</h2>
              <button 
                onClick={() => setDashboardOpen(false)} 
                className="clay-btn"
                style={{ 
                  background: C.grayLight, 
                  border: "2px solid rgba(0,0,0,0.1)", 
                  borderRadius: "50%", 
                  width: 32, 
                  height: 32, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: "bold",
                  color: C.text
                }}
              >
                ✕
              </button>
            </div>

            {/* Target District */}
            <div style={{ background: C.bg, borderRadius: 16, padding: 14, marginBottom: 16, border: `3.5px solid ${C.grayLight}`, boxShadow: "0 4px 0px #ECEFF1" }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6, color: C.textLight }}>📍 목표 동네</div>
              <div style={{ fontSize: 15, fontWeight: 900 }}>{district ? district.name : "미선택"} ({difficulty === "hard" ? "어려움 모드" : "쉬움 모드"})</div>
            </div>

            {/* Shopping List */}
            <div style={{ background: C.bg, borderRadius: 16, padding: 14, marginBottom: 16, border: `3.5px solid ${C.grayLight}`, boxShadow: "0 4px 0px #ECEFF1" }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: C.textLight }}>🛒 장보기 목록 ({cart.length}개 획득)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {mission.required.map((r, i) => {
                  const acquired = cart.some(c => c.name === r.name);
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: "bold" }}>
                      <span>{r.emoji} {r.name} (필수)</span>
                      <span style={{ color: acquired ? C.green : C.red }}>{acquired ? "획득!" : "미구매"}</span>
                    </div>
                  );
                })}
                {mission.optional.map((o, i) => {
                  const acquired = cart.some(c => c.name === o.name);
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: "bold" }}>
                      <span>{o.emoji} {o.name} (선택)</span>
                      <span style={{ color: acquired ? C.orange : C.gray }}>{acquired ? "획득!" : "미구매"}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tips */}
            <div style={{ background: C.bg, borderRadius: 16, padding: 14, border: `3.5px solid ${C.grayLight}`, boxShadow: "0 4px 0px #ECEFF1" }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6, color: C.textLight }}>💡 합리적 장보기 꿀팁</div>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: C.textLight, fontWeight: "bold" }}>
                1. 전통시장은 채소와 먹거리가 대형마트보다 훨씬 저렴해요!<br/>
                2. 너무 멀리 있는 시장으로 가면 교통비 때문에 오히려 손해를 볼 수 있어요.<br/>
                3. 가던 도중 군것질(유혹)을 하면 예산이 부족할 수 있으니 주의해요!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
