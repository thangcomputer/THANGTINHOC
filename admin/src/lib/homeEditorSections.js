/** Preview hash + keys saved per CMS section */
export const SECTION_PREVIEW_HASH = {
  hero: "#hero",
  stats: "#stats-banner",
  features: "#features-section",
  "learning-path": "#learning-path",
  "visual-learning": "#visual-learning",
  courses: "#courses-section",
  testimonials: "#testimonials",
  partners: "#partners",
  cta: "#cta-section",
  promo: "",
  footer: "#site-footer",
};

export function buildSectionSettings(sectionId, ctx) {
  const { settings, features, testimonials, stats, partners, learningPath, visualFeatures, footerColumns } = ctx;
  const base = { ...settings };
  switch (sectionId) {
    case "hero":
      return pick(base, ["hero_title", "hero_subtitle", "hero_btn_text", "hero_btn_url", "hero_media_type", "hero_media_url", "anim_hero"]);
    case "stats":
      return { ...pick(base, ["anim_stats"]), home_stats: JSON.stringify(stats) };
    case "features":
      return { ...pick(base, ["anim_features"]), home_features: JSON.stringify(features) };
    case "learning-path":
      return { ...pick(base, ["anim_learning_path"]), home_learning_path: JSON.stringify(learningPath) };
    case "visual-learning":
      return {
        ...pick(base, ["anim_visual", "visual_title", "visual_subtitle", "visual_description", "visual_media_type", "visual_media_url"]),
        home_visual_features: JSON.stringify(visualFeatures),
      };
    case "courses":
      return pick(base, ["courses_title", "courses_subtitle", "courses_btn_text"]);
    case "testimonials":
      return { ...pick(base, ["anim_testimonials"]), home_testimonials: JSON.stringify(testimonials) };
    case "partners":
      return { ...pick(base, ["anim_partners"]), home_partners: JSON.stringify(partners) };
    case "cta":
      return pick(base, ["anim_cta", "cta_title", "cta_subtitle", "cta_btn_text", "cta_btn_url", "cta_btn2_text", "cta_btn2_url"]);
    case "promo":
      return pick(base, ["promo_enabled", "promo_title", "promo_text", "promo_image", "promo_link"]);
    case "footer":
      return { footer_columns: JSON.stringify(footerColumns) };
    default:
      return {};
  }
}

function pick(obj, keys) {
  return keys.reduce((acc, k) => {
    if (obj[k] !== undefined) acc[k] = obj[k];
    return acc;
  }, {});
}

export function getSectionMeta(sectionId, ctx) {
  const { features, testimonials, stats, partners, learningPath, visualFeatures, footerColumns } = ctx;
  const map = {
    features: { count: features.length, countLabel: "t\u00ednh n\u0103ng", addLabel: "Th\u00eam t\u00ednh n\u0103ng" },
    "learning-path": { count: learningPath.length, countLabel: "b\u01b0\u1edbc", addLabel: "Th\u00eam b\u01b0\u1edbc" },
    "visual-learning": { count: visualFeatures.length, countLabel: "m\u1ee5c", addLabel: "Th\u00eam m\u1ee5c" },
    testimonials: { count: testimonials.length, countLabel: "c\u1ea3m nh\u1eadn", addLabel: "Th\u00eam c\u1ea3m nh\u1eadn" },
    partners: { count: partners.length, countLabel: "\u0111\u1ed1i t\u00e1c", addLabel: "Th\u00eam \u0111\u1ed1i t\u00e1c" },
    stats: { count: stats.length, countLabel: "m\u1ee5c th\u1ed1ng k\u00ea", addLabel: "Th\u00eam m\u1ee5c" },
    footer: { count: footerColumns.length, countLabel: "c\u1ed9t", addLabel: "Th\u00eam c\u1ed9t" },
  };
  return map[sectionId] || null;
}