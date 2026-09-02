# 시장놀이

수요와 공급, 가격 변화를 게임으로 익히는 React/Vite 기반 학습 게임입니다.

## 로컬 실행과 점검

```bash
npm install
npm run dev
npm run check
```

`npm run check`는 프로덕션 번들을 만들어 진입점과 모듈 연결을 확인하는 최소 스모크 검사입니다.

## 데이터와 저장소

- 난이도 해금 진행도는 브라우저 `localStorage`에만 저장됩니다.
- 별도 회원·학생 데이터베이스나 서버 저장 기능은 확인되지 않았습니다.
- `node_modules/`, `dist/`, 로컬 설정 파일은 Git에 포함하지 않습니다.

