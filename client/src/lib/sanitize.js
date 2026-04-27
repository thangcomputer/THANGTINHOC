/**
 * Sanitize HTML content trước khi render dangerouslySetInnerHTML
 * Chống XSS injection — loại bỏ scripts, event handlers, URLs nguy hại
 */
import DOMPurify from 'dompurify';

export function sanitizeHTML(dirty) {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'strong', 'i', 'em', 'u', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
      'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'hr', 'sup', 'sub', 'mark', 'del', 'ins',
      'iframe', 'video', 'source',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'id', 'style',
      'width', 'height', 'loading', 'colspan', 'rowspan', 'type', 'controls',
      'allow', 'allowfullscreen', 'frameborder',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });
}
