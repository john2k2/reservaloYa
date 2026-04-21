import { cookies } from "next/headers";
import {
  createAdminClient,
  createPublicClient,
  createSessionClient,
  persistSupabaseAuth,
  clearSupabaseAuth,
} from "@/lib/supabase/server";

const SESSION_COOKIE = "sb_session";
const TRIAL_DAYS = 15;

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role: string;
  businessId?: string;
  businessSlug?: string;
  active?: boolean;
};

export async function getAuthenticatedSupabaseUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    // Validar JWT con anon key (no requiere service role)
    const publicClient = createPublicClient();
    const { data: { user }, error } = await publicClient.auth.getUser(token);
    if (!user || error) return null;

    // Leer datos del user usando su propio JWT (RLS: app_users_own_read)
    const sessionClient = createSessionClient(token);
    const { data: appUser } = await sessionClient
      .from("app_users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!appUser) return null;
    if (appUser.active === false) return null;

    let businessSlug: string | undefined;
    if (appUser.business_id) {
      // RLS: public_active_businesses_read permite SELECT para negocios activos
      const { data: business } = await sessionClient
        .from("businesses")
        .select("slug")
        .eq("id", appUser.business_id)
        .single();
      businessSlug = business?.slug ?? undefined;
    }

    return {
      id: user.id,
      email: user.email ?? "",
      name: appUser.name ?? user.email ?? "",
      role: appUser.role ?? "staff",
      businessId: appUser.business_id ?? undefined,
      businessSlug,
      active: appUser.active,
    };
  } catch {
    return null;
  }
}

export async function signInSupabaseUser(email: string, password: string) {
  const client = createPublicClient();

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  if (data.session?.access_token) {
    const expiresAt = data.session.expires_at
      ? new Date(data.session.expires_at * 1000)
      : undefined;
    await persistSupabaseAuth(data.session.access_token, expiresAt);
  }

  return data.user;
}

export async function signOutSupabaseUser() {
  await clearSupabaseAuth();
}

export async function createSupabaseOwnerAccount(params: {
  ownerName: string;
  email: string;
  password: string;
  businessName: string;
  businessSlug: string;
  phone: string;
  address: string;
  templateSlug: string;
}) {
  const admin = createAdminClient();

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    user_metadata: {
      name: params.ownerName,
    },
  });

  if (authError) throw authError;
  if (!authUser.user) throw new Error("No se pudo crear el usuario.");

  const { data: business, error: businessError } = await admin
    .from("businesses")
    .insert({
      name: params.businessName,
      slug: params.businessSlug,
      templateSlug: params.templateSlug,
      phone: params.phone,
      address: params.address,
      active: true,
    })
    .select()
    .single();

  if (businessError || !business) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    throw businessError ?? new Error("No se pudo crear el negocio.");
  }

  const { error: appUserError } = await admin.from("app_users").insert({
    id: authUser.user.id,
    name: params.ownerName,
    role: "owner",
    business_id: business.id,
    active: true,
  });

  if (appUserError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    throw appUserError;
  }

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await admin.from("subscriptions").insert({
    businessId: business.id,
    status: "trial",
    trialEndsAt,
  });

  return authUser.user;
}

export async function createSupabaseStaffAccount(params: {
  email: string;
  password: string;
  name: string;
  businessId: string;
  role?: "admin" | "staff";
}) {
  const admin = createAdminClient();

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    user_metadata: {
      name: params.name,
    },
  });

  if (authError) throw authError;
  if (!authUser.user) throw new Error("No se pudo crear el usuario.");

  const { error: insertError } = await admin.from("app_users").insert({
    id: authUser.user.id,
    name: params.name,
    role: params.role ?? "staff",
    business_id: params.businessId,
    active: true,
  });

  if (insertError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    throw insertError;
  }

  return authUser.user;
}

export async function updateSupabaseTeamUserStatus(userId: string, active: boolean) {
  const admin = createAdminClient();

  await admin.auth.admin.updateUserById(userId, {
    email_confirm: active,
  });

  const { error } = await admin
    .from("app_users")
    .update({ active, updated: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

export async function resetSupabaseUserPassword(email: string) {
  const client = createPublicClient();
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://reservaya.ar"}/admin/reset-password`,
  });
  if (error) {
    throw error;
  }
}

export async function updateSupabaseUserPassword(accessToken: string, newPassword: string) {
  const admin = createAdminClient();

  const { data: { user }, error: userError } = await admin.auth.getUser(accessToken);
  if (userError || !user) {
    throw new Error("Token inválido o expirado. Solicitá un nuevo enlace de recuperación.");
  }

  const { error } = await admin.auth.admin.updateUserById(user.id, { password: newPassword });
  if (error) throw error;
}
