/**
 * Vercel 서버리스 함수 — Claude API 중계
 *
 * 브라우저는 이 함수만 호출합니다. API 키는 서버(Vercel 환경변수)에만
 * 있으므로 사용자에게 노출되지 않습니다.
 *
 * 환경변수: ANTHROPIC_API_KEY
 */

const PROMPT = `일본어 단어를 추출해 JSON 배열로만 답하세요. 마크다운이나 설명 없이 JSON만 출력합니다.
형식: [{"kanji":"","kana":"","ko":"","pos":"","lv":1,"ex":"","exKo":""}]
lv은 1(기초)~3(고급). ex는 짧은 일본어 예문, exKo는 그 한국어 번역.
ko와 exKo는 한국어로 씁니다.
찾은 단어가 없으면 빈 배열 []을 출력하고, 단어를 지어내지 마세요.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST만 허용됩니다" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "서버에 API 키가 설정되지 않았습니다" });
  }

  const { text, image } = req.body ?? {};
  if (!text && !image) {
    return res.status(400).json({ error: "text 또는 image가 필요합니다" });
  }

  // 이미지는 { mediaType, data } 형태의 base64로 받습니다
  const content = [];
  if (image?.data) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: image.mediaType || "image/jpeg",
        data: image.data,
      },
    });
  }
  content.push({ type: "text", text: text ? `${PROMPT}\n\n---\n${text}` : PROMPT });

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        messages: [{ role: "user", content }],
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      return res.status(upstream.status).json({ error: "Claude 호출 실패", detail });
    }

    const data = await upstream.json();
    const raw = (data.content ?? []).map((c) => c.text || "").join("");

    let words = [];
    try {
      words = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      return res.status(502).json({ error: "응답을 해석하지 못했습니다", raw });
    }

    return res.status(200).json({ words });
  } catch (err) {
    return res.status(500).json({ error: "서버 오류", detail: String(err) });
  }
}
