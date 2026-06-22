// Minimal Supabase client without installing SDK.
// Uses fetch to call Supabase PostgREST + RPC endpoints.

type Json = any;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
if (!SUPABASE_ANON_KEY) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
} as Record<string, string>;

async function supaFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const url = `${SUPABASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers || {}),
    },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.message || data?.error || `Supabase error: ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

export async function supaSelect<T = any>(
  table: string,
  opts?: {
    select?: string;
    orderBy?: { column: string; ascending?: boolean };
  }
) {
  const params = new URLSearchParams({
    select: opts?.select || '*',
  });

  if (opts?.orderBy) {
    params.set(
      'order',
      `${opts.orderBy.column}.${opts.orderBy.ascending === false ? 'desc' : 'asc'}`
    );
  }

  return supaFetch<T>(`/rest/v1/${table}?${params.toString()}`);
}


export async function supaInsert<T = any>(table: string, row: Record<string, any>) {
  return supaFetch<T>(`/rest/v1/${table}`, {
    method: 'POST',
    body: JSON.stringify(row),
  });
}

export async function supaUpdate<T = any>(table: string, id: number, patch: Record<string, any>) {
  // Use filter by id
  return supaFetch<T>(`/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    Prefer: 'return=representation',
    body: JSON.stringify(patch),
  } as any);
}

export async function supaDelete<T = any>(table: string, id: number) {
  return supaFetch<T>(`/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
  });
}

// RPC
export async function supaRpc<T = any>(fn: string, args: Record<string, any>) {
  // RPC endpoint
  const res = await supaFetch<{ data: T }>(`/functions/v1/${fn}`, {
    method: 'POST',
    body: JSON.stringify(args),
  } as any);
  return (res as any).data;
}

