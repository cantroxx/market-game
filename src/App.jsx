import { useState, useCallback, useRef } from "react";

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
  // Easy + Hard
  { id:"gwangjang", name:"광장시장", type:"market", dist:"jongno", emoji:"🏮", x:55,y:26, desc:"먹거리가 유명한 전통시장", spec:"고기·먹거리 최저가", color:"#E53935", mode:"easy" },
  { id:"mangwon", name:"망원시장", type:"market", dist:"mapo", emoji:"🥬", x:22,y:35, desc:"신선한 채소가 가득", spec:"채소·신선식품 최저가", color:"#43A047", mode:"easy" },
  { id:"namdaemun", name:"남대문시장", type:"market", dist:"jung", emoji:"🏯", x:46,y:40, desc:"600년 역사의 종합시장", spec:"잡화·양념 최저가", color:"#FB8C00", mode:"easy" },
  { id:"mart_a", name:"행복마트", type:"mart", dist:"gangnam", emoji:"🏬", x:60,y:68, desc:"깔끔한 대형마트", spec:"품질 균일, 가격 비쌈", color:"#1565C0", mode:"easy" },
  // Hard only
  { id:"gyeongdong", name:"경동시장", type:"market", dist:"dongdaemun", emoji:"🌿", x:72,y:28, desc:"약재·농산물 전문시장", spec:"건강식품·농산물 최저가", color:"#6D4C41", mode:"hard" },
  { id:"tongin", name:"통인시장", type:"market", dist:"jongno", emoji:"🪙", x:38,y:24, desc:"엽전 도시락으로 유명", spec:"전통음식·떡 최저가", color:"#8E24AA", mode:"hard" },
  { id:"mart_b", name:"편리마트", type:"mart", dist:"yeongdeungpo", emoji:"🛒", x:30,y:62, desc:"영등포의 대형마트", spec:"품질 균일, 행복마트보다 약간 저렴", color:"#0277BD", mode:"hard" },
  { id:"mart_c", name:"큰마트", type:"mart", dist:"nowon", emoji:"🏪", x:78,y:10, desc:"노원의 대형마트", spec:"품질 균일, 북쪽 주민에게 유리", color:"#00838F", mode:"hard" },
];

// ─── Missions (all 8 location prices) ───
// Price order: [gwangjang, mangwon, namdaemun, mart_a, gyeongdong, tongin, mart_b, mart_c]
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
  { name:"붕어빵 3개",emoji:"🐟",price:1500,msg:"맛있는 냄새가 솔솔~ 붕어빵을 사먹을까?" },
  { name:"떡볶이 1인분",emoji:"🍢",price:2500,msg:"시장 떡볶이가 정말 맛있어 보여요!" },
  { name:"캐릭터 스티커",emoji:"⭐",price:2000,msg:"좋아하는 캐릭터 스티커를 발견했어요!" },
  { name:"솜사탕",emoji:"🍭",price:2000,msg:"알록달록 솜사탕이 눈에 들어와요!" },
  { name:"뽑기 1회",emoji:"🎯",price:1000,msg:"뽑기 기계! 원하는 게 나올 것 같아요!" },
  { name:"호떡",emoji:"🥞",price:1500,msg:"따끈따끈 호떡 냄새가 솔솔!" },
];

const AREA_ORDER = ["도심","동북","서북","서남","동남"];
const AREA_CLR = { "도심":C.pink, "동북":C.orange, "서북":C.green, "서남":C.purple, "동남":C.blueDark };
const DIFF = { easy:{ maxVisits:2, stamina:false, label:"쉬움" }, hard:{ maxVisits:3, stamina:true, startStamina:100, label:"어려움" }};

