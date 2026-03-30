/**
 * HTML Sanitization utility for safe rendering of user-generated content
 * Uses isomorphic-dompurify for XSS protection
 */

import DOMPurify from 'isomorphic-dompurify';

const SAFE_HTML_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'td', 'th', 'div', 'span',
    'ol', 'li', 'b', 'i', 'mark', 'del', 'ins'
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]*(?:[^a-z+.\-:]|$))/i,
  FORCE_BODY: false,
  SANITIZE_DOM: true,
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * Preserves safe formatting while removing malicious content
 * 
 * @param {string} html - The HTML content to sanitize
 * @returns {string} - Sanitized HTML safe for DOM insertion
 */
export function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, SAFE_HTML_CONFIG);
}

/**
 * Set innerHTML safely on a DOM element
 * 
 * @param {HTMLElement} element - The DOM element to update
 * @param {string} html - The HTML content to set
 */
export function setSafeInnerHTML(element, html) {
  if (!element || !html) {
    return;
  }

  const sanitized = sanitizeHTML(html);
  element.innerHTML = sanitized;
}

/**
 * Create a sanitized HTML fragment for React components
 * For use with dangerouslySetInnerHTML
 * 
 * @param {string} html - The HTML content to sanitize
 * @returns {object} - Object safe for dangerouslySetInnerHTML
 */
export function createSafeHTMLFragment(html) {
  const sanitized = sanitizeHTML(html);
  return { __html: sanitized };
}

export default {
  sanitizeHTML,
  setSafeInnerHTML,
  createSafeHTMLFragment,
};
