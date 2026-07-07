import { getSupabaseAdminClient } from "./_core";

export type JobRunStatus = "running" | "completed" | "failed";

export async function startJobRun(jobName: string): Promise<string> {
  const client = await getSupabaseAdminClient();
  const { data, error } = await client
    .from("job_runs")
    .insert({ job_name: jobName, status: "running" satisfies JobRunStatus })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("No se pudo registrar el inicio del job.");
  }

  return data.id as string;
}

export async function finishJobRun(
  id: string,
  status: Extract<JobRunStatus, "completed" | "failed">,
  details: { summary?: unknown; error?: string }
): Promise<void> {
  const client = await getSupabaseAdminClient();
  await client
    .from("job_runs")
    .update({
      status,
      finished_at: new Date().toISOString(),
      summary: details.summary ?? null,
      error: details.error ?? null,
    })
    .eq("id", id);
}
