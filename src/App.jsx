import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { store, normalizeImport, extractWords } from "./lib.js";

/* ================= 디자인 토큰 ================= */
const C = {
  navy: "#232C4D",
  navyDeep: "#1A2140",
  bg: "#F2F1EE",
  card: "#FFFFFF",
  ink: "#1D2333",
  sub: "#6E7488",
  line: "#DFDFDA",
  red: "#C0392B",
  green: "#2E7D4F",
  orange: "#C64B33",
  danger: "#A32A1C",
};
const F = {
  jp: "'Noto Serif JP','Hiragino Mincho ProN','Yu Mincho',serif",
  ui: "'Pretendard','Apple SD Gothic Neo',system-ui,sans-serif",
  mono: "'IBM Plex Mono',ui-monospace,monospace",
};

/* ================= 초기 단어 데이터 ================= */
const RAW = [
  { kanji: "引き継ぐ", kana: "ひきつぐ", ko: "인계하다, 이어받다", pos: "동사", lv: 2, ex: "業務を引き継ぐ。", exKo: "업무를 인계하다." },
  { kanji: "会議", kana: "かいぎ", ko: "회의", pos: "명사", lv: 1, ex: "午後から会議が始まります。", exKo: "오후부터 회의가 시작됩니다." },
  { kanji: "資料", kana: "しりょう", ko: "자료", pos: "명사", lv: 1, ex: "資料を五部コピーしてください。", exKo: "자료를 5부 복사해 주세요." },
  { kanji: "打ち合わせ", kana: "うちあわせ", ko: "사전 협의, 미팅", pos: "명사", lv: 2, ex: "明日、先方と打ち合わせがあります。", exKo: "내일 상대측과 미팅이 있습니다." },
  { kanji: "見積もり", kana: "みつもり", ko: "견적", pos: "명사", lv: 2, ex: "見積もりを出していただけますか。", exKo: "견적을 내주실 수 있습니까?" },
  { kanji: "締め切り", kana: "しめきり", ko: "마감", pos: "명사", lv: 2, ex: "締め切りは今週の金曜日です。", exKo: "마감은 이번 주 금요일입니다." },
  { kanji: "取引先", kana: "とりひきさき", ko: "거래처", pos: "명사", lv: 2, ex: "取引先に連絡を入れました。", exKo: "거래처에 연락을 넣었습니다." },
  { kanji: "担当者", kana: "たんとうしゃ", ko: "담당자", pos: "명사", lv: 1, ex: "担当者に代わります。", exKo: "담당자를 바꿔 드리겠습니다." },
  { kanji: "出張", kana: "しゅっちょう", ko: "출장", pos: "명사", lv: 1, ex: "来週、大阪に出張します。", exKo: "다음 주에 오사카로 출장 갑니다." },
  { kanji: "残業", kana: "ざんぎょう", ko: "야근, 잔업", pos: "명사", lv: 1, ex: "今日は残業しなくてもいいです。", exKo: "오늘은 야근하지 않아도 됩니다." },
  { kanji: "報告", kana: "ほうこく", ko: "보고", pos: "명사", lv: 1, ex: "結果を部長に報告します。", exKo: "결과를 부장님께 보고하겠습니다." },
  { kanji: "確認", kana: "かくにん", ko: "확인", pos: "명사", lv: 1, ex: "内容をご確認ください。", exKo: "내용을 확인해 주십시오." },
  { kanji: "提案", kana: "ていあん", ko: "제안", pos: "명사", lv: 2, ex: "新しい提案を受け入れました。", exKo: "새로운 제안을 받아들였습니다." },
  { kanji: "納期", kana: "のうき", ko: "납기", pos: "명사", lv: 2, ex: "納期に間に合いそうです。", exKo: "납기에 맞출 수 있을 것 같습니다." },
  { kanji: "契約", kana: "けいやく", ko: "계약", pos: "명사", lv: 2, ex: "来月、契約を更新します。", exKo: "다음 달에 계약을 갱신합니다." },
  { kanji: "交渉", kana: "こうしょう", ko: "교섭, 협상", pos: "명사", lv: 3, ex: "価格の交渉は難航しています。", exKo: "가격 협상은 난항을 겪고 있습니다." },
  { kanji: "手配", kana: "てはい", ko: "수배, 준비", pos: "명사", lv: 3, ex: "ホテルの手配は済みました。", exKo: "호텔 준비는 끝났습니다." },
  { kanji: "予算", kana: "よさん", ko: "예산", pos: "명사", lv: 2, ex: "予算を大幅に超えました。", exKo: "예산을 크게 초과했습니다." },
  { kanji: "削減", kana: "さくげん", ko: "삭감, 절감", pos: "명사", lv: 3, ex: "コストの削減が急務です。", exKo: "비용 절감이 시급합니다." },
  { kanji: "依頼", kana: "いらい", ko: "의뢰", pos: "명사", lv: 3, ex: "調査を専門機関に依頼しました。", exKo: "조사를 전문 기관에 의뢰했습니다." },
  { kanji: "承諾", kana: "しょうだく", ko: "승낙", pos: "명사", lv: 3, ex: "先方の承諾を得ました。", exKo: "상대측의 승낙을 얻었습니다." },
  { kanji: "妥当", kana: "だとう", ko: "타당함", pos: "な형용사", lv: 3, ex: "その判断は妥当だと思います。", exKo: "그 판단은 타당하다고 생각합니다." },
  { kanji: "迅速", kana: "じんそく", ko: "신속함", pos: "な형용사", lv: 3, ex: "迅速な対応に感謝します。", exKo: "신속한 대응에 감사드립니다." },
  { kanji: "円滑", kana: "えんかつ", ko: "원활함", pos: "な형용사", lv: 3, ex: "業務が円滑に進んでいます。", exKo: "업무가 원활하게 진행되고 있습니다." },
  { kanji: "把握", kana: "はあく", ko: "파악", pos: "명사", lv: 3, ex: "状況を正確に把握してください。", exKo: "상황을 정확히 파악해 주세요." },
];
const makeSeed = () =>
  RAW.map((w, i) => ({
    ...w,
    id: `seed_${i}_${Date.now()}`,
    source: "seed",
    addedAt: Date.now() - (RAW.length - i) * 60000,
    seenCount: 0,
    knownCount: 0,
    wrongCount: 0,
    mastered: false,
  }));

const KEY_WORDS = "jpt3:words";
const KEY_CFG = "jpt3:config";

const DEFAULT_CFG = {
  goal: 750,
  masteredMode: "lower", // lower | exclude | ignore
  speechRate: 0.9,
  autoSpeak: false,
  hideMeaning: false, // 뜻을 탭해서 공개
  masterAt: 3, // 정복 판정 기준 (알아요 누적 횟수)
};

/* ================= Claude 가져오기 프롬프트 =================
 *
 * 각자 자기 Claude 계정의 대화를 뒤지므로, 이 앱을 쓰는 사람마다
 * 자기 단어만 들어옵니다. 서로 섞이지 않습니다.
 */
