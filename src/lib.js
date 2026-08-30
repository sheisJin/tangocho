/**
 * 저장소 어댑터
 *
 * Claude 아티팩트 안에서는 window.storage를, 일반 브라우저에서는
 * localStorage를 씁니다. 앱 코드는 어느 쪽인지 몰라도 됩니다.
 *
 * window.storage는 없는 키를 읽으면 예외를 던지므로, localStorage 쪽도
 * 같은 동작이 되도록 맞춰두었습니다. 그래야 앱 코드의 try/catch가
 * 두 환경에서 똑같이 작동합니다.
 */
const hasArtifactStorage = () =>
  typeof window !== "undefined" && typeof window.storage?.get === "function";

export const store = {
  async get(key) {
    if (hasArtifactStorage()) return window.storage.get(key);

    const value = localStorage.getItem(key);
    if (value === null) throw new Error(`저장된 값이 없습니다: ${key}`);
    return { key, value, shared: false };
  },

  async set(key, value) {
    if (hasArtifactStorage()) return window.storage.set(key, value);

    localStorage.setItem(key, value);
    return { key, value, shared: false };
  },

  async remove(key) {
    if (hasArtifactStorage()) return window.storage.delete(key);

    localStorage.removeItem(key);
    return { key, deleted: true, shared: false };
  },
};

/**
 * 가져오기 데이터 정규화
 *
 * { words: [...] } 와 [...] 를 모두 받고, 코드블록으로 감싸인 문자열도
 * 처리합니다. kanji가 없는 항목은 버립니다.
 * 학습 기록은 파일에서 받지 않고 항상 0에서 시작합니다.
 */
export function normalizeImport(raw) {
  const parsed =
    typeof raw === "string"
      ? JSON.parse(raw.replace(/```json|```/g, "").trim())
      : raw;

  const list = Array.isArray(parsed) ? parsed : parsed?.words ?? [];

  return list
    .filter((w) => w && typeof w.kanji === "string" && w.kanji.trim())
    .map((w) => ({
      kanji: w.kanji.trim(),
      kana: typeof w.kana === "string" ? w.kana : "",
      ko: typeof w.ko === "string" ? w.ko : "",
      pos: typeof w.pos === "string" ? w.pos : "",
      lv: [1, 2, 3].includes(w.lv) ? w.lv : 2,
      ex: typeof w.ex === "string" ? w.ex : "",
      exKo: typeof w.exKo === "string" ? w.exKo : "",
    }));
}

/**
 * 단어 추출 요청
 *
 * API 키를 브라우저에 두지 않기 위해 서버리스 함수(/api/extract)를
 * 거칩니다. 키는 Vercel 환경변수에만 존재합니다.
 */
export async function extractWords({ text, image }) {
  const res = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, image }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`추출 실패 (${res.status}) ${detail}`);
  }

  const data = await res.json();
  return normalizeImport(data.words ?? []);
}
