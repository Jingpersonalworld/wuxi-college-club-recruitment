import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function publicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("缺少 Supabase 公开环境变量");
  return { url, anonKey };
}

function serviceConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("缺少 Supabase 服务端环境变量");
  return { url, key };
}

export function serviceClient(): SupabaseClient {
  const { url, key } = serviceConfig();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function browserClient(): SupabaseClient {
  if (!cachedBrowserClient) { const { url, anonKey } = publicConfig(); cachedBrowserClient = createClient(url, anonKey); }
  return cachedBrowserClient;
}

let cachedBrowserClient: SupabaseClient | undefined;

export function authClient(): SupabaseClient {
  const { url, anonKey } = publicConfig();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