// ─── Mom Character Images (PIL-generated, base64 embedded) ───
const MOM_IMG = {
  normal: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAAEsCAYAAAD93j5yAAAKw0lEQVR4nO3dvY5kRxmA4RrkHBGRkQASREgQONoUZMkr4cR34MASCZIvwxIJkgPfgRMs2dIKpxs5wBIRlsCJMyLkKxiC3d7p6emf81Pn1PdVPU8CLLszZ7+qt+t0T+9MKQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXHXX+gJY54+//dn92o/x+Tff2wdJWbgEakS6lLhjszgBtQz2FkHHYjECiBzsLYJuy/AbyRztJWLen4HvrMdwTwl5Pwa9gxGivUTM2zLcDY0c7ikhb8NQNyDcy4Rcl2FWJNzphFzHj1pfQC/EO4951eFRcCUbcT2n8XIGt5Bw6xPyfG6hFxDvNsx1PgHPZJNty3znccsykY21P7fUtzmBJxBvG+Z+m4BvsInaMv/rBHyFzRODdbhMwBfYNLFYj/MEfIbNEpN1eUrAJ2yS2KzPYwI+YnPkYJ0eCPg1myIX6/WKgIvNkJV1E7BNkNzo6zd0wKMvfi9GXsdhAx550Xs06noOGfCoi927Edd1yIChF8MFPOKj9EhGW9+hAh5tcUc10joPE/BIi8o46z1EwKMsJo+NsO5DBAy96j7gER6Fuaz39e864N4Xj2l63gddBwy96zbgnh91ma/X/dBlwL0uFuv0uC+6DBhG0V3APT7KUk9v+6O7gGEkAobEugq4t9sjttHTPukqYBhNNwH39KjK9nrZL90EDCN6q/UFcN7fPvu0lFLKe+9/EOI6Sml/LTzVxU9A7+V26DiWS/aIKMp17OHzb75P3UDqiz/IHvCUYM6pFdHSz1/zGloRcABZA14TzjlzYmr5uSMRcADZAq4dzzmnQe3xOc993ugEHECmgPcKqaVMEQu4sSzxjhDuqSwhZ47Y14F3MGK8pYz7996TgDc2+iYe/e+/NW/k2IiN+yDKm1J65ATegHjPM5f6Ugcc8QUsm/S6iPOJuI+mSh1wNBE3Z0TmVI+AK7Ep5zGvOgRcgc24jLmtJ+CVbMJ1zG8dAa9g89VhjsulDbj1K4c2XV2t59l6Py2VNmBAwIu0Pi16Za7zCXgmm2xb5juPgGewufZhztMJGBIT8EROhX2Z9zQCnsBmasPcb0sZcNav2RFbxn2VMuA9OQXaMv/rfEeO185tFN9BIg7rc17K78ZX81bHI3x+NUPO9h0qh76FFm8fRl7HYQMeedF7NOp6DhnwqIvduxHXdciAoRfDBTzio/RIRlvf4QKGngwV8GiPzqMaaZ2HChh6451Yrfz89+d//buv9r2OJTJfe2dSvevkYMk7scLcVl3a/KcixpDs2pe8Q8s7sbhsagBzf+8eMl97xwS8lyWbOkoIma+9c54D7+HKZn72u18/+t8v//Gvp3+25S1p5msfgIAbOd38p7/+JIZAMl97b9xCN3Du5Drd9JciaS3ztfdIwFu78VzwePNfPLlaPZ/MfO2DEPDOjk+nc5v++NeinWSZr71XAobEhgk44vdPOndKZTm5ol97xPXewjABR3W86SMFMEXma++FLyNt7buvbr6Qc3Pzt/paauZrH0TKE3jp+1Uj3FbN+RpptK+nZrn2peuc7X3QpSQNGHhluICbnMInt5FTTqc3v6f1LWiya49wl7Unz4H3cvJ88rDJr76fuHW8B5mvvXPp7vkP1v50hmb/PjjZv6l9JPi1rz19Mz4HTnfBBzV+vErTf+Sf+btaBLz2GrfOAt5RrZ+PFOY7dbBYree9GQMe/jnwe+9/sC7ib3+4/v//6sfLP3YvNpzRaC9anUr7KnTzR8tvf7i9Mef8vh4lmlHz/bTQ8CfwbEs32uHPjXAim9Fu0p7ATdQ4JXo/jc1oVwKequam6nWDmtHuBDzFFpuptw1qRk0IuHglMyvrljzgXV453PIU6OWEST6jrK9Al5I8YBidgCExAUNiAn7NCyK5WK9X0ge8+QsQW74rqJd3HCWeUeYXsErpIGAYmYCn2OIU6OX0PTCjJroIuNZt0NXnVTU3U68bc6cZjfzvf091EfBuamzQXuM9MKNd+eeEcx0219x3CI20Kc1oN+lvIY41+TY7viPHbRVn5Pb5MSfwWgK9zYw24zkwJNZVwLu8Gt3A1x99Ur7+6JPuP+ctbp+f6irgXr398YellLJbUIfPc/i8xNVdwL2ewntFHDVep+953QXcs60jjhovl3X1aHSs55/ccBxwjdhqf7zanL6X+TJSQm9//OGb6E5P4ykBXjrBI8bLdd09Ih3r+RQ+qHE7HTlcp+91TuDkTuObEnTkYJmny0elYyOcwr1y+t7W/avQPS8et/W+/t0HXMr6RXT6trF27r3HW8ogAZeyfDFH2ASRWbfrhgm4lPmLOsomiM66XTZUwKVMX9zj33f3iz8MsyEiOZ77knUbwVB/2VPnXqG+tgHu//P3Kq9oc9u1B82569azIf/Sa4h4e+54phvuFnotm2tb5juPgBewybZhrvMJeCGbrS7zXEbAK9h0dZjjcgZXiRe35hPuek7gSmzGecyrDgFXZFNOY071CLgym/M686nLMDfkefED4W7DCbwhm/YVc9iOwe5kxNNYuNsz4J2NELJw92PQjfQYsnD3Z+CN9RCycNsx+CAyhizc9ixAQJFjFm0sFiO4CDGLNi4Lk8ieMYs2B4uU0JYhCzcX78RKZutTOMItO9MJGBITMCQmYEhMwJCYgCExAUNiAobEBAyJedfNRu5fPK//hogvn736zz//pvqHfuMv/3z47+++rPqh7975wn6r7K3WF9CTTaLtyPF8xFyHgCsQ7nyHmQl5HcNbYfdwD7fQpWxzG318+1xK9Vvoa4S8jBexFnLq1mWeywh4gRCb7fS0jPbxFggx12QEPFOoTVYrugDxHoSabwICniHk5lobX6B4D0LOOSgBTxR6Uy2NMGC8B6HnHYiAJ0ixmebG+O+/bnMdFaWYe2O+DtyTQ5S//NPt30MXBHxDylOgo0jvXzy/9zXiy9xCQ2ICviLl6dsh63CZgCExz4G3dPze5Yyfr+bH2/F91SPx4sAFq27b9g43kxUhezHrKSdwTcK97TAjJ3IVngPXIt55zKsKAddgMy5jbqsJeC2bcB3zW0XAkJiA13B61GGOiwkYEhPwUk6NusxzEQFDYgKGxAQMiQkYEhMwJCZgSEzAkJiAITEBQ2IChsQEDIkJGBITMCQmYEhMwJCYgCExAUNiAobEBAyJCRgSEzAkJmBITMCQmIAhMQFDYn7Ad3Q//UnrKyjlv/9rfQVc4ASOLEK8pcS5Dp4QcFTRool2PZRSBBxT1FiiXtfABBxN9EiiX99gBAyJCRgSEzAkJmBITMCQmIAhMQFDYgKGxAQMiQkYEhMwJCZgSEzAkJiAITEBQ2ICjib695+Kfn2DEXBEUSOJel0DE3BU0WKJdj2UUgQcW5RoolwHT/i+0NGJhyucwJCYgCExAS/17svWV9AX81xEwJCYgNdwatRhjosJ+IK7d764a30NPLAe5wl4LafHOua3ioBrsAmXMbfVBHzFrNs2m3GeGfNy+3yZd2LVdNiUXz5rex2ReaCryiPbBPcvnt8v+oNCfrAwXKfvdU7gLTlt2JjnwBM4Bdow99sEPJHNtC/znkbAM9hU+zDn6QQ8k821LfOdR8AL2GTbMNf5BLyQzVaXeS5jaBUs/joxwl3J8CoS8nTCrcMQNyLmp0QLAAAAAAAAAEC3/g++R8pSxkdijwAAAABJRU5ErkJggg==",
  happy: "data:image/png;base64,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",
  proud: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAAEsCAYAAAD93j5yAAALkklEQVR4nO3dv4ul1R3H8XOD/ZIqnY0RtgtMo822BsGFTLNFai0CAQlY+CdYCCIELGKdwmYFhcW02+w2A+mEJI1dquBfcFPMPs7dZ55f5/f3c77vV5Po7Mw8e85533PuM3euIQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANp16XwDy/OHqzXPu1/j25ifWgSgmTkCJSFMRt21MjkE9g91D0LYwGQZYDnYPQffF4HeiHO0aYm6PAW9sxHDnCLkdBroBD9GuIea6GNyKPIc7R8h1MKgVEO46Qi6LwSyIcI8j5DJ+1fsCRkG8cRivMngUzMRCzMdunI6BS0S45RFyPI7QCYi3DsY1HgFHYpHVxfjG4chyEAurPY7U+9iBDyDePhj3fQS8g0XUF+O/jYA3sHhsYB7WEfAKFo0tzMcyAl7AYrGJebmPgGdYJLYxP6+TCfj84up8fnFVdfJYHBqYpzsyAdfGotDCfN0i4MBiUMW8CQdc6jjNItDmff5MB7wW6fTvcyP2Pvmj8DyPZgNei/Tyn0/v3iS/VtbzpI+o1ny2uHmaw2zAl3EuDSDxYs7jvJoNOIT1SHPiBUZiJoQSx5QjYXt8lPam5K8hTutyWlvnF1dnSxuI6R24NOL1IXeea988LcnMI8mSrYGKfRQkXn9SduL5TdLS919KM7sD791tjnkUJF6fUua95s3TGswGPA3UfMD2BhjIpXTz1NwFrUm9mcDui62jdKubp7WY3YH3EC+OGnkdvNH7AoCeYu+vWDtGy+7Ae0Z+1EW8o+uh5M3TFmQCPr17czr66Ee8WHJkXajdPJUJGGhl7y60pWP0cAGz+2JL7vqwFG8IAwYMeELAgDBTx4FcHJ9x1Cj/4TR2YEDYMAGz+yLGKOtlmIABj3gppVFPv/lbCCGE6ycfmbiOEPpfC+4b4on8KMehy1jWtIjIynW0oH4zS/riJ+oBHwlmSamIUr9/yWvohYANUA04J5wlMTH1/N6WELABagGXjmfJPKgW33Pp+1pHwAYoBdwqpJ6UIibgzlTi9RDunErIyhHzc+AGPMYbgt+/d0sEXJn3Rez9718bL+SohIV7x8qLUkbEDlwB8S5jXMqTDtjiDSwW6TaL42NxHR0lHbA1FhenRYxTOQRcCIsyDuNVBgEXwGJMw7jlI+BMLMI8jF8eAs7A4iuDcUwnG3DvO4csurJ6j2fv9ZRKNmAABJyk924xKsY1HgFHYpHVxfjGIeAILK42GOfjCBgQRsAHsSu0xXgfQ8AHsJj6YNz3SQas+jM72Ka4riQDboldoC/GfxvvyPHK0kLhHSTsYH6WSb4bX8mjDo/w+kqGrPYOla6P0MQ7Bs/z6DZgz5M+Iq/z6TJgr5M9Oo/z6jJgYBTuAvb4KO2Jt/l1FzAwElcBe3t09srTPLsKGBgNAQPC3ATs6VgFP/PNa6E7ePTk482PP//my0ZXEk/52kdEwA3tLf75n7MUg/K1j4yAGzi6+Nc+r2cMytfuAQFXthbA2sJe+vOPnnzcJQTla/dC6lenJim/TtjjpsZ8Qccu5NzPz6F87ZOUXzPk1wkRQiizgOefk3qcjaV87d4QcAM5u0/v46fytXsgdVyYqByh0RdH6IHw/km+eJlvNwEDIyJgQJhkwKnPU7wcq7xLnWe1578hiAYM4Ja7gNmFx+Ztft0FDIzEZcDeHqW98DivLgMOwedkj8zrfLoNOAS/kz4az/Po/tcJr598lPcyyx9/3v74wwfpX3sUFcfIc7whCO/A3X9m9+PP+wsz5s+NSGiMuq+nRO534GipC236PA87MmPUjOwO3EWJXWL03ZgxaoqAjyq5qEZdoIxRcwR8RI3FNNoCZYy64DlwKHAnGl3k3IF+evXHu69z8/d7Hz9/+Okvbxpx+vozsze4zF7YUSnvzrFkNeDau8AIN2w6jVFKwJfhzp2+/ux0Ge7Sx6O/YWUcoQFhBAw3tnbfEF4/Nqd8vAcCBoQR8CveX5Knhvm6JR9w9ZfA1bzJNMINrBBkxmjpbnMMbmIBKIqfAx/x8EH5H5WMsvtORMZo2oX3bmhdsrjzTsxeWKzqPw8OodwCHS3eSw3GqNTz329vfpL7ue8cR+gYJcIbOd4Q5MZoLVKFeEMg4HgPH6QtsNTPUyQ2RvNYVeINYaAjdAiNjtFzpd9t4q334v58D//5R9yfLzhGJY/P8393/vDTs1K8IXATK5+XXTWHyBipxRsCR2hA2lABl3pRR9dX+cQeT1vreH01j8+qhgp4GFYjtnpdjg3zSHSpy82sBC8/+Wrz4+88fVr1+8d4eX29+fF3Pv9T1e/P7ruMHdiwvWhasXIduG/IgId4LvxK73h6f/8Q2H23DBmwiqPHzpfX181DivmetY/PWDfcI9IlhefCe8+D19R4fpz6IFEzYHbfbbyQQ9Q8tpSgLRyPkWfIR6VLI+/CFrD79jX8c2CFyVN9Dqlw3Qrzn2P4gEPIn8QWb/quEMOlFtebO+6jxxuCk4BDSJ/MlotAJeKW16kwbz25CTiE+EntsQisR9zj+hTmrRc3f9FLR25szRfB+d8/NH9Tb0s3t3qEe/rt71+bg5R5G52rv+zc0oLYWgBeI7YQ76XYeRuZy790jh4RT1rG3PMovxUvXsdAJegZ8aRGzBaefxNvHAYrkYWIL6UEbSHYS8QbjwHLYC1iZcSbxtWPkUpj0ZXBOKZj4AphN45HuPnYgQthMcZhvMog4IJYlMcwTuUQcGEszm2MT1kMZkU8L75DuHWwA1fEor3FONTDwDbicTcm3PoY4MY8hEy47TDQnYwYMuG2x4B3NkLIhNsPA2+EYsiE2x8TYJDlmInWFibDOAsxE61dTIyQljETrQYmSVDNkAlXC6/EElN7F7ZwZMdxBAwII2BAGAEDwggYEEbAgDACBoQRMCCMgAFhvOqmkvOzx+VfEPH9o9v//cvvin/pX3zxz7v//8Hzol/69P53rLfC3uh9ASOpEu1ALseHmMsg4AIIN940ZoSch8HL0Dzc6QgdQp1j9OXxOYTiR+gthJyGm1iJ2HXLYjzTEHACE4ttvlta+3oJTIyrGAKOZGqRlYrOQLwTU+MrgIAjmFxcufEZindicpyNIuCDTC+q1AgNxjsxPd6GEPABEospNsZ//bXOdRQkMe6d8XPgkUxRvv3n/T+DIRDwDsldYKBIz88en/kZ8TqO0IAwAt4gufsOiHlYR8CAMJ4D13T52mXF71fy6zV8XbUn3BxYkXVsax2ukoyQuZl1HztwSYS7bxojduQieA5cCvHGYbyKIOASWIxpGLdsBJyLRZiH8ctCwIAwAs7B7lEG45iMgAFhBJyKXaMsxjMJAQPCCBgQRsCAMAIGhBEwIIyAAWEEDAgjYEAYAQPCCBgQRsCAMAIGhBEwIIyAAWEEDAgjYEAYAQPCCBgQRsCAMAIGhBEwIIyAAWEEDAgjYEAYAQPC+A98W/ebX/e+ghD++7/eV4AV7MCWWYg3BDvXgXsI2Cpr0Vi7HoQQCNgmq7FYvS7HCNga65FYvz5nCBgQRsCAMAIGhBEwIIyAAWEEDAgjYEAYAQPCCBgQRsCAMAIGhBEwIIyAAWEEDAgjYEAYAVtj/f2nrF+fMwRskdVIrF6XYwRslbVYrF0PQggEbJuVaKxcB+7hfaGtIx5sYAcGhBEwIIyAU33wvPcVjIXxTELAgDACzsGuUQbjmIyAV5ze/+7U+xpwh/lYRsC52D3yMH5ZCLgEFmEaxi0bAW+IOraxGONEjBfH53W8EqukaVF+/6jvdVjGA11RPLIdcH72+Jz0iYR8JzFcdt9t7MA1sdugMp4DH8Au0Afjvo+AD2IxtcV4H0PAEVhUbTDOxxFwJBZXXYxvHAJOwCKrg3GNR8CJWGxlMZ5pGLQCkn9ODMLNxOAVRMjHEW4ZDGIlxHwf0QIAAAAAAAAAAAAAAGBY/weRblZpQXtrOQAAAABJRU5ErkJggg==",
  worried: "data:image/png;base64,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",
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
      <p style={{ fontSize:14, color:C.textLight, margin:"0 0 28px" }}>서울의 시장과 마트에서 합리적인 선택을 배워요!</p>
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

// ─── Seoul Map (interactive: drag-pan + pinch/wheel zoom) ───
const VB_FULL = { x:0, y:0, w:400, h:300 };
const VB_MIN_W = 120; // max zoom in
const VB_MAX_W = 400; // full view

function clampVB(vb) {
  const w = Math.max(VB_MIN_W, Math.min(VB_MAX_W, vb.w));
  const h = w * 0.75;
  const x = Math.max(0, Math.min(400 - w, vb.x));
  const y = Math.max(0, Math.min(300 - h, vb.y));
  return { x, y, w, h };
}

function SeoulMap({ locations, onPin, visited, selPin, district }) {
  const [vb, setVB] = useState({ ...VB_FULL });
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const pinchRef = useRef(null);
  const movedRef = useRef(false);

  const isZoomed = vb.w < VB_MAX_W - 10;

  // ── Mouse/touch → SVG coordinate helpers ──
  const screenToSVG = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: vb.x + ((clientX - rect.left) / rect.width) * vb.w,
      y: vb.y + ((clientY - rect.top) / rect.height) * vb.h,
    };
  };

  // ── Zoom ──
  const zoomAt = (factor, cx, cy) => {
    setVB(v => {
      const newW = v.w * factor;
      const newH = newW * 0.75;
      const newX = cx - (cx - v.x) * (newW / v.w);
      const newY = cy - (cy - v.y) * (newH / v.h);
      return clampVB({ x: newX, y: newY, w: newW, h: newH });
    });
  };

  const zoomIn = () => zoomAt(0.65, vb.x + vb.w / 2, vb.y + vb.h / 2);
  const zoomOut = () => zoomAt(1.5, vb.x + vb.w / 2, vb.y + vb.h / 2);
  const resetZoom = () => setVB({ ...VB_FULL });

  // ── Wheel zoom ──
  const onWheel = (e) => {
    e.preventDefault();
    const pt = screenToSVG(e.clientX, e.clientY);
    zoomAt(e.deltaY > 0 ? 1.15 : 0.85, pt.x, pt.y);
  };

  // ── Mouse drag ──
  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    dragRef.current = { sx: e.clientX, sy: e.clientY, vx: vb.x, vy: vb.y };
    movedRef.current = false;
  };
  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.sx;
    const dy = e.clientY - dragRef.current.sy;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = vb.w / rect.width;
    const scaleY = vb.h / rect.height;
    setVB(v => clampVB({ ...v, x: dragRef.current.vx - dx * scaleX, y: dragRef.current.vy - dy * scaleY }));
  };
  const onMouseUp = () => { dragRef.current = null; };

  // ── Touch pan + pinch ──
  const getTouchDist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  const getTouchMid = (t) => ({ x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 });

  const onTouchStart = (e) => {
    e.preventDefault();
    const t = e.touches;
    if (t.length === 1) {
      dragRef.current = { sx: t[0].clientX, sy: t[0].clientY, vx: vb.x, vy: vb.y };
      movedRef.current = false;
    } else if (t.length === 2) {
      dragRef.current = null;
      pinchRef.current = { dist: getTouchDist(t), vb: { ...vb }, mid: getTouchMid(t) };
    }
  };
  const onTouchMove = (e) => {
    e.preventDefault();
    const t = e.touches;
    if (t.length === 1 && dragRef.current) {
      const dx = t[0].clientX - dragRef.current.sx;
      const dy = t[0].clientY - dragRef.current.sy;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      setVB(clampVB({ ...vb, x: dragRef.current.vx - dx * (vb.w / rect.width), y: dragRef.current.vy - dy * (vb.h / rect.height) }));
    } else if (t.length === 2 && pinchRef.current) {
      const newDist = getTouchDist(t);
      const scale = pinchRef.current.dist / newDist;
      const mid = getTouchMid(t);
      const pt = screenToSVG(mid.x, mid.y);
      const pv = pinchRef.current.vb;
      const newW = pv.w * scale;
      const newH = newW * 0.75;
      const newX = pt.x - (pt.x - pv.x) * (newW / pv.w);
      const newY = pt.y - (pt.y - pv.y) * (newH / pv.h);
      setVB(clampVB({ x: newX, y: newY, w: newW, h: newH }));
      movedRef.current = true;
    }
  };
  const onTouchEnd = (e) => {
    if (e.touches.length === 0) { dragRef.current = null; pinchRef.current = null; }
  };

  // Pin click guard: only fire if not dragged
  const handlePinClick = (loc) => {
    if (movedRef.current) return;
    onPin(loc);
  };

  const vbStr = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;

  return (
    <div style={{ position:"relative", userSelect:"none", touchAction:"none" }}>
      <svg ref={svgRef} viewBox={vbStr}
        style={{ width:"100%", borderRadius:20, border:`2px solid ${C.grayLight}`, background:C.mapLand, display:"block" }}
        onWheel={onWheel}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      >
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
            <g key={loc.id} onClick={()=>!iv&&handlePinClick(loc)} style={{ cursor:iv?"default":"pointer" }} opacity={iv?0.4:1}>
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
        <rect x={vb.x+4} y={vb.y+vb.h-26} width="130" height="22" rx="8" fill="rgba(255,255,255,0.85)"/>
        <circle cx={vb.x+18} cy={vb.y+vb.h-15} r="4" fill="#E53935"/>
        <text x={vb.x+26} y={vb.y+vb.h-12} fontSize="7" fill={C.text}>전통시장</text>
        <circle cx={vb.x+70} cy={vb.y+vb.h-15} r="4" fill="#1565C0"/>
        <text x={vb.x+78} y={vb.y+vb.h-12} fontSize="7" fill={C.text}>대형마트</text>
      </svg>
      {/* Zoom Controls */}
      <div style={{ position:"absolute", top:10, right:10, display:"flex", flexDirection:"column", gap:4, zIndex:10 }}>
        <button onClick={zoomIn} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.grayLight}`, background:"rgba(255,255,255,0.9)", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
        <button onClick={zoomOut} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.grayLight}`, background:"rgba(255,255,255,0.9)", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
        {isZoomed && <button onClick={resetZoom} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.grayLight}`, background:"rgba(255,255,255,0.9)", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>↺</button>}
      </div>
      {isZoomed && <div style={{ position:"absolute", bottom:8, right:10, background:"rgba(0,0,0,0.5)", color:C.white, borderRadius:8, padding:"3px 8px", fontSize:10 }}>드래그로 이동 · 핀치/휠로 확대</div>}
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
          <h3 style={{ margin:0, fontSize:15, fontWeight:700 }}>📊 {item.emoji} {item.name}</h3>
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

function ShoppingScreen({ location, mission, cart, budget, spent, district, locations, onBuy, onDone }) {
  const [cmpItem, setCmpItem] = useState(null);
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
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {all.map((it,i)=>{
          const p=it.prices[location.id], inC=cart.find(c=>c.name===it.name), isReq=mission.required.includes(it);
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
                      {p===cheap && <span style={S.tag(C.greenLight,C.green)}>최저가</span>}
                      <button onClick={()=>setCmpItem(it)} style={{ ...S.tag(C.blueLight,C.blueDark), cursor:"pointer", border:"none", fontSize:11 }}>📊비교</button>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                  <div style={{ fontWeight:800, fontSize:16, color:p===cheap?C.green:C.text }}>{fmt(p)}</div>
                  {inC?<span style={{ fontSize:11, color:C.green }}>✅</span>
                    :ok?<button onClick={()=>onBuy(it,p,location)} style={{ ...S.btn(C.pink), padding:"5px 14px", fontSize:13, marginTop:3 }}>담기</button>
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


function MomResult({ mission, cart, spent, tBought, tResisted, rational, mood, district }) {
  const [dialogue, setDialogue] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const remaining = mission.budget - spent;
  const reqB = mission.required.filter(r=>cart.some(c=>c.name===r.name));

  // Determine expression
  const expr = rational>=80&&mood>=60 ? "proud" : rational>=60 ? "happy" : rational>=40 ? "normal" : "worried";

  // Fallback dialogues
  const fallback = rational>=80&&mood>=60
    ? "우와~ 우리 아이 정말 잘했다! 필요한 것만 알뜰하게 사왔네. 엄마가 자랑스러워!"
    : rational>=70&&mood<55
    ? "심부름 잘했어! 사고 싶은 것 참느라 힘들었지? 그래도 현명한 선택이었어. 다음엔 간식비를 따로 챙겨줄게~"
    : rational>=50
    ? `${tBought.length>0?tBought[0].name+"도 사왔구나~ 맛있긴 했겠다. ":""}그래도 잘 사온 편이야! 다음엔 필요한 것부터 먼저 사보자.`
    : "어머... 좀 아쉽네. 다음에 엄마랑 같이 가서 장보는 법을 알려줄게! 그래도 고생했어~";

  React.useEffect(()=>{
    let cancelled = false;
    (async()=>{
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({
            model:"claude-sonnet-4-6", max_tokens:300,
            messages:[{role:"user",content:`당신은 초등학교 4학년 자녀의 엄마입니다. 아이가 시장 심부름을 다녀왔어요.

