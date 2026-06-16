import { prisma } from "@/lib/prisma";

export type MembershipCheck =
  | { ok: true; role: "OWNER" | "MEMBER" }
  | { ok: false; status: number; error: string };

/**
 * Ensures `userId` is an ACTIVE member of `groupId`. Returns the membership
 * role on success, or a structured error to return from the route.
 */
export async function requireGroupMember(
  groupId: string,
  userId: string
): Promise<MembershipCheck> {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return { ok: false, status: 404, error: "Group not found" };

  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!membership || membership.status !== "ACTIVE") {
    return { ok: false, status: 403, error: "Not a member of this group" };
  }

  return { ok: true, role: membership.role };
}

/** Like requireGroupMember but also requires the OWNER role. */
export async function requireGroupOwner(
  groupId: string,
  userId: string
): Promise<MembershipCheck> {
  const check = await requireGroupMember(groupId, userId);
  if (!check.ok) return check;
  if (check.role !== "OWNER") {
    return { ok: false, status: 403, error: "Only the group owner can do this" };
  }
  return check;
}
