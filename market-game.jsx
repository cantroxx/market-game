"use client";

import React, { useState, useCallback, useEffect } from "react";

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
  card: { background: C.white, borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", border: `1px solid ${C.grayLight}` },
  btn: (c, tc = C.white) => ({ background: c, color: tc, border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 16, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center" }),
  tag: (bg, c) => ({ background: bg, color: c, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, display: "inline-block" }),
  container: { maxWidth: 480, margin: "0 auto", padding: "16px 16px 32px", fontFamily: "'Pretendard','Noto Sans KR',system-ui,sans-serif", color: C.text, minHeight: "100vh", background: C.bg },
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
const DIFF = { easy:{ maxVisits:2, stamina:false, label:"쉬움" }, hard:{ maxVisits:3, stamina:true, startStamina:100, label:"어려움" }};

const MOM_IMG = {
  normal: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAAEsCAYAAAD93j5yAAAKw0lEQVR4nO3dvY5kRxmA4RrkHBGRkQASREgQONoUZMkr4cR34MASCZIvwxIJkgPfgRMs2dIKpxs5wBIRlsCJMyLkKxiC3d7p6emf81Pn1PdVPU8CLLszZ7+qt+t0T+9MKQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXHXX+gJY54+//dn92o/x+Tff2wdJWbgEakS6lLhjszgBtQz2FkHHYjECiBzsLYJuy/AbyRztJWLen4HvrMdwTwl5Pwa9gxGivUTM2zLcDY0c7ikhb8NQNyDcy4Rcl2FWJNzphFzHj1pfQC/EO4951eFRcCUbcT2n8XIGt5Bw6xPyfG6hFxDvNsx1PgHPZJNty3znccsykY21P7fUtzmBJxBvG+Z+m4BvsInaMv/rBHyFzRODdbhMwBfYNLFYj/MEfIbNEpN1eUrAJ2yS2KzPYwI+YnPkYJ0eCPg1myIX6/WKgIvNkJV1E7BNkNzo6zd0wKMvfi9GXsdhAx550Xs06noOGfCoi927Edd1yIChF8MFPOKj9EhGW9+hAh5tcUc10joPE/BIi8o46z1EwKMsJo+NsO5DBAy96j7gER6Fuaz39e864N4Xj2l63gddBwy96zbgnh91ma/X/dBlwL0uFuv0uC+6DBhG0V3APT7KUk9v+6O7gGEkAobEugq4t9sjttHTPukqYBhNNwH39KjK9nrZL90EDCN6q/UFcN7fPvu0lFLKe+9/EOI6Sml/LTzVxU9A7+V26DiWS/aIKMp17OHzb75P3UDqiz/IHvCUYM6pFdHSz1/zGloRcABZA14TzjlzYmr5uSMRcADZAq4dzzmnQe3xOc993ugEHECmgPcKqaVMEQu4sSzxjhDuqSwhZ47Y14F3MGK8pYz7996TgDc2+iYe/e+/NW/k2IiN+yDKm1J65ATegHjPM5f6Ugcc8QUsm/S6iPOJuI+mSh1wNBE3Z0TmVI+AK7Ep5zGvOgRcgc24jLmtJ+CVbMJ1zG8dAa9g89VhjsulDbj1K4c2XV2t59l6Py2VNmBAwIu0Pi16Za7zCXgmm2xb5juPgGewufZhztMJGBIT8EROhX2Z9zQCnsBmasPcb0sZcNav2RFbxn2VMuA9OQXaMv/rfEeO185tFN9BIg7rc17K78ZX81bHI3x+NUPO9h0qh76FFm8fRl7HYQMeedF7NOp6DhnwqIvduxHXdciAoRfDBTzio/RIRlvf4QKGngwV8GiPzqMaaZ2HChh6451Yrfz89+d//buv9r2OJTJfe2dSvevkYMk7scLcVl3a/KcixpDs2pe8Q8s7sbhsagBzf+8eMl97xwS8lyWbOkoIma+9c54D7+HKZn72u18/+t8v//Gvp3+25S1p5msfgIAbOd38p7/+JIZAMl97b9xCN3Du5Drd9JciaS3ztfdIwFu78VzwePNfPLlaPZ/MfO2DEPDOjk+nc5v++Ne",
  happy: "data:image/png;base64,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",
  proud: "data:image/png;base64,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",
  worried: "data:image/png;base64,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"
};

const MOM_BRIEFING = {
  1: "오늘 저녁에 김치찌개를 끓일 거야.\n여기 돈이니까 재료 좀 사다 줄래?\n잘 골라서 사오렴~",
  2: "내일 소풍이잖아~\n김밥 재료를 사다 줄래?\n남는 돈은 잘 가져오고!",
  3: "친구 생일파티를 준비해야 해.\n이 돈으로 필요한 것 사오렴!\n엄마가 믿을게~",
};

// ─── Mom Bubble Component ───
function MomBubble({ expression, text, size }) {
  const sz = size || 100;
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
      <img src={MOM_IMG[expression]} alt="엄마" style={{ width:sz, height:sz*1.25, objectFit:"contain", flexShrink:0 }} />
      <div style={{ position:"relative", background:C.white, borderRadius:16, padding:"12px 16px", boxShadow:"0 2px 8px rgba(0,0,0,0.08)", border:`1px solid ${C.grayLight}`, flex:1 }}>
        <div style={{ position:"absolute", left:-8, top:20, width:0, height:0, borderTop:"8px solid transparent", borderBottom:"8px solid transparent", borderRight:`8px solid ${C.grayLight}` }} />
        <div style={{ fontSize:14, lineHeight:1.7, whiteSpace:"pre-line", color:C.text }}>{text}</div>
      </div>
    </div>
  );
}

// ─── TopBar ───
function TopBar({ budget, spent, transportTotal, difficulty, stamina }) {
  const rem = budget - spent;
  const pct = Math.max(0,(rem/budget)*100);
  return (
    <div style={{ background:C.white, borderRadius:14, padding:"10px 14px", marginBottom:14, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:13, color:C.textLight }}>💰 남은 예산</span>
        <span style={{ fontSize:14, fontWeight:700, color:rem<budget*0.2?C.red:C.green }}>{fmt(rem)}</span>
      </div>
      <div style={{ background:C.grayLight, borderRadius:8, height:10 }}>
        <div style={{ width:`${pct}%`, height:"100%", borderRadius:8, background:pct<20?C.red:pct<40?C.orange:C.green, transition:"width 0.4s" }} />
      </div>
      {transportTotal > 0 && <div style={{ fontSize:11, color:C.textLight, marginTop:3, textAlign:"right" }}>🚇 교통비: {fmt(transportTotal)}</div>}
      {difficulty === "hard" && (
        <div style={{ marginTop:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ fontSize:13, color:C.textLight }}>🏃 체력</span>
            <span style={{ fontSize:13, fontWeight:700, color:stamina<30?C.red:stamina<60?C.orange:C.stamina }}>{stamina}/100</span>
          </div>
          <div style={{ background:C.grayLight, borderRadius:8, height:10 }}>
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
    <div style={{ textAlign:"center", paddingTop:32 }}>
      <div style={{ fontSize:64, marginBottom:4 }}>🛒</div>
      <h1 style={{ fontSize:30, fontWeight:900, color:C.pink, margin:"0 0 4px" }}>시장에 가면</h1>
      <p style={{ fontSize:14, color:C.textLight, margin:"0 0 28px" }}>서울의 시장 and 마트에서 합리적인 선택을 배워요!</p>
      <div style={{ ...S.card, textAlign:"left", marginBottom:20 }}>
        <h3 style={{ fontSize:15, fontWeight:700, margin:"0 0 10px", color:C.pink }}>🎯 학습 목표</h3>
        <p style={{ fontSize:14, lineHeight:1.8, margin:0 }}><b>물건값</b>과 <b>교통비</b>, 그리고 나의 <b>마음</b>까지 생각해서 <b>합리적인 선택</b>이 무엇인지 알아봐요.</p>
      </div>
      <button onClick={onStart} style={{ ...S.btn(C.pink), width:"100%", fontSize:18, padding:"16px 0" }}>게임 시작하기 🚀</button>
    </div>
  );
}

function DifficultyScreen({ onSelect }) {
  return (
    <div>
      <h2 style={{ fontSize:20, fontWeight:800, textAlign:"center", margin:"20px 0 6px" }}>⚡ 난이도 선택</h2>
      <p style={{ textAlign:"center", fontSize:13, color:C.textLight, margin:"0 0 20px" }}>어떤 모드로 도전할까요?</p>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <button onClick={()=>onSelect("easy")} style={{ ...S.card, cursor:"pointer", textAlign:"left", border:`2px solid ${C.green}`, display:"block", width:"100%", padding:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
            <span style={{ fontSize:36 }}>😊</span>
            <div><div style={{ fontWeight:700, fontSize:18, color:C.green }}>쉬움</div><span style={S.tag(C.greenLight,C.green)}>처음 해보는 친구</span></div>
          </div>
          <p style={{ fontSize:13, color:C.textLight, margin:0, lineHeight:1.6 }}>시장 3곳 + 마트 1곳에서 골라요.<br/>최대 2곳 방문. 교통비를 생각하며 장보기!</p>
        </button>
        <button onClick={()=>onSelect("hard")} style={{ ...S.card, cursor:"pointer", textAlign:"left", border:`2px solid ${C.red}`, display:"block", width:"100%", padding:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
            <span style={{ fontSize:36 }}>🔥</span>
            <div><div style={{ fontWeight:700, fontSize:18, color:C.red }}>어려움</div><span style={S.tag(C.redLight,C.red)}>자신 있는 친구</span></div>
          </div>
          <p style={{ fontSize:13, color:C.textLight, margin:0, lineHeight:1.6 }}>시장 5곳 + 마트 3곳! 선택지가 많아요.<br/>최대 3곳 방문 + <b>🏃 체력 관리</b>까지! 멀리 가면 힘들어요.</p>
        </button>
      </div>
    </div>
  );
}

function MissionScreen({ onSelect }) {
  return (
    <div>
      <h2 style={{ fontSize:20, fontWeight:800, textAlign:"center", margin:"12px 0 6px" }}>📋 미션 선택</h2>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {MISSIONS.map(m=>(
          <button key={m.id} onClick={()=>onSelect(m)} style={{ ...S.card, cursor:"pointer", textAlign:"left", border:`2px solid ${C.grayLight}`, display:"block", width:"100%", padding:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
              <span style={{ fontSize:32 }}>{m.emoji}</span>
              <div><div style={{ fontWeight:700, fontSize:17 }}>{m.title}</div><span style={S.tag(C.pinkLight,C.pink)}>예산 {fmt(m.budget)}</span></div>
            </div>
            <p style={{ fontSize:13, color:C.textLight, margin:"0 0 8px" }}>{m.desc}</p>
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
      <h2 style={{ fontSize:20, fontWeight:800, textAlign:"center", margin:"12px 0 4px" }}>📍 우리 동네 선택</h2>
      <div style={{ ...S.card, padding:14, marginBottom:14, background:C.blueLight, border:`1px solid ${C.blue}` }}>
        <p style={{ margin:0, fontSize:13, lineHeight:1.6 }}>💡 동네에 따라 <b>교통비</b>와 <b>체력 소모</b>가 달라요!</p>
      </div>
      {AREA_ORDER.map(area=>(
        <div key={area} style={{ marginBottom:12 }}>
          <div style={{ ...S.tag(AREA_CLR[area]+"22",AREA_CLR[area]), marginBottom:8, fontSize:13 }}>{area}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {DISTRICTS.filter(d=>d.a===area).map(d=>(
              <button key={d.id} onClick={()=>onSelect(d)} style={{ background:C.white, border:`1.5px solid ${C.grayLight}`, borderRadius:10, padding:"8px 14px", fontSize:14, fontWeight:600, cursor:"pointer" }}>{d.name}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BriefingScreen({ mission, district, difficulty, onGo }) {
  return (
    <div>
      <div style={{ textAlign:"center", marginBottom:16 }}>
        <span style={{ ...S.tag(C.pinkLight,C.pink), fontSize:12 }}>{mission.emoji} {mission.title}</span>
      </div>
      <MomBubble expression="normal" text={MOM_BRIEFING[mission.id]} size={90} />
      <div style={{ ...S.card, marginTop:16, padding:14 }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>🛒 사올 것</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {mission.required.map((r,i)=><span key={i} style={S.tag(C.pinkLight,C.pink)}>{r.emoji} {r.name}</span>)}
          {mission.optional.map((o,i)=><span key={`o${i}`} style={S.tag(C.orangeLight,C.orange)}>{o.emoji} {o.name} (선택)</span>)}
        </div>
      </div>
      <div style={{ ...S.card, marginTop:10, padding:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:14 }}>💰 예산</span>
        <span style={{ fontSize:18, fontWeight:800, color:C.pink }}>{fmt(mission.budget)}</span>
      </div>
      <div style={{ display:"flex", gap:8, marginTop:10 }}>
        <div style={{ ...S.tag(C.pinkLight,C.pink), fontSize:12 }}>📍 {district.name}에서 출발</div>
        <div style={{ ...S.tag(difficulty==="hard"?C.redLight:C.greenLight, difficulty==="hard"?C.red:C.green), fontSize:12 }}>{DIFF[difficulty].label}</div>
      </div>
      <button onClick={onGo} style={{ ...S.btn(C.pink), width:"100%", marginTop:20, fontSize:18, padding:"16px 0" }}>심부름 출발! 🏃</button>
    </div>
  );
}

// ─── Seoul Map ───
function SeoulMap({ locations, onPin, visited, selPin, district }) {
  return (
    <svg viewBox="0 0 400 300" style={{ width:"100%", borderRadius:20, border:`2px solid ${C.grayLight}`, background:C.mapLand }}>
      <polygon points="0,60 30,15 60,50 90,10 120,45 150,20 180,55 200,30 210,50" fill={C.mountain} opacity="0.4"/>
      <polygon points="200,45 230,20 260,40 290,12 320,35 340,25 360,42 400,30 400,60 200,60" fill={C.mountain} opacity="0.35"/>
      <text x="50" y="42" fontSize="9" fill={C.greenDark} opacity="0.6" fontWeight="600" textAnchor="middle">북한산</text>
      <path d="M0,148 Q60,132 120,142 Q180,155 240,140 Q310,128 360,138 Q380,142 400,136" fill="none" stroke={C.river} strokeWidth="22" opacity="0.5" strokeLinecap="round"/>
      <text x="200" y="146" fontSize="11" fill={C.blueDark} opacity="0.5" fontWeight="700" textAnchor="middle">한 강</text>
      <ellipse cx="186" cy="112" rx="18" ry="12" fill={C.mountainDark} opacity="0.2"/>
      <text x="186" y="116" fontSize="7" fill={C.greenDark} opacity="0.5" fontWeight="600" textAnchor="middle">남산</text>
      <rect x="0" y="155" width="400" height="145" fill={C.mapLandSouth} opacity="0.4"/>
      {locations.map(loc=>{
        const cx=loc.x*4, cy=loc.y*3, iv=visited.includes(loc.id), isSel=selPin===loc.id, r=isSel?20:16;
        const tc = calcTC(district.id, loc.dist);
        return (
          <g key={loc.id} onClick={()=>!iv&&onPin(loc)} className={`map-pin-hover ${isSel ? "map-pin-active" : ""}`} style={{ cursor:iv?"default":"pointer" }} opacity={iv?0.4:1}>
            <ellipse cx={cx} cy={cy+r+4} rx={r*0.6} ry={3} fill="rgba(0,0,0,0.1)"/>
            <circle cx={cx} cy={cy} r={r} fill={C.white} stroke={loc.color} strokeWidth={isSel?3.5:2}/>
            <text x={cx} y={cy+1} fontSize={r*0.8} textAnchor="middle" dominantBaseline="central">{loc.emoji}</text>
            <rect x={cx-26} y={cy-r-16} width="52" height="14" rx="7" fill={loc.color}/>
            <text x={cx} y={cy-r-7} fontSize="8" fill="white" fontWeight="700" textAnchor="middle">{loc.name}</text>
            <rect x={cx-22} y={cy+r+1} width="44" height="12" rx="6" fill={tc===0?C.green:C.blueDark} opacity="0.85"/>
            <text x={cx} y={cy+r+9} fontSize="7" fill="white" fontWeight="600" textAnchor="middle">{tc===0?"🚶도보":`🚇${fmt(tc)}`}</text>
            {iv&&<text x={cx+r-2} y={cy-r+4} fontSize="12">✅</text>}
          </g>
        );
      })}
      <rect x="8" y="272" width="130" height="22" rx="8" fill="rgba(255,255,255,0.85)"/>
      <circle cx="20" cy="283" r="4" fill="#E53935"/><text x="28" y="286" fontSize="7" fill={C.text}>전통시장</text>
      <circle cx="72" cy="283" r="4" fill="#1565C0"/><text x="80" y="286" fontSize="7" fill={C.text}>대형마트</text>
    </svg>
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
        <span style={{ ...S.tag(C.pinkLight,C.pink), fontSize:11 }}>📍{district.name}</span>
        <span style={{ ...S.tag(difficulty==="hard"?C.redLight:C.greenLight, difficulty==="hard"?C.red:C.green), fontSize:11 }}>{cfg.label}</span>
      </div>
      <p style={{ textAlign:"center", fontSize:13, color:C.textLight, margin:"0 0 8px" }}>
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
          <div style={{ ...S.card, marginTop:12, padding:16, border:`2px solid ${sel.color}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <span style={{ fontSize:28 }}>{sel.emoji}</span>
              <div>
                <div style={{ fontWeight:700, fontSize:16 }}>{sel.name}</div>
                <div style={{ fontSize:12, color:C.textLight }}>{DISTRICTS.find(d=>d.id===sel.dist)?.name} · {sel.desc}</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
              <span style={S.tag(sel.type==="market"?C.pinkLight:C.blueLight, sel.type==="market"?C.pink:C.blueDark)}>{sel.spec}</span>
              <span style={S.tag(tc===0?C.greenLight:C.orangeLight, tc===0?C.green:C.orange)}>{tc===0?"🚶 도보 (0원)":`🚇 ${fmt(tc)}`}</span>
              {cfg.stamina && <span style={S.tag(sc<=15?"#FFF3E0":"#FFEBEE", sc<=15?C.orange:C.red)}>🏃 체력 -{sc}</span>}
            </div>
            {tc>0 && <div style={{ background:C.orangeLight, borderRadius:10, padding:"6px 12px", marginBottom:8, fontSize:12 }}>⚠️ 교통비 <b>{fmt(tc)}</b> 차감 (남은 돈: {fmt(rem)}→{fmt(rem-tc)})</div>}
            {cfg.stamina && sc>15 && <div style={{ background:C.redLight, borderRadius:10, padding:"6px 12px", marginBottom:8, fontSize:12 }}>🏃 체력 <b>-{sc}</b> (현재: {stamina}→{stamina-sc})</div>}
            {canAfford && canStamina
              ? <button onClick={()=>{onVisit(sel);setSelPin(null)}} style={{ ...S.btn(sel.color), width:"100%", fontSize:15 }}>이 곳으로 출발! 🚶</button>
              : <div style={{ textAlign:"center", color:C.red, fontWeight:600, fontSize:14 }}>{!canAfford?"💸 교통비 부족":"🏃 체력 부족 (쉬어야 해요!)"}</div>}
          </div>
        );
      })()}

      {visited.length>0 && (
        <div style={{ ...S.card, marginTop:12, padding:14 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>🛒 장바구니</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {mission.required.map((r,i)=>{const b=cart.find(c=>c.name===r.name);return <span key={i} style={S.tag(b?C.greenLight:C.redLight, b?C.green:C.red)}>{b?"✅":"❌"} {r.name}</span>;})}
          </div>
        </div>
      )}
      {visited.length>0 && <button onClick={onFinish} style={{ ...S.btn(hasAll?C.green:C.orange), width:"100%", marginTop:12, fontSize:15 }}>{hasAll?"장보기 완료! 🎉":"⚠️ 필수 물건 부족 (그래도 끝내기)"}</button>}
    </div>
  );
}

// ─── Price Compare ───
function PriceCompare({ item, curLocId, district, locations, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }} onClick={onClose}>
      <div style={{ ...S.card, maxWidth:400, width:"100%", padding:18, maxHeight:"80vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <h3 style={{ margin:"0 0 12px", fontSize:15, fontWeight:700 }}>📊 {item.emoji} {item.name}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:C.gray }}>✕</button>
        </div>
        <div style={{ fontSize:11, color:C.textLight, marginBottom:8 }}>📍 {district.name}에서 출발 기준</div>
        {locations.map(loc=>{
          const p = item.prices[loc.id], tc = calcTC(district.id, loc.dist), tot = p + tc;
          const allTot = locations.map(l=>item.prices[l.id]+calcTC(district.id,l.dist));
          const best = tot===Math.min(...allTot);
          return (
            <div key={loc.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 10px", marginBottom:3, borderRadius:8, background:loc.id===curLocId?C.pinkLight:best?C.greenLight:C.grayLight, fontSize:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:14 }}>{loc.emoji}</span>
                <span style={{ fontWeight:600, fontSize:12 }}>{loc.name}</span>
                {loc.id===curLocId && <span style={{ ...S.tag(C.pink,C.white), fontSize:9 }}>현재</span>}
              </div>
              <div style={{ textAlign:"right" }}>
                <span style={{ color:C.textLight }}>{fmt(p)}+🚇{fmt(tc)}</span>
                <span style={{ fontWeight:700, fontSize:13, color:best?C.green:C.text, marginLeft:6 }}>={fmt(tot)}{best?" ✨":""}</span>
              </div>
            </div>
          );
        })}
        <div style={{ marginTop:8, fontSize:11, color:C.blueDark, textAlign:"center", background:C.blueLight, borderRadius:8, padding:6 }}>💡 물건값 + 교통비 = 총비용으로 비교!</div>
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

  return (
    <div>
      {cmpItem && <PriceCompare item={cmpItem} curLocId={location.id} district={district} locations={locations} onClose={()=>setCmpItem(null)}/>}
      
      <div style={{ background:`linear-gradient(135deg, ${location.color}ee, ${location.color}99)`, borderRadius:20, padding:16, color:C.white, marginBottom:14, textAlign:"center" }}>
        <span style={{ fontSize:32 }}>{location.emoji}</span>
        <h2 style={{ margin:"2px 0", fontSize:18, fontWeight:800 }}>{location.name}</h2>
        <p style={{ margin:0, fontSize:12, opacity:0.9 }}>{location.spec}</p>
      </div>

      {/* Bargain Quiz Banner */}
      {!isSolved ? (
        <div style={{ ...S.card, padding: 12, marginBottom: 12, background: C.orangeLight, border: `1px dashed ${C.orange}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>💡 흥정 퀴즈를 맞춰 10% 할인을 받아보세요!</span>
          <button onClick={() => setShowQuiz(true)} style={{ ...S.btn(C.orange), padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>퀴즈 풀기 ⚡</button>
        </div>
      ) : isDiscounted ? (
        <div style={{ ...S.card, padding: 12, marginBottom: 12, background: C.greenLight, border: `1px solid ${C.green}`, textAlign: "center", fontSize: 13, fontWeight: 700, color: C.greenDark }}>
          🎉 흥정 성공! 모든 물건이 10% 할인된 가격으로 적용됩니다!
        </div>
      ) : (
        <div style={{ ...S.card, padding: 12, marginBottom: 12, background: C.grayLight, border: `1px solid ${C.gray}`, textAlign: "center", fontSize: 12, color: C.textLight }}>
          😔 흥정 실패! 정상가로 장을 봅니다.
        </div>
      )}

      {/* Quiz Pop-up Modal */}
      {showQuiz && activeQuiz && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300, padding:16 }}>
          <div style={{ ...S.card, maxWidth:380, width:"100%", padding:20 }}>
            <h3 style={{ margin:"0 0 12px", fontSize:16, color:C.orange }}>⚡ 흥정 퀴즈!</h3>
            <p style={{ fontSize:14, lineHeight:1.6, marginBottom:16, fontWeight:600 }}>{activeQuiz.q}</p>
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
                }} style={{ ...S.btn(C.grayLight, C.text), textAlign:"left", padding:"12px 16px", fontSize:13, fontWeight:600, border: `1px solid ${C.gray}` }}>
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
            <div key={i} style={{ ...S.card, padding:12, border:inC?`2px solid ${C.green}`:`1px solid ${C.grayLight}`, opacity:inC?0.65:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:0 }}>
                  <span style={{ fontSize:24 }}>{it.emoji}</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{it.name}</div>
                    <div style={{ display:"flex", gap:4, marginTop:3, flexWrap:"wrap" }}>
                      <span style={S.tag(isReq?C.pinkLight:C.orangeLight, isReq?C.pink:C.orange)}>{isReq?"필수":"선택"}</span>
                      {rawPrice===cheap && <span style={S.tag(C.greenLight,C.green)}>최저가</span>}
                      {isDiscounted && <span style={S.tag(C.greenLight,C.greenDark)}>10% 할인적용</span>}
                      <button onClick={()=>setCmpItem(it)} style={{ ...S.tag(C.blueLight,C.blueDark), cursor:"pointer", border:"none", fontSize:11 }}>📊비교</button>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                  <div style={{ fontWeight:800, fontSize:16, color:rawPrice===cheap?C.green:C.text }}>
                    {isDiscounted && <span style={{ textDecoration: "line-through", fontSize: 12, color: C.gray, marginRight: 6 }}>{fmt(rawPrice)}</span>}
                    {fmt(p)}
                  </div>
                  {inC?<span style={{ fontSize:11, color:C.green }}>✅</span>
                    :ok?<button onClick={()=>{
                      playSFX("coin");
                      onBuy(it,p,location);
                    }} style={{ ...S.btn(C.pink), padding:"5px 14px", fontSize:13, marginTop:3 }}>담기</button>
                    :<span style={{ fontSize:11, color:C.red }}>💸</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={onDone} style={{ ...S.btn(C.grayDark), width:"100%", marginTop:14, fontSize:15 }}>이 가게 나가기 →</button>
    </div>
  );
}

function TemptationScreen({ tempt, budget, spent, onBuy, onSkip }) {
  const ok=(budget-spent)>=tempt.price;
  return (
    <div style={{ textAlign:"center", paddingTop:32 }}>
      <div style={{ background:"linear-gradient(135deg,#FFE082,#FFB74D)", borderRadius:24, padding:28, marginBottom:20 }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.red, marginBottom:8 }}>⚡ 유혹 이벤트!</div>
        <span style={{ fontSize:56 }}>{tempt.emoji}</span>
        <p style={{ fontSize:15, color:C.grayDark, margin:"10px 0", lineHeight:1.6 }}>{tempt.msg}</p>
        <div style={{ fontSize:22, fontWeight:800, color:C.red }}>{fmt(tempt.price)}</div>
      </div>
      <div style={{ ...S.card, marginBottom:20, padding:14, background:C.blueLight, border:`1px solid ${C.blue}` }}>
        <p style={{ margin:0, fontSize:14 }}>미션에 <b>필요 없는</b> 물건이에요. 🤔</p>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={onSkip} style={{ ...S.btn(C.green), flex:1, fontSize:15 }}>✋ 안 살래요!</button>
        {ok?<button onClick={onBuy} style={{ ...S.btn(C.red), flex:1, fontSize:15 }}>😋 살래요!</button>
          :<button disabled style={{ ...S.btn(C.gray), flex:1, fontSize:15, opacity:0.5, cursor:"default" }}>💸 부족</button>}
      </div>
    </div>
  );
}

function MomResult({ mission, cart, spent, tBought, tResisted, rational, mood }) {
  const remaining = mission.budget - spent;
  const missing = mission.required.filter(r=>!cart.some(c=>c.name===r.name));

  // Determine expression
  const expr = rational>=80&&mood>=60 ? "proud" : rational>=60 ? "happy" : rational>=40 ? "normal" : "worried";

  // Generate dynamic dialogue
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
        <span style={{ fontWeight:600 }}>{label}</span>
        <span style={{ fontWeight:700, color }}>+{score} <span style={{ color:C.gray, fontWeight:400 }}>/{max}</span></span>
      </div>
      <div style={{ background:C.grayLight, borderRadius:6, height:8 }}>
        <div style={{ width:`${Math.min(100,(score/max)*100)}%`, height:"100%", background:color, borderRadius:6, transition:"width 0.8s" }}/>
      </div>
      <div style={{ fontSize:11, color:C.textLight, marginTop:2 }}>{desc}</div>
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
    : { e:"🤗",t:"다음엔 더 잘할 수 있어요!",m:"계획을 세우면 마음도 예산도 만족할 수 있어요!" };

  const finalComboBg = rH&&mH ? "linear-gradient(135deg,#FFF9C4,#DCEDC8)"
    : rH&&!mH ? "linear-gradient(135deg,#E3F2FD,#F3E5F5)"
    : !rH&&mH ? "linear-gradient(135deg,#FFF3E0,#FCE4EC)"
    : "linear-gradient(135deg,#ECEFF1,#F5F5F5)";

  return (
    <div>
      <MomResult mission={mission} cart={cart} spent={spent} tBought={tBought} tResisted={tResisted} rational={rational} mood={mood} />

      <div style={{ textAlign:"center", padding:"24px 16px", borderRadius:24, marginBottom:16, background:finalComboBg }}>
        <div style={{ fontSize:48 }}>{combo.e}</div>
        <h2 style={{ fontSize:20, fontWeight:900, margin:"4px 0", color:C.text }}>{combo.t}</h2>
        <p style={{ fontSize:14, color:C.grayDark, margin:"8px 0 0", lineHeight:1.6 }}>{combo.m}</p>
        <div style={{ fontSize:11, color:C.textLight, marginTop:8 }}>📍 {district.name} · {DIFF[difficulty].label}</div>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        <div style={{ flex:1, background:C.white, borderRadius:16, padding:14, textAlign:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", border:`2px solid ${rational>=70?C.green:rational>=50?C.orange:C.red}` }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.textLight }}>🧠 합리적 선택</div>
          <div style={{ fontSize:34, fontWeight:900, color:rational>=70?C.green:rational>=50?C.orange:C.red }}>{rational}</div>
        </div>
        <div style={{ flex:1, background:C.white, borderRadius:16, padding:14, textAlign:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", border:`2px solid ${mood>=65?C.pink:mood>=45?C.orange:C.gray}` }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.textLight }}>💛 마음 만족도</div>
          <div style={{ fontSize:34, fontWeight:900, color:mood>=65?C.pink:mood>=45?C.orange:C.gray }}>{mood}</div>
        </div>
      </div>

      {potentialSavings > 0 && (
        <div style={{ ...S.card, marginBottom: 14, border: `2px solid ${C.green}`, background: C.greenLight }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.greenDark, margin: "0 0 8px" }}>💡 장보기 복기 피드백</h3>
          <p style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.6, color: C.text }}>
            계획을 최적으로 세웠다면 <b>{fmt(potentialSavings)}</b>을 더 아껴서 총 <b>{fmt(bestCost)}</b>에 해결할 수 있었어요!
          </p>
          <div style={{ fontSize: 12, color: C.text }}>
            <b>엄마가 권장하는 최적의 코스:</b>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {bestLocs.map((loc, i) => (
                <span key={i} style={S.tag(loc.color, C.white)}>{loc.emoji} {loc.name}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ ...S.card, marginBottom:14 }}>
        <h3 style={{ fontSize:14, fontWeight:700, margin:"0 0 10px" }}>🧠 합리적 선택 점수</h3>
        <SB label="미션 완료" score={rM} max={40} desc={`필수 ${reqB.length}/${mission.required.length}개`} color={C.green}/>
        <SB label="예산 관리" score={rB} max={25} desc={`${fmt(rem)} 절약`} color={C.blue}/>
        <SB label="총비용 비교" score={rC} max={25} desc={`최적가 ${cheapN}건`} color={C.orange}/>
        <SB label="유혹 저항" score={rT} max={10} desc={tBought.length>0?`불필요 ${tBought.length}건`:"잘 참았어요!"} color={C.purple}/>
      </div>

      <div style={{ ...S.card, marginBottom:14, background:"#FFF8F8" }}>
        <h3 style={{ fontSize:14, fontWeight:700, margin:"0 0 10px" }}>💛 마음 분석</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          {allReq && <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"4px 8px", background:C.greenLight, borderRadius:8 }}><span>✅ 필수 모두 구매</span><span style={{ color:C.green, fontWeight:700 }}>+15</span></div>}
          {notB.length>0 && <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"4px 8px", background:C.redLight, borderRadius:8 }}><span>😰 {notB.map(n=>n.name).join(", ")} 못 삼</span><span style={{ color:C.red, fontWeight:700 }}>-{notB.length*10}</span></div>}
          {tBought.length>0 && <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"4px 8px", background:C.orangeLight, borderRadius:8 }}><span>😋 {tBought.map(t=>t.name).join(", ")}</span><span style={{ color:C.orange, fontWeight:700 }}>+{tBought.length*12}</span></div>}
          {tResisted>0 && <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"4px 8px", background:C.pinkLight, borderRadius:8 }}><span>😔 {tResisted}번 참음 (아쉬움)</span><span style={{ color:C.pink, fontWeight:700 }}>-{tResisted*8}</span></div>}
          {rem>=mission.budget*0.3 && <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"4px 8px", background:C.greenLight, borderRadius:8 }}><span>😌 돈 넉넉 (안심)</span><span style={{ color:C.green, fontWeight:700 }}>+8</span></div>}
          {difficulty==="hard" && stamina<30 && <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"4px 8px", background:C.redLight, borderRadius:8 }}><span>😫 너무 피곤해요</span><span style={{ color:C.red, fontWeight:700 }}>-8</span></div>}
          {difficulty==="hard" && stamina>=60 && <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"4px 8px", background:C.greenLight, borderRadius:8 }}><span>💪 체력 여유 (기분 좋음)</span><span style={{ color:C.green, fontWeight:700 }}>+5</span></div>}
        </div>
      </div>

      <div style={{ ...S.card, marginBottom:14, background:"linear-gradient(135deg,#FFF9C4,#FFF3E0)", border:`1px solid ${C.gold}` }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.grayDark, marginBottom:6 }}>💭 친구와 이야기해 봐요</div>
        <div style={{ fontSize:13, lineHeight:1.8, color:C.text }}>
          {rH&&!mH?"\"합리적으로 잘 골랐는데 왜 아쉬운 기분이 들까요?\""
            :!rH&&mH?"\"기분은 좋은데 예산이 부족했어요. 둘 다 만족하려면?\""
            :rH&&mH?"\"어떤 점이 합리적이면서도 기분 좋게 만들었을까요?\""
            :"\"다음에 장을 본다면, 어떤 계획을 세울 건가요?\""}
        </div>
      </div>

      <div style={{ ...S.card, marginBottom:14 }}>
        <h3 style={{ fontSize:14, fontWeight:700, margin:"0 0 8px" }}>🧾 영수증</h3>
        {transportSpent>0 && <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:`1px solid ${C.grayLight}`, fontSize:12, color:C.blueDark }}><span>🚇 교통비</span><span style={{ fontWeight:600 }}>{fmt(transportSpent)}</span></div>}
        {cart.map((ci,i)=>(<div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:`1px solid ${C.grayLight}`, fontSize:12 }}><span>{ci.emoji} {ci.name} <span style={{ fontSize:10, color:C.textLight }}>@{ci.locationName}</span></span><span style={{ fontWeight:600 }}>{fmt(ci.pricePaid)}</span></div>))}
        {tBought.map((t,i)=>(<div key={`t${i}`} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", fontSize:12, color:C.red }}><span>{t.emoji} {t.name}</span><span style={{ fontWeight:600 }}>{fmt(t.price)}</span></div>))}
        <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0 0", marginTop:4, borderTop:`2px solid ${C.text}`, fontWeight:800, fontSize:14 }}><span>합계</span><span>{fmt(spent)}</span></div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.green, fontWeight:600, marginTop:2 }}><span>남은 돈</span><span>{fmt(rem)}</span></div>
      </div>

      <button onClick={onRestart} style={{ ...S.btn(C.pink), width:"100%", fontSize:16, padding:"14px 0" }}>다시 도전하기 🔄</button>
    </div>
  );
}

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

  const locations = difficulty ? ALL_LOCATIONS.filter(l => difficulty==="hard" || l.mode==="easy") : [];

  const reset = useCallback(()=>{
    setScreen("intro"); setDifficulty(null); setMission(null); setDistrict(null);
    setCart([]); setSpent(0); setTransportSpent(0); setStamina(100);
    setVisited([]); setCurLoc(null); setTBought([]); setTResisted(0);
    setCurTemp(null); setUsedT([]); setDiscountLocs([]); setSolvedLocs([]);
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
        @media (min-width: 1024px) {
          .game-layout {
            display: flex !important;
            gap: 32px !important;
            max-width: 960px !important;
            margin: 0 auto !important;
            padding: 32px 16px !important;
            align-items: flex-start !important;
          }
          .game-container-mobile {
            flex: 1 !important;
            max-width: 480px !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .game-dashboard {
            display: block !important;
            flex: 1 !important;
            max-width: 440px !important;
            position: sticky !important;
            top: 32px !important;
            background: #FFFFFF;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            border: 1px solid #ECEFF1;
          }
        }
        @media (max-width: 1023px) {
          .game-dashboard {
            display: none !important;
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
        {screen==="temptation"&&curTemp && <TemptationScreen tempt={curTemp} budget={mission.budget} spent={spent} onBuy={()=>{
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
      
      {/* PC/Tablet Dashboard View */}
      {mission && (
        <div className="game-dashboard">
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.pink, margin: "0 0 16px" }}>📋 심부름 대시보드</h2>
          <div style={{ background: C.bg, borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>📍 목표 동네</div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{district ? district.name : "미선택"} ({difficulty === "hard" ? "어려움 모드" : "쉬움 모드"})</div>
          </div>
          <div style={{ background: C.bg, borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🛒 장보기 목록 ({cart.length}개 획득)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {mission.required.map((r, i) => {
                const acquired = cart.some(c => c.name === r.name);
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span>{r.emoji} {r.name} (필수)</span>
                    <span style={{ color: acquired ? C.green : C.red, fontWeight: 700 }}>{acquired ? "획득!" : "미구매"}</span>
                  </div>
                );
              })}
              {mission.optional.map((o, i) => {
                const acquired = cart.some(c => c.name === o.name);
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span>{o.emoji} {o.name} (선택)</span>
                    <span style={{ color: acquired ? C.orange : C.gray, fontWeight: 700 }}>{acquired ? "획득!" : "미구매"}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background: C.bg, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>💡 합리적 장보기 꿀팁</div>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: C.textLight }}>
              1. 전통시장은 채소와 먹거리가 대형마트보다 훨씬 저렴해요!<br/>
              2. 너무 멀리 있는 시장으로 가면 교통비 때문에 오히려 손해를 볼 수 있어요.<br/>
              3. 가던 도중 군것질(유혹)을 하면 예산이 부족할 수 있으니 주의해요!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
