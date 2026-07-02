// Upstash Redis REST Cache Helper

export async function redisGet(key) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.result) {
      console.log(`[REDIS HIT] Cache hit for key: "${key}"`);
      return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
    }
    return null;
  } catch (err) {
    console.error(`[REDIS GET ERROR] Key "${key}":`, err.message);
    return null;
  }
}

export async function redisSet(key, value, ttlSeconds = 3600) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;

  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const res = await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(serialized)}?ex=${ttlSeconds}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    if (res.ok) {
      console.log(`[REDIS SET] Cached key "${key}" in Upstash Redis (TTL: ${ttlSeconds}s)`);
    }
  } catch (err) {
    console.error(`[REDIS SET ERROR] Key "${key}":`, err.message);
  }
}

export async function redisDel(key) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;

  try {
    await fetch(`${url}/del/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    console.log(`[REDIS DEL] Invalidated cache key "${key}" in Upstash Redis`);
  } catch (err) {
    console.error(`[REDIS DEL ERROR] Key "${key}":`, err.message);
  }
}
