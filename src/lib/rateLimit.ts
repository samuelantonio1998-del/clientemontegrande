import { supabase } from "@/integrations/supabase/client";

export async function checkRateLimit(action: string, identifier: string): Promise<{ allowed: boolean; error?: string; retry_after?: number }> {
  try {
    const { data, error } = await supabase.functions.invoke("check-rate-limit", {
      body: { action, identifier },
    });

    if (error) {
      // Fail open if rate limit service is unavailable
      console.warn("Rate limit check failed:", error);
      return { allowed: true };
    }

    return data as { allowed: boolean; error?: string; retry_after?: number };
  } catch {
    // Fail open
    return { allowed: true };
  }
}
