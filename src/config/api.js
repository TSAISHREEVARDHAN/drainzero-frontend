// ─────────────────────────────────────────────
//  DrainZero — Backend API
// ─────────────────────────────────────────────

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

if (!BACKEND_URL || BACKEND_URL === 'PASTE_YOUR_RENDER_BACKEND_URL_HERE') {
  console.error('⚠️ VITE_BACKEND_URL not set in .env file!');
}

// ── Fetch with timeout + better errors ──
const apiFetch = async (endpoint, method = 'GET', body = null, timeoutMs = 30000) => {
  if (!BACKEND_URL || BACKEND_URL.includes('PASTE_YOUR')) {
    throw new Error('Backend URL not configured. Please set VITE_BACKEND_URL in your .env file.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BACKEND_URL}${endpoint}`, options);
    clearTimeout(timer);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `Request failed: ${res.status}`);
    }
    return res.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Request timed out — backend may be sleeping. Try again in 30 seconds.');
    if (err.message === 'Failed to fetch') throw new Error('Cannot reach backend. Check your VITE_BACKEND_URL in .env and make sure Render is running.');
    throw err;
  }
};

export const analyseProfile  = (userId)          => apiFetch('/api/analyse', 'POST', { userId });
export const getLoopholes    = (userId)          => apiFetch(`/api/loopholes?userId=${userId}`);
export const getBenefits     = (userId)          => apiFetch(`/api/benefits?userId=${userId}`);
export const askAgent        = (userId, message) => apiFetch('/api/agent', 'POST', { userId, message }, 35000);
export const getAgentHistory = (userId)          => apiFetch(`/api/agent/history?userId=${userId}`);
export const clearAgentHistory = (userId)        => apiFetch('/api/agent/history', 'DELETE', { userId });
export const uploadDocument  = (userId, fileBase64, fileType) => apiFetch('/api/documents', 'POST', { userId, fileBase64, fileType }, 60000);

export default BACKEND_URL;
