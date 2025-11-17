/**
 * API 基础配置
 */
export const API_BASE_URL = 'http://localhost:7001';

export async function fetchAPI(path: string, params?: Record<string, any>) {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    Object.keys(params).forEach(k => {
      if (params[k] != null && params[k] !== '') {
        url.searchParams.set(k, String(params[k]));
      }
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
