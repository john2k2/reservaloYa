import { createAdminClient } from "@/lib/supabase/server";

export type SupabaseListOptions = {
  sort?: string;
  filter?: string;
  limit?: number;
};

export async function getSupabaseAdminClient() {
  return createAdminClient();
}

export async function listSupabaseRecords<T>(
  table: string,
  options?: SupabaseListOptions
) {
  const client = await getSupabaseAdminClient();

  let query = client.from(table).select("*");

  if (options?.filter) {
    const match = options.filter.match(/^(\w+)=eq\.(.+)$/);
    if (match) {
      query = query.eq(match[1]!, match[2]!);
    }
  }

  if (options?.sort) {
    query = query.order(options.sort.split(" ")[0] as string, {
      ascending: options.sort.includes("asc"),
    });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as T[];
}

export async function getSupabaseRecord<T>(table: string, id: string) {
  const client = await getSupabaseAdminClient();
  const { data, error } = await client.from(table).select("*").eq("id", id).single();
  if (error) throw error;
  return data as T;
}

export async function createSupabaseRecord<T>(
  table: string,
  data: Omit<T, "id" | "created" | "updated">
) {
  const client = await getSupabaseAdminClient();
  const { data: result, error } = await client
    .from(table)
    .insert(data as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return result as T;
}

export async function updateSupabaseRecord<T>(
  table: string,
  id: string,
  data: Partial<T>
) {
  const client = await getSupabaseAdminClient();
  const { data: result, error } = await client
    .from(table)
    .update({ ...data, updated: new Date().toISOString() } as Record<string, unknown>)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return result as T;
}

export async function deleteSupabaseRecord(table: string, id: string) {
  const client = await getSupabaseAdminClient();
  const { error } = await client.from(table).delete().eq("id", id);
  if (error) throw error;
}