미션: ${mission.title}
예산 ${mission.budget}원 중 ${spent}원 사용 (${remaining}원 남음)
필수 물건: ${reqB.length}/${mission.required.length}개 구매 (${reqB.map(r=>r.name).join(", ")})
${tBought.length>0?`유혹에 넘어간 물건: ${tBought.map(t=>t.name).join(", ")}`:"유혹을 잘 참았어요"}
${tResisted>0?`${tResisted}번 유혹을 참았어요`:""}
합리적 선택 점수: ${rational}/100, 마음 만족도: ${mood}/100

엄마 관점에서 아이의 심부름을 2~3문장으로 따뜻하게 평가해주세요.
반말(엄마 말투)로, 구체적인 물건 이름을 언급하면서 칭찬과 조언을 섞어주세요.
절대 100자를 넘기지 마세요.`}]
          })
        });
        const data = await res.json();
        if(!cancelled && data.content?.[0]?.text) setDialogue(data.content[0].text);
        else if(!cancelled) setDialogue(fallback);
      } catch(e) { if(!cancelled) setDialogue(fallback); }
      if(!cancelled) setLoading(false);
    })();
    return ()=>{cancelled=true};
  },[]);

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ textAlign:"center", marginBottom:12 }}>
        <span style={{ fontSize:13, fontWeight:700, color:C.textLight }}>🏠 집에 돌아왔어요!</span>
      </div>
      <MomBubble
        expression={expr}
        text={loading ? "음... 뭘 사왔는지 볼게~" : (dialogue || fallback)}
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

function ResultScreen({ mission, cart, spent, transportSpent, tBought, tResisted, district, difficulty, stamina, locations, onRestart }) {
  // MomResult will be rendered at top of return
  const rem = mission.budget - spent;
  const reqB = mission.required.filter(r=>cart.some(c=>c.name===r.name));
  const allReq = reqB.length===mission.required.length;
  const optB = mission.optional.filter(o=>cart.some(c=>c.name===o.name));
  const notB = mission.required.filter(r=>!cart.some(c=>c.name===r.name));

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
  const combo = rH&&mH ? { e:"🌟",t:"완벽한 하루!",m:"합리적으로 선택하고 마음도 뿌듯해요!",bg:"linear-gradient(135deg,#FFF9C4,#DCEDC8)" }
    : rH&&!mH ? { e:"🧠",t:"심부름은 잘했는데...",m:"현명한 선택이었어요! 아쉬운 마음은 자연스러운 거예요.",bg:"linear-gradient(135deg,#E3F2FD,#F3E5F5)" }
    : !rH&&mH ? { e:"😊",t:"기분은 좋은데...",m:"기분은 좋지만 예산이 걱정돼요!",bg:"linear-gradient(135deg,#FFF3E0,#FCE4EC)" }
    : { e:"🤗",t:"다음엔 더 잘할 수 있어요!",m:"계획을 세우면 마음도 예산도 만족할 수 있어요!",bg:"linear-gradient(135deg,#ECEFF1,#F5F5F5)" };

  return (
    <div>
      <MomResult mission={mission} cart={cart} spent={spent} tBought={tBought} tResisted={tResisted} rational={rational} mood={mood} district={district} />

      <div style={{ textAlign:"center", padding:"24px 16px", borderRadius:24, marginBottom:16, background:combo.bg }}>
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

  const locations = difficulty ? ALL_LOCATIONS.filter(l => difficulty==="hard" || l.mode==="easy") : [];

  const reset = useCallback(()=>{
    setScreen("intro"); setDifficulty(null); setMission(null); setDistrict(null);
    setCart([]); setSpent(0); setTransportSpent(0); setStamina(100);
    setVisited([]); setCurLoc(null); setTBought([]); setTResisted(0);
    setCurTemp(null); setUsedT([]);
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
    <div style={S.container}>
      {showBar && <TopBar budget={mission.budget} spent={spent} transportTotal={transportSpent} difficulty={difficulty} stamina={stamina}/>}
      {screen==="intro" && <IntroScreen onStart={()=>setScreen("difficulty")}/>}
      {screen==="difficulty" && <DifficultyScreen onSelect={d=>{setDifficulty(d);setScreen("mission")}}/>}
      {screen==="mission" && <MissionScreen onSelect={m=>{setMission(m);setCart([]);setSpent(0);setTransportSpent(0);setStamina(100);setVisited([]);setTBought([]);setTResisted(0);setUsedT([]);setScreen("district")}}/>}
      {screen==="district" && <DistrictScreen onSelect={d=>{setDistrict(d);setScreen("briefing")}}/>}
      {screen==="briefing"&&mission&&district && <BriefingScreen mission={mission} district={district} difficulty={difficulty} onGo={()=>setScreen("map")} />}
      {screen==="map"&&mission&&district && <MapScreen mission={mission} visited={visited} cart={cart} spent={spent} district={district} difficulty={difficulty} stamina={stamina} locations={locations} onVisit={visitLoc} onFinish={()=>setScreen("result")}/>}
      {screen==="shopping"&&curLoc&&mission&&district && <ShoppingScreen location={curLoc} mission={mission} cart={cart} budget={mission.budget} spent={spent} district={district} locations={locations} onBuy={buyItem} onDone={doneShopping}/>}
      {screen==="temptation"&&curTemp && <TemptationScreen tempt={curTemp} budget={mission.budget} spent={spent} onBuy={()=>{setTBought(tb=>[...tb,curTemp]);setSpent(s=>s+curTemp.price);setCurTemp(null);setScreen("map")}} onSkip={()=>{setTResisted(r=>r+1);setCurTemp(null);setScreen("map")}}/>}
      {screen==="result"&&mission&&district && <ResultScreen mission={mission} cart={cart} spent={spent} transportSpent={transportSpent} tBought={tBought} tResisted={tResisted} district={district} difficulty={difficulty} stamina={stamina} locations={locations} onRestart={reset}/>}
    </div>
  );
}