const CLAUDE_PROMPT = `내가 지금까지 너와 나눈 대화에서 일본어 단어를 모아 단어장 파일을 만들려고 해.
아래 규칙을 지켜서 JSON만 출력해 줘.

[대상]
- 과거 대화 중 일본어 학습·번역·회화와 관련된 내용 전부
- 최근 대화부터 찾고, 최대 50개까지

[규칙]
1. 같은 단어는 한 번만. 표기가 달라도 같은 말이면 하나로 합쳐 줘.
2. 조사, 인사말, 사람 이름, 지명, 상품명은 빼 줘.
3. 예문은 대화에 실제로 나왔던 문장을 우선 쓰고, 없으면 짧게 새로 만들어 줘.
4. 대화에 있던 개인적인 내용(이름, 회사명, 일정, 고민 등)은 예문에 절대 넣지 마.
   일반적인 문장으로 바꿔 줘.
5. lv은 난이도. 1=기초, 2=중급, 3=고급.
6. ko(뜻)와 exKo(예문 번역)는 한국어로 써 줘.

[중요]
과거 대화를 찾을 수 없으면 단어를 지어내지 말고,
"과거 대화를 찾을 수 없습니다"라고 한 문장만 답해 줘.

[출력 형식]
설명, 인사말, 마크다운 코드블록(\`\`\`) 없이 아래 JSON만 출력해.

{
  "schema": "jpt-vocab/1.0",
  "source": "claude-chat",
  "words": [
    {
      "kanji": "引き継ぐ",
      "kana": "ひきつぐ",
      "ko": "인계하다, 이어받다",
      "pos": "동사",
      "lv": 2,
      "ex": "業務を引き継ぐ。",
      "exKo": "업무를 인계하다."
    }
  ]
}`;

/* ================= 유틸 ================= */
const speak = (text, rate = 0.9) => {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    u.rate = rate;
    window.speechSynthesis.speak(u);
  } catch (e) {
    console.error("음성 재생을 지원하지 않는 환경입니다", e);
  }
};

const pickWeighted = (pool, excludeId) => {
  const cand = pool.filter((w) => w.id !== excludeId);
  const list = cand.length ? cand : pool;
  if (!list.length) return null;
  const weights = list.map((w) => (1 + w.wrongCount) / (1 + w.knownCount * 2));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < list.length; i++) {
    r -= weights[i];
    if (r <= 0) return list[i];
  }
  return list[list.length - 1];
};

