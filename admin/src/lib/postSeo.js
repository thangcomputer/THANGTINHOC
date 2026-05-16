export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

export function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function countWords(htmlOrText) {
  const text = stripHtml(htmlOrText);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export function normalizeSlug(raw) {
  return slugify(raw || '').replace(/^-+|-+$/g, '');
}

export function generateTOC(content) {
  const toc = [];
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(content || '')) !== null) {
    toc.push({ id: slugify(match[2].trim()), text: match[2].trim(), level: match[1].length });
  }
  const htmlRegex = /<h([2-4])[^>]*>(.*?)<\/h[2-4]>/gi;
  while ((match = htmlRegex.exec(content || '')) !== null) {
    const text = match[2].replace(/<[^>]*>/g, '').trim();
    toc.push({ id: slugify(text), text, level: parseInt(match[1], 10) });
  }
  return toc;
}

export function buildSeoDefaults(form) {
  const title = (form.title || '').trim();
  const excerpt = (form.excerpt || '').trim();
  return {
    metaTitle: (form.metaTitle || '').trim() || title.slice(0, 60),
    metaDescription: (form.metaDescription || '').trim() || excerpt.slice(0, 160),
  };
}

export function validatePostForm(form) {
  const errors = [];
  if (!(form.title || '').trim()) errors.push('Thiếu tiêu đề');
  if (!normalizeSlug(form.slug)) errors.push('Slug không hợp lệ');
  if (!form.categoryId) errors.push('Chưa chọn danh mục');
  if (!stripHtml(form.content)) errors.push('Nội dung trống');
  return errors;
}

