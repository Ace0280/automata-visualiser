/* ═══════════════════════════════════════════════════
   share.js — URL State Sharing
   ═══════════════════════════════════════════════════ */

function encodeAutomatonToURL() {
  const json = exportAutomatonJSON();
  const encoded = btoa(encodeURIComponent(json));
  return window.location.origin + window.location.pathname + '#state=' + encoded;
}

function decodeAutomatonFromURL() {
  const hash = window.location.hash;
  if (!hash.includes('#state=')) return null;
  const encoded = hash.replace('#state=', '');
  try {
    return decodeURIComponent(atob(encoded));
  } catch (e) {
    console.error("Failed to decode URL", e);
    return null;
  }
}
