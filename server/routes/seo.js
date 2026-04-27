const express = require('express');
const prisma = require('../lib/db');
const router = express.Router();

// ═══════════════════════════════════════════════════════
// GET /sitemap.xml — Auto-generated Sitemap cho Google
// ═══════════════════════════════════════════════════════
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = req.query.domain || process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;

    const [posts, courses, categories] = await Promise.all([
      prisma.post.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true, createdAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.course.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.category.findMany({
        select: { id: true, name: true },
      }),
    ]);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Static Pages -->
  <url><loc>${baseUrl}/courses</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/blog</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/gioi-thieu</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/lien-he</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${baseUrl}/tuyen-dung</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>${baseUrl}/login</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>
  <url><loc>${baseUrl}/register</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>

  <!-- Blog Posts -->
${posts.map(p => `  <url>
    <loc>${baseUrl}/blog/${p.slug}</loc>
    <lastmod>${(p.updatedAt || p.createdAt).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}

  <!-- Courses -->
${courses.map(c => `  <url>
    <loc>${baseUrl}/courses/${c.slug}</loc>
    <lastmod>${c.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}

</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    res.status(500).send('Error generating sitemap');
  }
});

// ═══════════════════════════════════════════════════════
// GET /robots.txt — Hướng dẫn Google Bot crawl
// ═══════════════════════════════════════════════════════
router.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
  res.set('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /login
Disallow: /register
Disallow: /profile
Disallow: /checkout
Disallow: /learn/

Sitemap: ${baseUrl}/sitemap.xml
`);
});

// ═══════════════════════════════════════════════════════
// GET /api/seo/post/:slug — Schema.org JSON-LD cho bài viết
// Google dùng để hiện Rich Snippets (FAQ, Article)
// ═══════════════════════════════════════════════════════
router.get('/api/seo/post/:slug', async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        author: { select: { fullName: true, avatar: true } },
      },
    });

    if (!post) return res.status(404).json({ success: false });

    const baseUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
    const postUrl = `${baseUrl}/blog/${post.slug}`;

    // Parse FAQ from content (tìm section FAQ trong HTML)
    const faqItems = [];
    const faqRegex = /<h[23][^>]*>(.*?(?:FAQ|Câu Hỏi|Thường Gặp).*?)<\/h[23]>/i;
    const content = post.content || '';

    // Extract Q&A pairs: <h3>Question</h3><p>Answer</p>
    const qaRegex = /<h3[^>]*>(.*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/gi;
    let match;
    while ((match = qaRegex.exec(content)) !== null) {
      const q = match[1].replace(/<[^>]*>/g, '').trim();
      const a = match[2].replace(/<[^>]*>/g, '').trim();
      if (q && a && (q.includes('?') || q.toLowerCase().includes('gì') || q.toLowerCase().includes('sao') || q.toLowerCase().includes('nào'))) {
        faqItems.push({ question: q, answer: a });
      }
    }

    // Schema: Article
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.metaTitle || post.title,
      "description": post.metaDescription || post.excerpt || '',
      "image": post.thumbnail ? [post.thumbnail] : [],
      "datePublished": post.createdAt?.toISOString(),
      "dateModified": post.updatedAt?.toISOString(),
      "author": {
        "@type": "Person",
        "name": post.author?.fullName || "Thắng Tin Học",
      },
      "publisher": {
        "@type": "Organization",
        "name": "Thắng Tin Học",
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/logo.png`,
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": postUrl,
      },
      "wordCount": content.replace(/<[^>]*>/g, '').split(/\s+/).length,
      "articleSection": post.category?.name || "Tin Học",
      "keywords": (() => {
        try { return JSON.parse(post.tags || '[]').join(', '); } catch { return ''; }
      })(),
    };

    // Schema: FAQ (nếu có)
    let faqSchema = null;
    if (faqItems.length >= 2) {
      faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqItems.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer,
          }
        })),
      };
    }

    // Schema: BreadcrumbList
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Trang chủ", "item": baseUrl },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${baseUrl}/blog` },
        ...(post.category ? [{
          "@type": "ListItem", "position": 3,
          "name": post.category.name,
          "item": `${baseUrl}/blog?categoryId=${post.category.id}`,
        }] : []),
        { "@type": "ListItem", "position": post.category ? 4 : 3, "name": post.title, "item": postUrl },
      ],
    };

    // Meta tags cho Open Graph + Twitter Cards
    const meta = {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || '',
      image: post.thumbnail || '',
      url: postUrl,
      type: 'article',
      author: post.author?.fullName || 'Thắng Tin Học',
      publishedTime: post.createdAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      category: post.category?.name || '',
      tags: (() => { try { return JSON.parse(post.tags || '[]'); } catch { return []; } })(),
    };

    res.json({
      success: true,
      data: {
        meta,
        schemas: [articleSchema, breadcrumbSchema, ...(faqSchema ? [faqSchema] : [])],
      }
    });
  } catch (err) {
    console.error('SEO schema error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