export function analyzeSEO(form) {
  const checks = [];
  const kw = (form.focusKeyword || '').toLowerCase().trim();
  const title = form.title || '';
  const { metaTitle: defaultMetaTitle, metaDescription: defaultMetaDesc } = buildSeoDefaults(form);
  const metaTitle = (form.metaTitle || '').trim() || defaultMetaTitle;
  const metaDesc = (form.metaDescription || '').trim() || defaultMetaDesc;
  const content = form.content || '';
  const slug = form.slug || '';
  const contentLower = stripHtml(content).toLowerCase();
  const titleLower = title.toLowerCase();
  const wordCount = countWords(content);

  if (!kw) {
    checks.push({ type: 'warning', text: 'Chưa đặt từ khóa trọng tâm', tip: 'Nhập từ khóa chính để phân tích SEO', weight: 2 });
  } else {
    if (titleLower.includes(kw)) checks.push({ type: 'good', text: 'Từ khóa có trong tiêu đề', weight: 3 });
    else checks.push({ type: 'error', text: 'Từ khóa chưa có trong tiêu đề', tip: `Thêm "${kw}" vào tiêu đề`, weight: 3 });

    const kwSlug = slugify(kw);
    if (slug.includes(kwSlug)) checks.push({ type: 'good', text: 'Từ khóa có trong URL (slug)', weight: 2 });
    else checks.push({ type: 'warning', text: 'Từ khóa chưa có trong URL', tip: `Nên thêm "${kwSlug}" vào slug`, weight: 2 });

    if (metaDesc.toLowerCase().includes(kw)) checks.push({ type: 'good', text: 'Từ khóa có trong Meta Description', weight: 2 });
    else checks.push({ type: 'warning', text: 'Từ khóa chưa có trong Meta Description', tip: 'Thêm từ khóa vào mô tả meta', weight: 2 });

    if (contentLower.includes(kw)) {
      const count = (contentLower.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      const density = wordCount > 0 ? ((count * kw.length) / stripHtml(content).length) * 100 : 0;
      if (density > 0 && density < 2.5) checks.push({ type: 'good', text: `Mật độ từ khóa: ${density.toFixed(1)}% (${count} lần)`, weight: 2 });
      else if (density >= 2.5) checks.push({ type: 'warning', text: `Mật độ từ khóa cao: ${density.toFixed(1)}%`, tip: 'Giảm lặp từ khóa (nên 0.5–2%)', weight: 2 });
      else checks.push({ type: 'warning', text: 'Từ khóa xuất hiện ít trong nội dung', tip: 'Thêm từ khóa tự nhiên vào bài', weight: 2 });
    } else checks.push({ type: 'error', text: 'Từ khóa chưa có trong nội dung', tip: 'Đề cập từ khóa trong bài viết', weight: 3 });

    const firstPara = contentLower.slice(0, 280);
    if (firstPara.includes(kw)) checks.push({ type: 'good', text: 'Từ khóa trong đoạn mở đầu', weight: 2 });
    else checks.push({ type: 'warning', text: 'Từ khóa chưa có trong đoạn mở đầu', tip: 'Nên có từ khóa trong 1–2 câu đầu', weight: 1 });
  }

  if (!metaTitle) checks.push({ type: 'warning', text: 'Chưa có Meta Title', tip: '50–60 ký tự, chứa từ khóa', weight: 2 });
  else if (metaTitle.length < 30) checks.push({ type: 'warning', text: `Meta Title ngắn (${metaTitle.length} ký tự)`, tip: 'Nên 50–60 ký tự', weight: 1 });
  else if (metaTitle.length <= 60) checks.push({ type: 'good', text: `Meta Title tốt (${metaTitle.length}/60)`, weight: 2 });
  else checks.push({ type: 'warning', text: `Meta Title dài (${metaTitle.length}/60)`, tip: 'Google có thể cắt bớt', weight: 1 });

  if (!metaDesc) checks.push({ type: 'warning', text: 'Chưa có Meta Description', tip: '120–160 ký tự', weight: 2 });
  else if (metaDesc.length < 100) checks.push({ type: 'warning', text: `Meta Description ngắn (${metaDesc.length}/160)`, tip: 'Nên 120–160 ký tự', weight: 1 });
  else if (metaDesc.length <= 160) checks.push({ type: 'good', text: `Meta Description tốt (${metaDesc.length}/160)`, weight: 2 });
  else checks.push({ type: 'warning', text: `Meta Description dài (${metaDesc.length}/160)`, tip: 'Google cắt sau ~160 ký tự', weight: 1 });

  if (wordCount < 100) checks.push({ type: 'error', text: `Nội dung quá ngắn (${wordCount} từ)`, tip: 'Viết ít nhất 300 từ', weight: 4 });
  else if (wordCount < 300) checks.push({ type: 'warning', text: `Nội dung hơi ngắn (${wordCount} từ)`, tip: 'Nên 300+ từ (lý tưởng 800+)', weight: 2 });
  else if (wordCount >= 800) checks.push({ type: 'good', text: `Độ dài nội dung xuất sắc (${wordCount} từ)`, weight: 3 });
  else checks.push({ type: 'good', text: `Độ dài nội dung tốt (${wordCount} từ)`, weight: 2 });

  const hasH2 = /^##\s/m.test(content) || /<h[23]/i.test(content);
  if (hasH2) checks.push({ type: 'good', text: 'Có heading phụ (H2/H3)', weight: 2 });
  else checks.push({ type: 'warning', text: 'Chưa có heading phụ (H2/H3)', tip: 'Thêm H2/H3 để cấu trúc bài', weight: 2 });

  const hasImage = form.thumbnail || /!\[.*\]\(.*\)/m.test(content) || /<img/i.test(content);
  if (hasImage) checks.push({ type: 'good', text: 'Có ảnh minh họa', weight: 2 });
  else checks.push({ type: 'warning', text: 'Chưa có ảnh minh họa', tip: 'Thêm ảnh bìa hoặc ảnh trong bài', weight: 2 });

  if (form.excerpt && form.excerpt.length > 20) checks.push({ type: 'good', text: 'Có tóm tắt bài viết', weight: 1 });
  else checks.push({ type: 'warning', text: 'Chưa có tóm tắt', tip: 'Viết excerpt cho trang danh sách blog', weight: 1 });

  if (form.thumbnail) checks.push({ type: 'good', text: 'Có ảnh bìa (Open Graph)', weight: 2 });
  else checks.push({ type: 'warning', text: 'Chưa có ảnh bìa', tip: 'Ảnh bìa hiển thị khi share Facebook/Zalo', weight: 2 });

  let score = 0;
  let maxScore = 0;
  checks.forEach((c) => {
    const w = c.weight || 1;
    maxScore += w;
    if (c.type === 'good') score += w;
    else if (c.type === 'warning') score += w * 0.5;
  });
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const good = checks.filter((c) => c.type === 'good').length;
  return { checks, score: pct, good, total: checks.length, wordCount };
}