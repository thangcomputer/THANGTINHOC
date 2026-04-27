const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const https = require('https');
const { authenticate, authorize } = require('../middleware/auth');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ═══════════════════════════════════════════════════════
// HELPER: Gọi Groq API (Llama 3.3 70B — miễn phí 100%)
// Dùng https module với timeout rõ ràng
// ═══════════════════════════════════════════════════════
function callGroqAPI(prompt) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return reject(new Error('GROQ_API_KEY not configured'));

    const bodyData = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are an expert SEO strategist and senior content writer with 10+ years of experience writing Vietnamese content.
You write like a real expert (NOT AI style). You demonstrate E-E-A-T (Experience, Expertise, Authority, Trust).
You always include real-world examples and avoid generic explanations.
You output ONLY valid JSON when asked — no markdown, no code blocks.`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 8000,
    });

    const options = {
      hostname: 'api.groq.com',
      port: 443,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(bodyData),
      },
      timeout: 90000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            return reject(new Error(`Groq: ${json.error.message}`));
          }
          const text = json.choices?.[0]?.message?.content || '';
          if (!text) return reject(new Error('Groq: empty response'));
          resolve(text);
        } catch (e) {
          reject(new Error(`Groq parse: ${e.message} | Raw: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Groq: request timeout (90s)'));
    });

    req.on('error', (e) => {
      reject(new Error(`Groq network: ${e.message}`));
    });

    req.write(bodyData);
    req.end();
  });
}

