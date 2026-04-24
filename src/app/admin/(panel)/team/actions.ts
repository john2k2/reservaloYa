"use server";

import { redirect } from "next/navigation";

import { writeAuditLog } from "@/server/audit-log";
import { createSupabaseStaffAccount, updateSupabaseTeamUserStatus } from "@/server/supabase-auth";
import { getAuthenticatedSupabaseUser } from "@/server/supabase-auth";
import { requireAdminRouteAccess } from "@/server/admin-access";

async function getOwnerContext() {
  const shellData = await requireAdminRouteAccess("/admin/team");

  if (!shellData.businessId || shellData.demoMode) {
    redirect("/admin/dashboard?error=La gestion de equipo solo esta disponible en modo Supabase.");
  }

  const user = await getAuthenticatedSupabaseUser();

  return {
    businessId: shellData.businessId,
    userRole: "owner" as const,
    userId: user?.id ?? "",
    userEmail: user?.email ?? shellData.userEmail,
  };
}

export async function createStaffAction(formData: FormData) {
  const shellData = await getOwnerContext();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    redirect("/admin/team?error=Completa nombre, email y contraseña.");
  }

  if (password.length < 8) {
    redirect("/admin/team?error=La contraseña temporal debe tener al menos 8 caracteres.");
  }

  try {
    await createSupabaseStaffAccount({
      businessId: shellData.businessId,
      name,
      email,
      password,
      role: "staff",
    });

    await writeAuditLog(
      { userId: shellData.userId, userEmail: shellData.userEmail, businessId: shellData.businessId },
      "team.staff_created",
      email,
      { name, role: "staff" }
    );
  } catch (error) {
    redirect(
      `/admin/team?error=${encodeURIComponent(
        error instanceof Error ? error.message : "No pudimos crear el usuario."
      )}`
    );
  }

  redirect("/admin/team?success=Usuario%20creado%20correctamente.");
}

export async function updateStaffStatusAction(formData: FormData) {
  const shellData = await getOwnerContext();
  const userId = String(formData.get("userId") ?? "").trim();
  const nextActive = String(formData.get("nextActive") ?? "").trim() === "true";

  if (!userId) {
    redirect("/admin/team?error=Falta el usuario a actualizar.");
  }

  try {
    await updateSupabaseTeamUserStatus(userId, shellData.businessId, nextActive);

    await writeAuditLog(
      { userId: shellData.userId, userEmail: shellData.userEmail, businessId: shellData.businessId },
      "team.staff_status_changed",
      userId,
      { active: nextActive }
    );
  } catch (error) {
    redirect(
      `/admin/team?error=${encodeURIComponent(
        error instanceof Error ? error.message : "No pudimos actualizar el usuario."
      )}`
    );
  }

  redirect(
    `/admin/team?success=${encodeURIComponent(
      nextActive ? "Usuario activado correctamente." : "Usuario desactivado correctamente."
    )}`
  );
}
