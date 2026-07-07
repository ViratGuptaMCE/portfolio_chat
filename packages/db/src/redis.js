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
      return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
    }
    return null;
  } catch (err) {
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
  } catch (err) {
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
  } catch (err) {
  }
}