// ═══════════════════════════════════════════════════════
// HELPER: Google Custom Search (tùy chọn)
// ═══════════════════════════════════════════════════════
async function fetchGoogleSearch(query) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;
  if (!apiKey || !cx) return null;

  return new Promise((resolve) => {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=5&hl=vi&gl=vn`;
    https.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (!json.items?.length) return resolve(null);
          resolve(json.items.map(i => ({ title: i.title, snippet: i.snippet, link: i.link })));
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null)).on('timeout', function() { this.destroy(); resolve(null); });
  });
}

// ═══════════════════════════════════════════════════════
// HELPERS: Formatting
// ═══════════════════════════════════════════════════════
function formatSearchContext(results) {
  if (!results?.length) return '';
  return results.map((r, i) => `[Source ${i+1}] ${r.title}\n${r.snippet}\nURL: ${r.link}`).join('\n\n');
}

function buildReferencesHTML() {
  return '';
}

function parseAIJson(text) {
  let clean = text.trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  try { return JSON.parse(clean); } catch {}
  // Try to extract JSON object
  const m = clean.match(/\{[\s\S]*\}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch {}
  }
  throw new Error('Cannot parse JSON from AI response');
}

// ═══════════════════════════════════════════════════════
// PROFESSIONAL SEO PROMPT — Chuẩn E-E-A-T, chuẩn Google
// ═══════════════════════════════════════════════════════
function buildSEOPrompt(cleanTopic, researchData, googleContext) {
  const year = new Date().getFullYear();
  let dataContext = '';
  if (researchData) dataContext += `=== DỮ LIỆU TỪ GOOGLE SEARCH ===\n${researchData}\n\n`;
  if (googleContext) dataContext += `=== KẾT QUẢ TÌM KIẾM BỔ SUNG ===\n${googleContext}\n\n`;

  return `You are an expert SEO strategist and senior content writer with 10+ years of experience.
Your task: Create a high-quality, authoritative, human-like SEO article that can RANK on Google. Written in Vietnamese.

═══ INPUT ═══
Primary keyword: "${cleanTopic}"
Search intent: informational
Target audience: Người mới bắt đầu, nhân viên văn phòng, sinh viên Việt Nam
Content goal: Traffic + Engagement + Authority
Year: ${year}

═══ RESEARCH DATA ═══
${dataContext || `Topic: ${cleanTopic}\nWrite based on your expert knowledge about this topic.`}

═══ STRATEGY ═══
- Analyze what top Google results cover for this keyword
- Identify common headings in competitor articles
- Find content gaps and provide MORE VALUE than competitors
- Include practical tips that readers can apply immediately

═══ WRITING REQUIREMENTS ═══
- Write like a REAL Vietnamese expert (KHÔNG viết kiểu AI generic)
- Demonstrate E-E-A-T: Experience (kinh nghiệm thực tế), Expertise (chuyên môn), Authority (uy tín), Trust (đáng tin cậy)
- Include REAL examples: phím tắt cụ thể, bước thực hiện chi tiết, screenshots mô tả, tools thực tế
- TRÁNH: câu chung chung, nội dung nông cạn, lặp từ khóa không tự nhiên
- Giọng văn: chuyên nghiệp nhưng thân thiện, dễ hiểu, như đang trò chuyện với học viên

═══ SEO STRUCTURE ═══
1. Title SEO: 50-70 ký tự, CTR cao, có power word (Hướng Dẫn/Bí Quyết/Mẹo Hay/Chi Tiết...)
2. Meta Description: 120-160 ký tự, hấp dẫn, có CTA ngầm
3. URL Slug: ngắn gọn, không dấu, gách ngang
4. Full Article: 1500-2500 từ với cấu trúc:
   - Đoạn mở đầu hook (80+ từ, nhắc keyword trong 2 câu đầu)
   - Tối thiểu 5 heading H2 + H3 phụ, mỗi heading chứa keyword phụ
   - Body sections chi tiết với ví dụ thực tế
   - FAQ section: QUAN TRỌNG — dùng format sau để Google hiện Rich Snippet:
     <h2>Câu Hỏi Thường Gặp</h2>
     <h3>Câu hỏi 1?</h3>
     <p>Câu trả lời chi tiết...</p>
     <h3>Câu hỏi 2?</h3>
     <p>Câu trả lời chi tiết...</p>
     (3-5 cặp H3+P, mỗi H3 phải kết thúc bằng dấu ?)
   - Kết luận + CTA mạnh (kêu gọi đăng ký khóa học tại Thắng Tin Học, liên hệ tư vấn)

═══ SEO OPTIMIZATION ═══
- Natural keyword placement (KHÔNG keyword stuffing)
- Sử dụng semantic keyword variations
- Bullet points, numbered lists, tables khi phù hợp
- Bold (<strong>) cho key points
- Blockquote cho tips quan trọng

═══ HTML FORMAT ═══
Dùng đầy đủ: h2, h3, p, ul, ol, li, strong, em, blockquote, table (khi cần so sánh)
KHÔNG dùng: h1 (đã có title), div, span, class, style

═══ HUMAN WRITING STYLE ═══
Make the content feel like written by a real human expert, avoid AI detection patterns.
- Vary sentence length: mix short punchy sentences with longer explanatory ones
- Use personal anecdotes, opinions, and conversational transitions ("Thật ra...", "Theo kinh nghiệm của tôi...", "Nhiều người không biết rằng...")
- Avoid repetitive sentence structures and overly formal AI patterns
- Include specific numbers, dates, tool names — not vague generalizations
- Write with personality and authentic voice, as if teaching a student face-to-face

═══ OUTPUT FORMAT ═══
Return ONLY valid JSON (NO markdown, NO code blocks, NO explanation):
{"title":"Tiêu đề SEO 50-70 ký tự","excerpt":"Meta description 120-160 ký tự","content":"<h2>...</h2><p>...</p> Full HTML article 1500+ từ","focusKeyword":"từ khóa chính 2-4 từ","metaTitle":"SEO title ≤60 ký tự","metaDescription":"120-160 ký tự","tags":["tag1","tag2","tag3","tag4","tag5"],"slug":"url-slug-khong-dau","suggestions":[{"title":"Bài liên quan 1","snippet":"Mô tả ngắn"},{"title":"Bài liên quan 2","snippet":"Mô tả ngắn"},{"title":"Bài liên quan 3","snippet":"Mô tả ngắn"}]}`;
}

// ═══════════════════════════════════════════════════════
// FALLBACK: Smart template (khi tất cả AI fail)
// ═══════════════════════════════════════════════════════
function generateSmartPost(topic) {
  const slug = topic.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
    + '-' + Date.now().toString().slice(-4);
  const year = new Date().getFullYear();
  return {
    title: `${topic} - Hướng Dẫn Chi Tiết Từ A-Z (${year})`,
    slug,
    excerpt: `Hướng dẫn ${topic} đầy đủ nhất ${year}: từ cơ bản đến nâng cao, kèm ví dụ thực tế và mẹo hay.`,
    content: `<p><em>⚠️ Bài viết này được tạo bằng template tạm thời vì AI đang quá tải. Vui lòng thử tạo lại sau 1-2 phút để có bài viết chất lượng cao từ AI.</em></p>
<h2>${topic} Là Gì?</h2>
<p><strong>${topic}</strong> là chủ đề quan trọng mà bất kỳ ai làm việc trong lĩnh vực tin học đều cần nắm vững. Hãy thử tạo lại bài viết bằng AI để có nội dung chi tiết và phong phú hơn.</p>`,
    focusKeyword: topic.toLowerCase(),
    metaTitle: `${topic} - Hướng Dẫn ${year}`.substring(0, 60),
    metaDescription: `Hướng dẫn ${topic} chi tiết nhất ${year}. Từ cơ bản đến nâng cao.`.substring(0, 160),
    tags: [], suggestions: [],
  };
}

// ═══════════════════════════════════════════════════════
// POST /api/ai/generate-post
//
// Pipeline Multi-AI (tất cả miễn phí):
//   Tầng 1 — Google Custom Search API      (data bổ sung)
//   Tầng 2 — Gemini + Google Grounding      (nghiên cứu chính)
//   Tầng 3 — Groq Llama 3.3 70B → Gemini   (viết bài SEO)
//   Fallback — Smart template
// ═══════════════════════════════════════════════════════
router.post('/generate-post', authenticate, authorize('admin'), async (req, res) => {
  const { topic } = req.body;
  if (!topic || topic.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập chủ đề (ít nhất 3 ký tự)' });
  }
  const cleanTopic = topic.trim();
  const usedSources = [];
  const startTime = Date.now();

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`🚀 AI Generate: "${cleanTopic}"`);
  console.log(`${'═'.repeat(50)}`);

  // ── TẦNG 1: Google Custom Search (tùy chọn) ─────────────────────────
  let googleResults = null, googleContext = '';
  try {
    googleResults = await fetchGoogleSearch(cleanTopic);
    googleContext = formatSearchContext(googleResults);
    if (googleContext) {
      usedSources.push('google-search');
      console.log(`  ✅ [1] Google Custom Search: ${googleResults.length} results`);
    } else {
      console.log(`  ⏭️ [1] Google Custom Search: skipped (no key or no results)`);
    }
  } catch (e) {
    console.log(`  ⏭️ [1] Google Custom Search: ${e.message}`);
  }

  // ── TẦNG 2: Gemini + Google Grounding (nghiên cứu) ──────────────────
  let researchData = '';
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log(`  🔍 [2] Gemini Grounding: researching...`);
      const researchModel = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        tools: [{ googleSearch: {} }],
      });

      const researchResult = await researchModel.generateContent(
        `Tìm kiếm Google và tổng hợp thông tin THỰC TẾ, CẬP NHẬT NHẤT về: "${cleanTopic}"

Yêu cầu tổng hợp:
1. Định nghĩa/giải thích ${cleanTopic} rõ ràng
2. Kiến thức quan trọng nhất, mẹo thực chiến ${new Date().getFullYear()}
3. Các công cụ/phần mềm liên quan phổ biến
4. Xu hướng mới nhất, thay đổi gần đây
5. Số liệu, thống kê cụ thể nếu có
6. Các nguồn học tập uy tín (website, khóa học)
7. Lỗi phổ biến người mới thường gặp
8. Best practices từ chuyên gia

Trả lời bằng tiếng Việt, dạng bullet chi tiết, có dữ liệu cụ thể.`
      );
      researchData = researchResult.response.text();
      usedSources.push('gemini');
      console.log(`  ✅ [2] Gemini Grounding: ${researchData.length} chars`);
    } catch (e) {
      console.error(`  ❌ [2] Gemini Grounding failed: ${e.message}`);
    }
  } else {
    console.log(`  ⏭️ [2] Gemini: no API key`);
  }

  // Nếu không có data nào → vẫn cho AI viết từ knowledge
  if (!researchData && !googleContext) {
    researchData = `Chủ đề: "${cleanTopic}". Hãy viết dựa trên kiến thức chuyên môn sâu của bạn về lĩnh vực này.`;
    console.log(`  ℹ️ No external research — AI will use internal knowledge`);
  }

  // Build SEO prompt
  const seoPrompt = buildSEOPrompt(cleanTopic, researchData, googleContext);

  // ── TẦNG 3A: Groq Llama 3.3 70B (ưu tiên — miễn phí) ───────────────
  if (process.env.GROQ_API_KEY) {
    try {
      console.log(`  📝 [3A] Groq Llama 3.3 70B: writing SEO article...`);
      const groqText = await callGroqAPI(seoPrompt);
      const postData = parseAIJson(groqText);

      if (postData.title && postData.content) {
        usedSources.push('groq');
        if (!Array.isArray(postData.tags)) postData.tags = [];
        if (!Array.isArray(postData.suggestions)) postData.suggestions = [];
        const refs = buildReferencesHTML(googleResults, usedSources);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`  ✅ [3A] Groq: SUCCESS — ${postData.content.length} chars in ${elapsed}s`);
        console.log(`  📊 Sources: ${usedSources.join(' → ')}`);

        return res.json({
          success: true,
          source: usedSources.join('+'),
          elapsed: `${elapsed}s`,
          sourceInfo: {
            research: usedSources.filter(s => s !== 'groq'),
            writer: 'Groq Llama 3.3 70B',
            googleResultsCount: googleResults?.length || 0,
          },
          data: {
            title: postData.title,
            slug: (postData.slug || postData.title.toLowerCase()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''))
              .substring(0, 80) + '-' + Date.now().toString().slice(-4),
            excerpt: postData.excerpt || '',
            content: postData.content + refs,
            focusKeyword: postData.focusKeyword || cleanTopic,
            metaTitle: (postData.metaTitle || postData.title).substring(0, 60),
            metaDescription: (postData.metaDescription || postData.excerpt || '').substring(0, 160),
            tags: postData.tags,
            suggestions: postData.suggestions,
          }
        });
      }
    } catch (e) {
      console.error(`  ❌ [3A] Groq failed: ${e.message}`);
    }
  } else {
    console.log(`  ⏭️ [3A] Groq: no API key`);
  }

  // ── TẦNG 3B: Gemini viết bài (fallback) ─────────────────────────────
  if (process.env.GEMINI_API_KEY) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`  📝 [3B] Gemini write: attempt ${attempt}...`);
        const writeModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const writeResult = await writeModel.generateContent(seoPrompt);
        const postData = parseAIJson(writeResult.response.text());

        if (!postData.title || !postData.content) throw new Error('Missing title/content');
        if (!Array.isArray(postData.tags)) postData.tags = [];
        if (!Array.isArray(postData.suggestions)) postData.suggestions = [];
        if (!usedSources.includes('gemini')) usedSources.push('gemini');
        const refs = buildReferencesHTML(googleResults, usedSources);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`  ✅ [3B] Gemini write: SUCCESS — ${postData.content.length} chars in ${elapsed}s`);

        return res.json({
          success: true,
          source: usedSources.join('+'),
          elapsed: `${elapsed}s`,
          sourceInfo: {
            research: usedSources,
            writer: 'Gemini 2.0 Flash',
            googleResultsCount: googleResults?.length || 0,
          },
          data: {
            title: postData.title,
            slug: (postData.slug || postData.title.toLowerCase()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''))
              .substring(0, 80) + '-' + Date.now().toString().slice(-4),
            excerpt: postData.excerpt || '',
            content: postData.content + refs,
            focusKeyword: postData.focusKeyword || cleanTopic,
            metaTitle: (postData.metaTitle || postData.title).substring(0, 60),
            metaDescription: (postData.metaDescription || postData.excerpt || '').substring(0, 160),
            tags: postData.tags,
            suggestions: postData.suggestions,
          }
        });
      } catch (err) {
        console.error(`  ❌ [3B] Gemini write attempt ${attempt}: ${err.message}`);
        if (/429|quota|RESOURCE_EXHAUSTED/i.test(err.message) && attempt < 2) {
          console.log(`  ⏳ Rate limited — waiting 8s...`);
          await sleep(8000);
          continue;
        }
        break;
      }
    }
  }

  // ── Fallback cuối cùng ────────────────────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  ⚠️ ALL AI ENGINES FAILED — template fallback (${elapsed}s)`);

  return res.json({
    success: true,
    source: 'template',
    elapsed: `${elapsed}s`,
    message: '⚠️ Tất cả AI đang quá tải. Đã tạo template tạm. Hãy thử lại sau 1-2 phút.',
    data: generateSmartPost(cleanTopic),
  });
});