/* ================= 루트 ================= */
export default function App() {
  const [tab, setTab] = useState("card");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [words, setWords] = useState([]);
  const [config, setConfig] = useState(DEFAULT_CFG);
  const [loading, setLoading] = useState(true);

  const [currentId, setCurrentId] = useState(null);
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    (async () => {
      let loaded = null;
      try {
        const r = await store.get(KEY_WORDS);
        if (r?.value) loaded = JSON.parse(r.value);
      } catch {}
      const init = Array.isArray(loaded) ? loaded : makeSeed();
      setWords(init);
      setCurrentId(init[0]?.id ?? null);
      try {
        const c = await store.get(KEY_CFG);
        if (c?.value) setConfig((p) => ({ ...p, ...JSON.parse(c.value) }));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const saveWords = useCallback(async (next) => {
    setWords(next);
    try {
      await store.set(KEY_WORDS, JSON.stringify(next));
    } catch (e) {
      console.error("단어 저장 실패", e);
    }
  }, []);

  const saveConfig = useCallback(async (next) => {
    setConfig(next);
    try {
      await store.set(KEY_CFG, JSON.stringify(next));
    } catch (e) {
      console.error("설정 저장 실패", e);
    }
  }, []);

  const studyPool = useMemo(
    () => (config.masteredMode === "exclude" ? words.filter((w) => !w.mastered) : words),
    [words, config.masteredMode]
  );

  const current = useMemo(
    () => words.find((w) => w.id === currentId) || studyPool[0] || words[0] || null,
    [words, currentId, studyPool]
  );

  const showToast = (payload) => {
    clearTimeout(toastTimer.current);
    setToast(payload);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const mark = (action) => {
    if (!current) return;
    setHistory((h) => [
      ...h.slice(-19),
      {
        wordId: current.id,
        action,
        snapshot: {
          seenCount: current.seenCount,
          knownCount: current.knownCount,
          wrongCount: current.wrongCount,
          mastered: current.mastered,
        },
      },
    ]);

    const next = words.map((w) => {
      if (w.id !== current.id) return w;
      const knownCount = w.knownCount + (action === "known" ? 1 : 0);
      return {
        ...w,
        seenCount: w.seenCount + 1,
        knownCount,
        wrongCount: w.wrongCount + (action === "known" ? 0 : 1),
        mastered: knownCount >= config.masterAt,
      };
    });
    saveWords(next);

    const pool = config.masteredMode === "exclude" ? next.filter((w) => !w.mastered) : next;
    const nx = pickWeighted(pool, current.id);
    if (nx) setCurrentId(nx.id);

    showToast({ text: `「${current.kanji}」 ${action === "known" ? "알아요" : "몰라요"}로 기록`, kind: action });
  };

  const undo = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    saveWords(words.map((w) => (w.id === last.wordId ? { ...w, ...last.snapshot } : w)));
    setCurrentId(last.wordId);
    setToast(null);
    clearTimeout(toastTimer.current);
  };

  const removeWord = (id) => {
    const next = words.filter((w) => w.id !== id);
    saveWords(next);
    setHistory((h) => h.filter((x) => x.wordId !== id));
    const nx = pickWeighted(next, id);
    setCurrentId(nx ? nx.id : null);
  };

  const addWords = (items) => {
    const made = items.map((it, i) => ({
      ...it,
      id: `w_${Date.now()}_${i}`,
      lv: it.lv || 2,
      addedAt: Date.now(),
      seenCount: 0,
      knownCount: 0,
      wrongCount: 0,
      mastered: false,
    }));
    const next = [...made, ...words];
    saveWords(next);
    if (!currentId) setCurrentId(made[0]?.id ?? null);
    return made.length;
  };

  /* ---- 설정: 데이터 관리 ---- */
  const clearAllWords = () => {
    saveWords([]);
    setHistory([]);
    setCurrentId(null);
    showToast({ text: "단어를 모두 삭제했습니다", kind: "unknown" });
  };

  const resetProgressOnly = () => {
    saveWords(
      words.map((w) => ({ ...w, seenCount: 0, knownCount: 0, wrongCount: 0, mastered: false }))
    );
    setHistory([]);
    showToast({ text: "학습 기록을 초기화했습니다", kind: "known" });
  };

  const restoreSeed = () => {
    const seed = makeSeed();
    const next = [...seed, ...words];
    saveWords(next);
    setCurrentId(seed[0].id);
    showToast({ text: `기본 단어 ${seed.length}개를 불러왔습니다`, kind: "known" });
  };

  const stats = useMemo(
    () => ({
      total: words.length,
      unseen: words.filter((w) => w.seenCount === 0).length,
      mastered: words.filter((w) => w.mastered).length,
      wrong: words.filter((w) => w.wrongCount > 0).length,
    }),
    [words]
  );

  const TABS = [
    { id: "add", label: "등록", icon: "＋" },
    { id: "wrong", label: "오답노트", icon: "📕" },
    { id: "card", label: "단어카드", icon: "🀄" },
    { id: "quiz", label: "단어퀴즈", icon: "✍️" },
    { id: "dict", label: "사전", icon: "📗" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg, fontFamily: F.ui }}>
      <style>{`
        @keyframes slideUp { from {opacity:0;transform:translate(-50%,12px)} to {opacity:1;transform:translate(-50%,0)} }
        @keyframes pop { from {opacity:0;transform:scale(.97)} to {opacity:1;transform:none} }
        button:focus-visible { outline:2px solid ${C.red}; outline-offset:2px; }
        @media (prefers-reduced-motion: reduce){ *{animation:none!important;transition:none!important} }
      `}</style>

      {/* 헤더 */}
      <header className="px-5 pb-4 pt-5" style={{ backgroundColor: C.navy }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 style={{ fontFamily: F.jp, fontSize: 26, color: "#fff" }}>JPT 誤答ノート</h1>
            <p className="mt-1" style={{ fontSize: 13, color: "#A9B2CC" }}>
              목표 {config.goal}점 · 오답 {stats.wrong}건 · 단어 {stats.total}개
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="rounded-md px-3 py-1"
              style={{ fontFamily: F.jp, fontSize: 15, color: "#F0B7A8", border: "1px solid #C0655080" }}
            >
              復習
            </span>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center justify-center rounded-md"
              style={{ width: 38, height: 34, fontSize: 18, color: "#fff", border: "1px solid #4A5478" }}
              aria-label="설정 열기"
            >
              ⚙
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pb-28 pt-4">
        {loading ? (
          <p className="py-16 text-center" style={{ color: C.sub }}>불러오는 중…</p>
        ) : tab === "card" ? (
          <CardView
            word={current}
            stats={stats}
            config={config}
            canUndo={history.length > 0}
            lastAction={history[history.length - 1]}
            onMark={mark}
            onUndo={undo}
            onDelete={removeWord}
            onGoDict={() => setTab("dict")}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        ) : tab === "wrong" ? (
          <WrongNote words={words} onPick={(id) => { setCurrentId(id); setTab("card"); }} />
        ) : tab === "quiz" ? (
          <QuizView pool={studyPool} all={words} onMark={mark} />
        ) : tab === "dict" ? (
          <DictView
            words={words}
            rate={config.speechRate}
            onStudy={(id) => { setCurrentId(id); setTab("card"); }}
            onDelete={removeWord}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        ) : (
          <AddView onAdd={addWords} existing={words} />
        )}
      </main>

      {/* 설정 시트 */}
      {settingsOpen && (
        <SettingsSheet
          config={config}
          stats={stats}
          onChange={saveConfig}
          onClose={() => setSettingsOpen(false)}
          onClearAll={clearAllWords}
          onResetProgress={resetProgressOnly}
          onRestoreSeed={restoreSeed}
          words={words}
        />
      )}

      {/* 되돌리기 스낵바 */}
      {toast && (
        <div
          className="fixed flex items-center gap-3 rounded-lg px-4 py-3"
          style={{
            left: "50%", bottom: 92, transform: "translateX(-50%)",
            backgroundColor: C.navyDeep, color: "#fff", fontSize: 13,
            maxWidth: "92%", animation: "slideUp 220ms ease both", zIndex: 40,
          }}
        >
          <span style={{ color: toast.kind === "known" ? "#8FD9AD" : "#F0A08F" }}>●</span>
          <span className="flex-1">{toast.text}</span>
          {history.length > 0 && (
            <button onClick={undo} style={{ color: "#FFD9CF", fontWeight: 700, whiteSpace: "nowrap" }}>
              되돌리기
            </button>
          )}
        </div>
      )}

      {/* 하단 탭 */}
      <nav
        className="fixed bottom-0 left-0 right-0 flex"
        style={{ backgroundColor: "#fff", borderTop: `1px solid ${C.line}`, zIndex: 30 }}
      >
        {TABS.map((t) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex flex-1 flex-col items-center gap-1 py-2"
              style={{ color: on ? C.red : C.sub }}
            >
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              <span style={{ fontSize: 11, fontWeight: on ? 700 : 500 }}>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ================= 설정 ================= */
function Row({ label, desc, children }) {
  return (
    <div className="py-4" style={{ borderBottom: `1px solid ${C.line}` }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{label}</p>
      {desc && <p className="mt-1" style={{ fontSize: 12, color: C.sub }}>{desc}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="flex gap-2">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className="flex-1 rounded-md py-2"
            style={{
              fontSize: 12,
              backgroundColor: on ? C.navy : "transparent",
              color: on ? "#fff" : C.sub,
              border: `1px solid ${on ? C.navy : C.line}`,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ on, onChange, label }) {
  return (
    <button onClick={() => onChange(!on)} className="flex w-full items-center justify-between">
      <span style={{ fontSize: 13, color: C.ink }}>{label}</span>
      <span
        className="flex items-center rounded-full"
        style={{
          width: 46, height: 26, padding: 3,
          backgroundColor: on ? C.green : "#C9CBD2",
          justifyContent: on ? "flex-end" : "flex-start",
          transition: "background-color 160ms",
        }}
      >
        <span className="rounded-full" style={{ width: 20, height: 20, backgroundColor: "#fff" }} />
      </span>
    </button>
  );
}

function SettingsSheet({ config, stats, words, onChange, onClose, onClearAll, onResetProgress, onRestoreSeed }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [copied, setCopied] = useState("");

  const set = (patch) => onChange({ ...config, ...patch });

  const exportJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(words, null, 2));
      setCopied("단어장 JSON을 클립보드에 복사했습니다");
    } catch {
      setCopied("복사에 실패했습니다. 브라우저 권한을 확인해 주세요.");
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ backgroundColor: "rgba(20,24,40,.45)", zIndex: 60 }}
      onClick={onClose}
    >
      <div className="flex-1" />
      <div
        className="rounded-t-2xl px-5 pb-8 pt-4"
        style={{ backgroundColor: C.bg, maxHeight: "88vh", overflowY: "auto", animation: "pop 200ms ease both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 style={{ fontSize: 19, fontWeight: 700, color: C.ink }}>설정</h2>
          <button onClick={onClose} style={{ fontSize: 14, color: C.sub }}>닫기</button>
        </div>

        {/* --- 학습 --- */}
        <p className="mt-4" style={{ fontFamily: F.mono, fontSize: 11, color: C.sub, letterSpacing: 1 }}>학습</p>
        <div className="rounded-lg px-4" style={{ backgroundColor: "#fff", border: `1px solid ${C.line}` }}>
          <Row label="목표 점수" desc="헤더에 표시됩니다">
            <div className="flex items-center gap-3">
              <button
                onClick={() => set({ goal: Math.max(400, config.goal - 50) })}
                className="rounded-md px-4 py-2"
                style={{ border: `1px solid ${C.line}`, fontSize: 16 }}
              >
                −
              </button>
              <span style={{ fontFamily: F.mono, fontSize: 20, color: C.ink, minWidth: 60, textAlign: "center" }}>
                {config.goal}
              </span>
              <button
                onClick={() => set({ goal: Math.min(990, config.goal + 50) })}
                className="rounded-md px-4 py-2"
                style={{ border: `1px solid ${C.line}`, fontSize: 16 }}
              >
                ＋
              </button>
            </div>
          </Row>

          <Row label="정복한 단어 처리" desc={`✅를 ${config.masterAt}번 누른 단어를 어떻게 할까요?`}>
            <Segmented
              value={config.masteredMode}
              onChange={(v) => set({ masteredMode: v })}
              options={[
                { id: "lower", label: "빈도만 낮춤" },
                { id: "exclude", label: "완전 제외" },
                { id: "ignore", label: "그대로" },
              ]}
            />
          </Row>

          <Row label="정복 판정 기준" desc="알아요를 몇 번 눌러야 정복으로 볼지">
            <Segmented
              value={String(config.masterAt)}
              onChange={(v) => set({ masterAt: Number(v) })}
              options={[
                { id: "2", label: "2번" },
                { id: "3", label: "3번" },
                { id: "5", label: "5번" },
              ]}
            />
          </Row>

          <Row label="카드 표시">
            <Toggle
              on={config.hideMeaning}
              onChange={(v) => set({ hideMeaning: v })}
              label="뜻을 가리고 탭하면 공개"
            />
          </Row>
        </div>

        {/* --- 음성 --- */}
        <p className="mt-5" style={{ fontFamily: F.mono, fontSize: 11, color: C.sub, letterSpacing: 1 }}>음성</p>
        <div className="rounded-lg px-4" style={{ backgroundColor: "#fff", border: `1px solid ${C.line}` }}>
          <Row label="발음 속도">
            <Segmented
              value={String(config.speechRate)}
              onChange={(v) => { set({ speechRate: Number(v) }); speak("引き継ぐ", Number(v)); }}
              options={[
                { id: "0.7", label: "느리게" },
                { id: "0.9", label: "보통" },
                { id: "1.1", label: "빠르게" },
              ]}
            />
          </Row>
          <Row label="자동 재생">
            <Toggle
              on={config.autoSpeak}
              onChange={(v) => set({ autoSpeak: v })}
              label="카드가 바뀌면 자동으로 발음"
            />
          </Row>
        </div>

        {/* --- 데이터 --- */}
        <p className="mt-5" style={{ fontFamily: F.mono, fontSize: 11, color: C.sub, letterSpacing: 1 }}>데이터</p>
        <div className="rounded-lg px-4" style={{ backgroundColor: "#fff", border: `1px solid ${C.line}` }}>
          <Row label="현재 단어장" desc={`전체 ${stats.total}개 · 정복 ${stats.mastered}개 · 오답 ${stats.wrong}개`}>
            <button
              onClick={exportJson}
              className="w-full rounded-md py-3"
              style={{ fontSize: 13, border: `1px solid ${C.navy}`, color: C.navy, fontWeight: 600 }}
            >
              JSON으로 내보내기 (클립보드 복사)
            </button>
            {copied && <p className="mt-2" style={{ fontSize: 12, color: C.green }}>{copied}</p>}
          </Row>

          <Row label="기본 단어 불러오기" desc="샘플 단어 25개를 단어장에 추가합니다">
            <button
              onClick={onRestoreSeed}
              className="w-full rounded-md py-3"
              style={{ fontSize: 13, border: `1px solid ${C.line}`, color: C.ink }}
            >
              기본 단어 추가
            </button>
          </Row>

          <Row label="학습 기록만 초기화" desc="단어는 그대로 두고 알아요·몰라요 기록만 지웁니다">
            {confirmReset ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 rounded-md py-3"
                  style={{ fontSize: 13, border: `1px solid ${C.line}`, color: C.sub }}
                >
                  취소
                </button>
                <button
                  onClick={() => { onResetProgress(); setConfirmReset(false); }}
                  className="flex-1 rounded-md py-3"
                  style={{ fontSize: 13, backgroundColor: C.orange, color: "#fff", fontWeight: 700 }}
                >
                  초기화합니다
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full rounded-md py-3"
                style={{ fontSize: 13, border: `1px solid ${C.orange}`, color: C.orange, fontWeight: 600 }}
              >
                기록 초기화
              </button>
            )}
          </Row>

          <Row
            label="단어장 전체 삭제"
            desc="사전 탭의 목록을 포함해 모든 단어가 사라집니다. 되돌릴 수 없습니다."
          >
            {confirmClear ? (
              <>
                <p className="mb-2" style={{ fontSize: 13, color: C.danger, fontWeight: 600 }}>
                  {stats.total}개 단어와 모든 기록이 삭제됩니다. 계속할까요?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="flex-1 rounded-md py-3"
                    style={{ fontSize: 13, border: `1px solid ${C.line}`, color: C.sub }}
                  >
                    취소
                  </button>
                  <button
                    onClick={() => { onClearAll(); setConfirmClear(false); onClose(); }}
                    className="flex-1 rounded-md py-3"
                    style={{ fontSize: 13, backgroundColor: C.danger, color: "#fff", fontWeight: 700 }}
                  >
                    전부 삭제합니다
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                disabled={stats.total === 0}
                className="w-full rounded-md py-3"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: stats.total ? "#fff" : "#B9BCC6",
                  backgroundColor: stats.total ? C.danger : "transparent",
                  border: `1px solid ${stats.total ? C.danger : C.line}`,
                }}
              >
                🗑 전체 삭제
              </button>
            )}
          </Row>
        </div>

        <p className="mt-4 text-center" style={{ fontSize: 11, color: C.sub }}>
          설정과 단어장은 기기에 자동 저장됩니다
        </p>
      </div>
    </div>
  );
}

/* ================= 단어카드 ================= */
function CardView({ word, stats, config, canUndo, lastAction, onMark, onUndo, onDelete, onGoDict, onOpenSettings }) {
  const [writing, setWriting] = useState(false);
  const [typed, setTyped] = useState("");
  const [revealed, setRevealed] = useState(!config.hideMeaning);

  useEffect(() => {
    setTyped("");
    setWriting(false);
    setRevealed(!config.hideMeaning);
    if (word && config.autoSpeak) speak(word.kanji, config.speechRate);
  }, [word?.id, config.hideMeaning, config.autoSpeak, config.speechRate]);

  if (!word) {
    return (
      <div className="rounded-xl px-6 py-14 text-center" style={{ backgroundColor: "#fff", border: `1px dashed ${C.line}` }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>단어장이 비어 있습니다</p>
        <p className="mt-2" style={{ fontSize: 13, color: C.sub }}>
          등록 탭에서 단어를 추가하거나, 설정에서 기본 단어를 불러올 수 있습니다.
        </p>
        <button
          onClick={onOpenSettings}
          className="mt-4 rounded-md px-5 py-3"
          style={{ fontSize: 13, backgroundColor: C.navy, color: "#fff", fontWeight: 600 }}
        >
          설정 열기
        </button>
      </div>
    );
  }

  const typedOk = typed.trim() === word.kana;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span style={{ fontSize: 12, color: C.sub }}>
          미학습 {stats.unseen} · 잘 아는 단어 {stats.mastered} / 전체 {stats.total}개
        </span>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="rounded-md px-3 py-2"
          style={{
            fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
            color: canUndo ? C.navy : "#B9BCC6",
            backgroundColor: "#fff",
            border: `1px solid ${canUndo ? C.navy : C.line}`,
          }}
        >
          ↩ 이전 단어
        </button>
      </div>

      {canUndo && lastAction && (
        <p style={{ fontSize: 11, color: C.sub }}>
          방금 「{lastAction.action === "known" ? "알아요" : "몰라요"}」로 넘긴 단어가 있습니다. 되돌리면 기록도 함께 취소됩니다.
        </p>
      )}

      <div
        className="rounded-xl px-5 py-7"
        style={{ backgroundColor: C.card, border: `1px solid ${C.line}`, animation: "pop 200ms ease both" }}
      >
        <div className="flex items-start justify-between">
          <span style={{ color: C.red, fontSize: 14, letterSpacing: 2 }}>
            {"★".repeat(word.lv + 2)}{"☆".repeat(3 - word.lv)}
          </span>
          <button
            onClick={() => speak(word.kanji, config.speechRate)}
            className="flex items-center justify-center rounded-full"
            style={{ width: 44, height: 44, backgroundColor: C.navy, color: "#fff", fontSize: 18 }}
            aria-label="단어 발음 듣기"
          >
            🔊
          </button>
        </div>

        <p className="mt-2 text-center" style={{ fontFamily: F.jp, fontSize: 44, color: C.ink }}>
          {word.kanji}
        </p>

        {revealed ? (
          <>
            <p className="mt-3 text-center" style={{ fontFamily: F.jp, fontSize: 26, color: C.red }}>{word.kana}</p>
            <p className="mt-3 text-center" style={{ fontSize: 20, fontWeight: 600, color: C.ink }}>{word.ko}</p>
            <button onClick={onGoDict} className="mt-3 w-full text-center" style={{ fontSize: 12, color: C.sub }}>
              💡 사전 탭에서 전체 목록을 볼 수 있어요
            </button>
            <div className="mt-5 flex flex-col items-center gap-2 pt-4" style={{ borderTop: `1px dashed ${C.line}` }}>
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: F.jp, fontSize: 19, color: C.ink }}>{word.ex}</span>
                <button
                  onClick={() => speak(word.ex, config.speechRate)}
                  className="rounded-lg px-3 py-1"
                  style={{ fontSize: 12, border: `1px solid ${C.line}`, color: C.sub, whiteSpace: "nowrap" }}
                >
                  🔊 예문
                </button>
              </div>
              <p style={{ fontSize: 13, color: C.sub }}>{word.exKo}</p>
            </div>
          </>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="mt-6 w-full rounded-lg py-5"
            style={{ fontSize: 14, color: C.sub, border: `1px dashed ${C.line}` }}
          >
            탭하면 뜻과 예문이 보입니다
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onMark("unknown")}
          className="flex-1 rounded-lg py-4"
          style={{ backgroundColor: C.orange, color: "#fff", fontSize: 17, fontWeight: 700 }}
        >
          ❌ 몰라요
        </button>
        <button
          onClick={() => onMark("known")}
          className="flex-1 rounded-lg py-4"
          style={{ backgroundColor: C.green, color: "#fff", fontSize: 17, fontWeight: 700 }}
        >
          ✅ 알아요
        </button>
      </div>

      <p className="text-center" style={{ fontSize: 12, color: C.sub }}>
        ✅를 누를수록 덜 나오고, ❌를 누르면 자주 나옵니다 (기록 자동 저장)
      </p>

      <button
        onClick={() => setWriting((v) => !v)}
        className="mx-auto rounded-lg px-5 py-3"
        style={{ border: `1px solid ${C.navy}`, color: C.navy, fontSize: 14, fontWeight: 600 }}
      >
        ✍️ 쓰면서 외우기 {writing ? "닫기" : "열기"}
      </button>

      {writing && (
        <div className="rounded-lg px-4 py-4" style={{ backgroundColor: "#fff", border: `1px solid ${C.line}` }}>
          <p style={{ fontSize: 13, color: C.sub }}>읽는 법을 히라가나로 입력해 보세요</p>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="ひらがな"
            className="mt-2 w-full rounded-md px-3 py-3"
            style={{ fontFamily: F.jp, fontSize: 18, border: `1px solid ${typed && typedOk ? C.green : C.line}` }}
          />
          {typed && (
            <p className="mt-2" style={{ fontSize: 13, color: typedOk ? C.green : C.sub }}>
              {typedOk ? "정확합니다" : "계속 입력해 보세요"}
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => onDelete(word.id)}
        className="mx-auto rounded-lg px-4 py-3"
        style={{ fontSize: 13, color: C.sub, border: `1px solid ${C.line}`, backgroundColor: "#fff" }}
      >
        🗑 이 단어는 너무 쉬움 — 단어장에서 삭제
      </button>
    </div>
  );
}

/* ================= 오답노트 ================= */
function WrongNote({ words, onPick }) {
  const list = useMemo(
    () => words.filter((w) => w.wrongCount > 0).sort((a, b) => b.wrongCount - a.wrongCount),
    [words]
  );
  if (!list.length) return <Empty title="오답이 없습니다" body="단어카드에서 ❌를 누른 단어가 여기에 모입니다." />;

  return (
    <div className="flex flex-col gap-2">
      <p style={{ fontSize: 12, color: C.sub }}>틀린 횟수가 많은 순 · {list.length}개</p>
      {list.map((w) => (
        <button
          key={w.id}
          onClick={() => onPick(w.id)}
          className="flex items-center justify-between rounded-lg px-4 py-3 text-left"
          style={{ backgroundColor: "#fff", border: `1px solid ${C.line}` }}
        >
          <div>
            <p style={{ fontFamily: F.jp, fontSize: 20, color: C.ink }}>{w.kanji}</p>
            <p style={{ fontFamily: F.jp, fontSize: 13, color: C.red }}>{w.kana}</p>
          </div>
          <div className="text-right">
            <p style={{ fontSize: 14, color: C.ink }}>{w.ko}</p>
            <p style={{ fontFamily: F.mono, fontSize: 11, color: C.sub }}>✗{w.wrongCount} ✓{w.knownCount}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ================= 단어퀴즈 ================= */
function QuizView({ pool, all, onMark }) {
  const [q, setQ] = useState(null);
  const [picked, setPicked] = useState(null);

  const roll = useCallback(() => {
    if (pool.length < 4) return setQ(null);
    const answer = pickWeighted(pool, null);
    const wrong = all.filter((w) => w.id !== answer.id).sort(() => Math.random() - 0.5).slice(0, 3);
    setQ({ answer, choices: [answer, ...wrong].sort(() => Math.random() - 0.5) });
    setPicked(null);
  }, [pool, all]);

  useEffect(() => { roll(); }, [roll]);

  if (pool.length < 4) return <Empty title="단어가 부족합니다" body="퀴즈에는 4개 이상의 단어가 필요합니다." />;
  if (!q) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl py-8 text-center" style={{ backgroundColor: "#fff", border: `1px solid ${C.line}` }}>
        <p style={{ fontFamily: F.jp, fontSize: 38, color: C.ink }}>{q.answer.kanji}</p>
        {picked && <p className="mt-2" style={{ fontFamily: F.jp, fontSize: 18, color: C.red }}>{q.answer.kana}</p>}
      </div>

      {q.choices.map((c) => {
        const isAns = c.id === q.answer.id;
        const isPick = picked?.id === c.id;
        return (
          <button
            key={c.id}
            onClick={() => { if (!picked) { setPicked(c); onMark(isAns ? "known" : "unknown"); } }}
            className="rounded-lg px-4 py-4 text-left"
            style={{
              backgroundColor: "#fff", fontSize: 15,
              border: `1px solid ${picked && isAns ? C.green : picked && isPick ? C.orange : C.line}`,
              color: picked && isAns ? C.green : C.ink,
            }}
          >
            {c.ko}
          </button>
        );
      })}

      {picked && (
        <button onClick={roll} className="rounded-lg py-4" style={{ backgroundColor: C.navy, color: "#fff", fontWeight: 700 }}>
          다음 문제
        </button>
      )}
    </div>
  );
}

/* ================= 사전 ================= */

/**
 * 외부 사전
 *
 * 획순·유의어·더 많은 용례는 우리가 가진 데이터로 만들 수 없습니다.
 * 탭을 따로 두는 대신 상세 시트에서 필요할 때만 넘깁니다.
 */
const DICT_LINKS = [
  { label: "네이버 일본어사전", hint: "한국어 뜻 · 예문", url: (w) => `https://ja.dict.naver.com/#/search?query=${encodeURIComponent(w)}` },
  { label: "Weblio 国語辞典", hint: "일본어 원문 뜻풀이", url: (w) => `https://www.weblio.jp/content/${encodeURIComponent(w)}` },
];


/**
 * 단어 상세 시트
 *
 * 단어카드와 같은 배치(별점 · 한자 · 요미가나 · 뜻 · 예문)를 쓰되,
 * 학습 흐름을 건드리지 않도록 사전 안에서 열고 닫습니다.
 * 여기에는 카드에 없는 품사와 학습 기록도 함께 보여줍니다.
 */
function WordSheet({ word, rate, onStudy, onDelete, onClose }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ backgroundColor: "rgba(20,24,40,.45)", zIndex: 60 }}
      onClick={onClose}
    >
      <div className="flex-1" />
      <div
        className="rounded-t-2xl px-5 pb-8 pt-4"
        style={{ backgroundColor: C.bg, maxHeight: "88vh", overflowY: "auto", animation: "pop 200ms ease both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 style={{ fontSize: 19, fontWeight: 700, color: C.ink }}>단어 상세</h2>
          <button onClick={onClose} style={{ fontSize: 14, color: C.sub }}>닫기</button>
        </div>

        <div className="rounded-xl px-5 py-7" style={{ backgroundColor: C.card, border: `1px solid ${C.line}` }}>
          <div className="flex items-start justify-between">
            <span style={{ color: C.red, fontSize: 14, letterSpacing: 2 }}>
              {"★".repeat(word.lv + 2)}{"☆".repeat(3 - word.lv)}
            </span>
            <button
              onClick={() => speak(word.kanji, rate)}
              className="flex items-center justify-center rounded-full"
              style={{ width: 44, height: 44, backgroundColor: C.navy, color: "#fff", fontSize: 18 }}
              aria-label="단어 발음 듣기"
            >
              🔊
            </button>
          </div>

          <p className="mt-2 text-center" style={{ fontFamily: F.jp, fontSize: 44, color: C.ink }}>
            {word.kanji}
          </p>

          {word.kana && (
            <p className="mt-3 text-center" style={{ fontFamily: F.jp, fontSize: 26, color: C.red }}>{word.kana}</p>
          )}
          {word.ko && (
            <p className="mt-3 text-center" style={{ fontSize: 20, fontWeight: 600, color: C.ink }}>{word.ko}</p>
          )}

          {(word.pos || word.mastered) && (
            <div className="mt-3 flex items-center justify-center gap-2">
              {word.pos && (
                <span className="rounded-full px-3 py-1" style={{ fontSize: 12, color: C.sub, border: `1px solid ${C.line}` }}>
                  {word.pos}
                </span>
              )}
              {word.mastered && (
                <span className="rounded-full px-3 py-1" style={{ fontSize: 12, color: "#fff", backgroundColor: C.green }}>
                  정복
                </span>
              )}
            </div>
          )}

          {word.ex ? (
            <div className="mt-5 flex flex-col items-center gap-2 pt-4" style={{ borderTop: `1px dashed ${C.line}` }}>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span style={{ fontFamily: F.jp, fontSize: 19, color: C.ink }}>{word.ex}</span>
                <button
                  onClick={() => speak(word.ex, rate)}
                  className="rounded-lg px-3 py-1"
                  style={{ fontSize: 12, border: `1px solid ${C.line}`, color: C.sub, whiteSpace: "nowrap" }}
                >
                  🔊 예문
                </button>
              </div>
              {word.exKo && <p style={{ fontSize: 13, color: C.sub }}>{word.exKo}</p>}
            </div>
          ) : (
            <p className="mt-5 pt-4 text-center" style={{ fontSize: 13, color: C.sub, borderTop: `1px dashed ${C.line}` }}>
              등록된 예문이 없습니다
            </p>
          )}
        </div>

        <p className="mt-4" style={{ fontFamily: F.mono, fontSize: 11, color: C.sub, letterSpacing: 1 }}>학습 기록</p>
        <div className="mt-1 flex gap-2">
          <Stat label="본 횟수" value={word.seenCount ?? 0} color={C.ink} />
          <Stat label="알아요" value={word.knownCount ?? 0} color={C.green} />
          <Stat label="몰라요" value={word.wrongCount ?? 0} color={C.orange} />
        </div>
        <p className="mt-2" style={{ fontSize: 11, color: C.sub }}>
          등록일 {new Date(word.addedAt).toLocaleDateString("ko-KR")}
        </p>

        <button
          onClick={() => { onStudy(word.id); onClose(); }}
          className="mt-4 w-full rounded-lg py-3"
          style={{ backgroundColor: C.navy, color: "#fff", fontSize: 15, fontWeight: 600 }}
        >
          🀄 이 단어부터 공부하기
        </button>

        <p className="mt-4" style={{ fontFamily: F.mono, fontSize: 11, color: C.sub, letterSpacing: 1 }}>더 찾아보기</p>
        <div className="mt-1 flex flex-col gap-2">
          {DICT_LINKS.map((d) => (
            <a
              key={d.label}
              href={d.url(word.kanji)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg px-4 py-3"
              style={{ backgroundColor: "#fff", border: `1px solid ${C.line}` }}
            >
              <span>
                <span style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>{d.label}</span>
                <span className="ml-2" style={{ fontSize: 11, color: C.sub }}>{d.hint}</span>
              </span>
              <span style={{ fontSize: 13, color: C.sub }}>↗</span>
            </a>
          ))}
        </div>

        {confirmDelete ? (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 rounded-md py-3"
              style={{ fontSize: 13, color: C.sub, backgroundColor: "#fff", border: `1px solid ${C.line}` }}
            >
              취소
            </button>
            <button
              onClick={() => { onDelete(word.id); onClose(); }}
              className="flex-1 rounded-md py-3"
              style={{ fontSize: 13, fontWeight: 600, color: "#fff", backgroundColor: C.danger }}
            >
              정말 삭제합니다
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="mt-4 w-full rounded-md py-3"
            style={{ fontSize: 13, color: C.sub, backgroundColor: "#fff", border: `1px solid ${C.line}` }}
          >
            🗑 단어장에서 삭제
          </button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="flex-1 rounded-lg px-3 py-3 text-center" style={{ backgroundColor: "#fff", border: `1px solid ${C.line}` }}>
      <p style={{ fontFamily: F.mono, fontSize: 20, fontWeight: 600, color }}>{value}</p>
      <p className="mt-1" style={{ fontSize: 11, color: C.sub }}>{label}</p>
    </div>
  );
}

function DictView({ words, rate, onStudy, onDelete, onOpenSettings }) {
  const [q, setQ] = useState("");
  // 목록이 바뀌어도 따라가도록 단어 자체가 아니라 id 를 들고 있습니다
  const [openId, setOpenId] = useState(null);
  const list = useMemo(() => {
    const k = q.trim();
    const base = [...words].sort((a, b) => b.addedAt - a.addedAt);
    if (!k) return base;
    return base.filter((w) => w.kanji.includes(k) || w.kana.includes(k) || w.ko.includes(k));
  }, [words, q]);

  // 삭제 등으로 사라진 단어면 시트를 열지 않습니다
  const openWord = openId ? words.find((w) => w.id === openId) : null;

  return (
    <div className="flex flex-col gap-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="한자 · 요미가나 · 뜻으로 검색"
        className="w-full rounded-lg px-4 py-3"
        style={{ fontSize: 15, border: `1px solid ${C.line}`, backgroundColor: "#fff" }}
      />

      <div className="flex items-center justify-between">
        <span style={{ fontSize: 12, color: C.sub }}>내가 기록한 단어 {list.length}개</span>
        <button onClick={onOpenSettings} style={{ fontSize: 12, color: C.danger, fontWeight: 600 }}>
          설정에서 전체 삭제
        </button>
      </div>

      {list.length === 0 && <Empty title="목록이 비어 있습니다" body="등록 탭에서 단어를 추가해 주세요." />}

      {list.map((w) => (
        <div
          key={w.id}
          role="button"
          tabIndex={0}
          onClick={() => setOpenId(w.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpenId(w.id);
            }
          }}
          className="rounded-lg px-4 py-3"
          style={{ backgroundColor: "#fff", border: `1px solid ${C.line}`, cursor: "pointer" }}
        >
          <div className="flex items-baseline justify-between">
            <span style={{ fontFamily: F.jp, fontSize: 19, color: C.ink }}>{w.kanji}</span>
            <span style={{ fontSize: 14, color: C.ink }}>{w.ko}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span style={{ fontFamily: F.jp, fontSize: 13, color: C.red }}>{w.kana}</span>
            <div className="flex items-center gap-3">
              {w.mastered && <span style={{ fontSize: 11, color: C.green }}>정복</span>}
              {/* 행 클릭과 겹치지 않도록 버블링을 막습니다 */}
              <button
                onClick={(e) => { e.stopPropagation(); speak(w.kanji, rate); }}
                style={{ fontSize: 14 }}
                aria-label="발음 듣기"
              >
                🔊
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(w.id); }}
                style={{ fontSize: 12, color: C.sub }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      ))}

      {openWord && (
        <WordSheet
          word={openWord}
          rate={rate}
          onStudy={onStudy}
          onDelete={onDelete}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

/* ================= 등록 ================= */
function AddView({ onAdd, existing }) {
  const [mode, setMode] = useState("photo");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [draft, setDraft] = useState({ kanji: "", kana: "", ko: "", ex: "", exKo: "" });
  const [paste, setPaste] = useState("");
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  // 검토 대기 목록 — null이면 평소 화면, 배열이면 검토 화면
  const [candidates, setCandidates] = useState(null);
  const [origin, setOrigin] = useState("");
  const [editingKey, setEditingKey] = useState(null);

  const existingKanji = useMemo(() => new Set(existing.map((w) => w.kanji)), [existing]);

  // 추출 결과를 검토용 후보로 변환 — 이미 있는 단어는 기본 해제
  const toCandidates = (items) =>
    (Array.isArray(items) ? items : [])
      .filter((it) => it && it.kanji)
      .map((it, i) => {
        const dup = existingKanji.has(it.kanji);
        return { ...it, _key: `c${i}_${it.kanji}`, _dup: dup, _sel: !dup };
      });

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMsg("사진에서 단어를 읽는 중…");
    try {
      const b64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const items = await extractWords({
        image: { mediaType: file.type, data: b64 },
      });
      if (!items.length) {
        setMsg("사진에서 단어를 찾지 못했습니다. 글자가 잘 보이는 사진으로 다시 시도해 주세요.");
      } else {
        setCandidates(toCandidates(items));
        setOrigin("사진");
        setMsg("");
      }
    } catch {
      setMsg("사진에서 단어를 읽지 못했습니다. 글자가 잘 보이는 사진으로 다시 시도해 주세요.");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  // 클립보드가 막힌 환경(구형 iOS, http)에서는 본문을 펼쳐 직접 고르게 합니다
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(CLAUDE_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShowPrompt(true);
    }
  };

  const handlePaste = async () => {
    if (!paste.trim()) return;

    // 이미 JSON 형식이면 서버를 거치지 않고 바로 검토 화면으로 갑니다
    try {
      const items = normalizeImport(paste);
      if (items.length) {
        setCandidates(toCandidates(items));
        setOrigin("가져온 파일");
        setMsg("");
        return;
      }
    } catch {
      // JSON이 아니면 아래 대화 분석으로 넘어갑니다
    }

    setBusy(true);
    setMsg("대화 내용에서 단어를 찾는 중…");
    try {
      const items = await extractWords({ text: paste });
      if (!items.length) {
        setMsg("단어를 찾지 못했습니다. 내용을 다시 확인해 주세요.");
      } else {
        setCandidates(toCandidates(items));
        setOrigin("대화 내용");
        setMsg("");
      }
    } catch {
      setMsg("단어를 찾지 못했습니다. 내용을 다시 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const handleManual = () => {
    if (!draft.kanji.trim()) return setMsg("한자 또는 단어를 입력해 주세요.");
    onAdd([{ ...draft, pos: "", lv: 2 }]);
    setDraft({ kanji: "", kana: "", ko: "", ex: "", exKo: "" });
    setMsg("1개를 추가했습니다");
  };

  /* ---- 검토 화면 ---- */
  if (candidates) {
    const selected = candidates.filter((c) => c._sel);
    const allOn = selected.length === candidates.length;

    const toggle = (key) =>
      setCandidates((cs) => cs.map((c) => (c._key === key ? { ...c, _sel: !c._sel } : c)));
    const toggleAll = () => setCandidates((cs) => cs.map((c) => ({ ...c, _sel: !allOn })));

    // 값을 고치면 중복 여부를 다시 계산하고, 손댄 항목은 자동으로 선택합니다
    const edit = (key, field, value) =>
      setCandidates((cs) =>
        cs.map((c) => {
          if (c._key !== key) return c;
          const next = { ...c, [field]: value, _sel: true, _edited: true };
          if (field === "kanji") next._dup = existingKanji.has(value.trim());
          return next;
        })
      );

    const confirm = () => {
      const clean = selected
        .map(({ _key, _dup, _sel, _edited, ...rest }) => rest)
        .filter((w) => w.kanji.trim());
      const n = onAdd(clean);
      setCandidates(null);
      setEditingKey(null);
      setPaste("");
      setMsg(`${n}개를 단어장에 추가했습니다`);
    };

    const FIELDS = [
      ["kanji", "한자 / 단어"],
      ["kana", "요미가나"],
      ["ko", "한국어 뜻"],
      ["ex", "예문"],
      ["exKo", "예문 번역"],
    ];

    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-lg px-4 py-4" style={{ backgroundColor: "#fff", border: `1px solid ${C.line}` }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>
            {origin}에서 단어 {candidates.length}개를 찾았습니다
          </p>
          <p className="mt-1" style={{ fontSize: 12, color: C.sub }}>
            등록할 단어만 남기고 체크를 해제하세요. 뜻이 어색하면 ✏️로 고칠 수 있습니다.
          </p>
          <button
            onClick={toggleAll}
            className="mt-3 w-full rounded-md py-2"
            style={{ fontSize: 13, border: `1px solid ${C.navy}`, color: C.navy, fontWeight: 600 }}
          >
            {allOn ? "전체 선택 해제" : "전체 선택"}
          </button>
        </div>

        {candidates.map((c) => {
          const open = editingKey === c._key;
          return (
            <div
              key={c._key}
              className="rounded-lg"
              style={{
                backgroundColor: "#fff",
                border: `1px solid ${open ? C.navy : c._sel ? C.navy : C.line}`,
                opacity: c._sel ? 1 : 0.55,
              }}
            >
              <div className="flex items-start gap-3 px-4 py-3">
                <button
                  onClick={() => toggle(c._key)}
                  className="flex flex-shrink-0 items-center justify-center rounded"
                  style={{
                    width: 22, height: 22, marginTop: 3, fontSize: 14, color: "#fff",
                    backgroundColor: c._sel ? C.green : "transparent",
                    border: `1px solid ${c._sel ? C.green : "#BFC2CB"}`,
                  }}
                  aria-label={c._sel ? "등록 해제" : "등록 선택"}
                >
                  {c._sel ? "✓" : ""}
                </button>

                <button onClick={() => toggle(c._key)} className="flex-1 text-left">
                  <span className="flex flex-wrap items-baseline gap-2">
                    <span style={{ fontFamily: F.jp, fontSize: 21, color: C.ink }}>
                      {c.kanji || "(단어 없음)"}
                    </span>
                    <span style={{ fontFamily: F.jp, fontSize: 13, color: C.red }}>{c.kana}</span>
                    {c._dup && (
                      <span className="rounded px-2" style={{ fontSize: 10, color: C.orange, border: `1px solid ${C.orange}` }}>
                        이미 있음
                      </span>
                    )}
                    {c._edited && (
                      <span className="rounded px-2" style={{ fontSize: 10, color: C.green, border: `1px solid ${C.green}` }}>
                        수정함
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block" style={{ fontSize: 14, color: C.ink }}>{c.ko}</span>
                  {c.ex && (
                    <span className="mt-1 block" style={{ fontFamily: F.jp, fontSize: 12, color: C.sub }}>
                      {c.ex}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setEditingKey(open ? null : c._key)}
                  className="flex-shrink-0 rounded-md px-2 py-1"
                  style={{
                    fontSize: 13,
                    color: open ? "#fff" : C.sub,
                    backgroundColor: open ? C.navy : "transparent",
                    border: `1px solid ${open ? C.navy : C.line}`,
                  }}
                  aria-label="이 단어 수정"
                >
                  ✏️
                </button>
              </div>

              {open && (
                <div className="px-4 pb-4" style={{ borderTop: `1px dashed ${C.line}` }}>
                  {FIELDS.map(([k, label]) => (
                    <div key={k} className="mt-3">
                      <label style={{ fontSize: 11, color: C.sub }}>{label}</label>
                      <input
                        value={c[k] || ""}
                        onChange={(e) => edit(c._key, k, e.target.value)}
                        className="mt-1 w-full rounded-md px-3 py-2"
                        style={{
                          fontSize: 15,
                          fontFamily: k === "kanji" || k === "kana" || k === "ex" ? F.jp : F.ui,
                          border: `1px solid ${C.line}`,
                        }}
                      />
                    </div>
                  ))}

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => speak(c.kanji, 0.9)}
                      className="rounded-md px-3 py-2"
                      style={{ fontSize: 12, border: `1px solid ${C.line}`, color: C.sub }}
                    >
                      🔊 읽어보기
                    </button>
                    <button
                      onClick={() => setEditingKey(null)}
                      className="flex-1 rounded-md py-2"
                      style={{ fontSize: 13, backgroundColor: C.navy, color: "#fff", fontWeight: 600 }}
                    >
                      수정 완료
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => { setCandidates(null); setEditingKey(null); setMsg("등록을 취소했습니다"); }}
            className="flex-1 rounded-lg py-4"
            style={{ fontSize: 15, border: `1px solid ${C.line}`, color: C.sub, backgroundColor: "#fff" }}
          >
            등록 안 함
          </button>
          <button
            onClick={confirm}
            disabled={!selected.length}
            className="flex-1 rounded-lg py-4"
            style={{
              fontSize: 15, fontWeight: 700,
              color: selected.length ? "#fff" : "#B9BCC6",
              backgroundColor: selected.length ? C.green : "transparent",
              border: `1px solid ${selected.length ? C.green : C.line}`,
            }}
          >
            {selected.length}개 등록
          </button>
        </div>
      </div>
    );
  }

  /* ---- 평소 화면 ---- */
  const MODES = [
    { id: "photo", label: "📷 사진" },
    { id: "manual", label: "✏️ 직접 입력" },
    { id: "claude", label: "💬 Claude 기록" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {MODES.map((m) => {
          const on = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setMsg(""); }}
              className="flex-1 rounded-md py-2"
              style={{
                fontSize: 13,
                backgroundColor: on ? C.navy : "transparent",
                color: on ? "#fff" : C.sub,
                border: `1px solid ${on ? C.navy : C.line}`,
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-lg px-4 py-5" style={{ backgroundColor: "#fff", border: `1px solid ${C.line}` }}>
        {mode === "photo" && (
          <>
            <p style={{ fontSize: 14, color: C.ink }}>교재나 문제지를 찍으면 단어를 뽑아 담습니다</p>
            <p className="mt-1" style={{ fontSize: 12, color: C.sub }}>
              읽은 단어를 목록으로 보여드리고, 고른 것만 등록합니다
            </p>
            <label
              className="mt-4 flex cursor-pointer items-center justify-center rounded-lg py-4"
              style={{ backgroundColor: C.navy, color: "#fff", fontSize: 15, fontWeight: 600 }}
            >
              사진 선택 / 촬영
              <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
            </label>
          </>
        )}

        {mode === "manual" && (
          <div className="flex flex-col gap-2">
            {[["kanji", "한자 / 단어 (필수)"], ["kana", "요미가나"], ["ko", "한국어 뜻"], ["ex", "예문"], ["exKo", "예문 번역"]].map(([k, ph]) => (
              <input
                key={k}
                value={draft[k]}
                onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                placeholder={ph}
                className="w-full rounded-md px-3 py-3"
                style={{ fontSize: 15, border: `1px solid ${C.line}` }}
              />
            ))}
            <button onClick={handleManual} className="mt-1 rounded-lg py-3" style={{ backgroundColor: C.navy, color: "#fff", fontWeight: 600 }}>
              단어장에 추가
            </button>
          </div>
        )}

        {mode === "claude" && (
          <>
            <p style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>
              Claude가 기억하는 내 일본어 단어 가져오기
            </p>
            <ol className="mt-2 flex flex-col gap-1" style={{ fontSize: 12, color: C.sub }}>
              <li>1. 아래 버튼으로 프롬프트를 복사합니다</li>
              <li>2. Claude에 붙여넣고 JSON 답변을 받습니다</li>
              <li>3. 받은 JSON을 아래 칸에 붙여넣습니다</li>
            </ol>

            <button
              onClick={handleCopyPrompt}
              className="mt-3 w-full rounded-lg py-3"
              style={{
                backgroundColor: copied ? C.green : "#fff",
                color: copied ? "#fff" : C.navy,
                border: `1px solid ${copied ? C.green : C.navy}`,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {copied ? "\u2705 복사했습니다" : "\ud83d\udccb 프롬프트 복사하기"}
            </button>

            {showPrompt && (
              <>
                <p className="mt-2" style={{ fontSize: 12, color: C.orange }}>
                  자동 복사가 막힌 환경입니다. 아래 내용을 길게 눌러 직접 복사하세요.
                </p>
                <textarea
                  readOnly
                  value={CLAUDE_PROMPT}
                  rows={8}
                  onFocus={(e) => e.target.select()}
                  className="mt-1 w-full rounded-md px-3 py-3"
                  style={{ fontSize: 12, fontFamily: F.mono, border: `1px solid ${C.line}` }}
                />
              </>
            )}

            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              rows={6}
              placeholder="받은 JSON 붙여넣기 (일본어 대화 내용을 그대로 넣어도 됩니다)"
              className="mt-3 w-full rounded-md px-3 py-3"
              style={{ fontSize: 14, border: `1px solid ${C.line}` }}
            />
            <button onClick={handlePaste} className="mt-2 w-full rounded-lg py-3" style={{ backgroundColor: C.navy, color: "#fff", fontWeight: 600 }}>
              단어 뽑아내기
            </button>
            <p className="mt-2" style={{ fontSize: 12, color: C.sub }}>
              찾은 단어를 목록으로 보여드리고, 고른 것만 등록합니다
            </p>
          </>
        )}

        {(busy || msg) && (
          <p className="mt-3" style={{ fontSize: 13, color: busy ? C.sub : C.green }}>
            {busy ? "처리 중…" : msg}
          </p>
        )}
      </div>
    </div>
  );
}

function Empty({ title, body }) {
  return (
    <div className="rounded-xl px-6 py-14 text-center" style={{ backgroundColor: "#fff", border: `1px dashed ${C.line}` }}>
      <p style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{title}</p>
      <p className="mt-2" style={{ fontSize: 13, color: C.sub }}>{body}</p>
    </div>
  );
}
