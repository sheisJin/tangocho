# JPT 단어장 — Vercel 배포 가이드

지인에게 링크를 나눠주면, **각자 자기 폰에 자기 데이터가 저장되는** 앱입니다.

---

## 준비물

| 필요한 것 | 비용 | 어디서 |
|---|---|---|
| GitHub 계정 | 무료 | github.com |
| Vercel 계정 | 무료 | vercel.com — GitHub 계정으로 로그인 |
| Anthropic API 키 | 사용한 만큼 | console.anthropic.com |
| Node.js | 무료 | nodejs.org — LTS 버전 |

API 키는 사진 등록과 Claude 가져오기에만 씁니다. 이 두 기능을 안 쓸 거라면 키 없이도 배포됩니다(나머지는 정상 동작).

---

## 1. 로컬에서 실행해 보기

```bash
npm install
npm run dev
```

터미널에 뜨는 `http://localhost:5173` 을 브라우저에서 엽니다.

이 단계에서는 사진 등록이 동작하지 않습니다. `/api/extract`가 Vercel 환경에서만 살아있기 때문입니다. 나머지 기능(단어 카드, 퀴즈, 직접 입력, 저장)은 모두 확인할 수 있습니다.

---

## 2. GitHub에 올리기

```bash
git init
git add .
git commit -m "JPT 단어장 첫 배포"
```

GitHub에서 새 저장소를 만든 뒤, 화면에 나오는 주소로 연결합니다.

```bash
git remote add origin https://github.com/사용자명/저장소명.git
git branch -M main
git push -u origin main
```

`.gitignore`에 `node_modules`와 `.env`가 들어 있어서, 무거운 폴더와 비밀 키는 올라가지 않습니다.

---

## 3. Vercel에 배포

1. vercel.com 로그인 → **Add New → Project**
2. 방금 올린 GitHub 저장소를 선택 → **Import**
3. 설정은 **건드리지 않습니다.** Vercel이 Vite 프로젝트를 알아서 인식합니다
4. **Environment Variables**에 키를 추가합니다
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (본인 키)
5. **Deploy** 클릭

1~2분 뒤 `https://저장소명.vercel.app` 주소가 나옵니다. 이게 지인에게 보낼 링크입니다.

> 환경변수를 나중에 추가했다면 **Deployments → 최신 항목 → Redeploy**를 눌러야 반영됩니다.

---

## 4. 폰에서 앱처럼 쓰기

받은 링크를 폰 브라우저로 열고, 메뉴에서 **홈 화면에 추가**를 누릅니다.

- 바탕화면에 아이콘 생성
- 주소창 없이 전체 화면으로 실행
- 데이터는 그 폰의 브라우저에 저장

지인마다 자기 폰에 자기 단어장이 생깁니다. 서로 데이터가 섞이지 않습니다.

---

## 수정하고 다시 배포하기

```bash
git add .
git commit -m "수정 내용"
git push
```

`push`만 하면 Vercel이 자동으로 다시 배포합니다. 별도 명령이 필요 없습니다.

---

## 구조

```
jpt-app/
├── api/
│   └── extract.js      서버리스 함수 — API 키를 감추고 Claude에 중계
├── public/
│   ├── manifest.json   홈 화면 아이콘·이름 설정
│   └── icon-*.png
├── src/
│   ├── App.jsx         앱 본체
│   ├── lib.js          저장소 어댑터 + 가져오기 파서 + API 호출
│   ├── main.jsx        진입점
│   └── index.css       Tailwind
├── index.html
└── vite.config.js
```

### 아티팩트 버전과 달라진 점

| 부분 | 아티팩트 | 배포판 |
|---|---|---|
| 저장 | `window.storage` | `localStorage` (`src/lib.js`의 `store`가 자동 판별) |
| Claude 호출 | 브라우저에서 직접 | `/api/extract` 경유 — 키가 노출되지 않음 |
| Tailwind | 자동 주입 | `@tailwindcss/vite`로 빌드 |

`store` 어댑터는 두 환경을 모두 지원하므로, 같은 `App.jsx`가 아티팩트에서도 배포판에서도 돌아갑니다.

---

## 알아둘 점

**데이터는 브라우저에 저장됩니다.** 브라우저 데이터를 지우거나 다른 폰으로 바꾸면 단어장이 사라집니다. 설정 → JSON 내보내기로 가끔 백업하세요.

**API 비용이 발생합니다.** 사진 등록과 Claude 가져오기를 쓸 때만이며, 사진 한 장에 수십 원 수준입니다. 지인이 늘면 Anthropic 콘솔에서 사용량 한도를 걸어두세요.

**링크를 아는 사람은 누구나 씁니다.** 단어장이라 문제될 건 없지만, API 비용이 걱정되면 Vercel의 접근 제한 기능을 검토하세요.