// ═══════════════════════════════════════════════════════
// GET /api/ai/search-info — Kiểm tra cấu hình AI engines
// ═══════════════════════════════════════════════════════
router.get('/search-info', authenticate, authorize('admin'), (req, res) => {
  res.json({
    engines: {
      gemini: {
        active: !!process.env.GEMINI_API_KEY,
        role: 'Nghiên cứu + Google Search Grounding + Viết bài (fallback)',
        model: 'gemini-2.0-flash',
      },
      groq: {
        active: !!process.env.GROQ_API_KEY,
        role: 'Viết bài SEO chuyên nghiệp (ưu tiên)',
        model: 'llama-3.3-70b-versatile',
        free: true,
      },
      googleSearch: {
        active: !!(process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX),
        role: 'Bổ sung dữ liệu tìm kiếm Google',
      },
    },
    pipeline: [
      '1. Google Custom Search → dữ liệu thực tế (tùy chọn)',
      '2. Gemini + Google Grounding → nghiên cứu chủ đề',
      '3. Groq Llama 3.3 70B → viết bài SEO chuẩn E-E-A-T',
      '4. Gemini → fallback nếu Groq lỗi',
      '5. Smart Template → fallback nếu tất cả AI lỗi',
    ],
    guide: {
      gemini: 'https://aistudio.google.com/apikey (miễn phí)',
      groq: 'https://console.groq.com/keys (miễn phí 100%)',
      googleSearch: 'console.developers.google.com + cse.google.com',
    }
  });
});

module.exports = router;
