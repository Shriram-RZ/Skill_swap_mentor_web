import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireGroupMember, requireGroupOwner } from "@/lib/groups";

const inviteSchema = z.object({ email: z.string().email() });
const respondSchema = z.object({ accept: z.boolean() });
const removeSchema = z.object({ userId: z.string() });

// Owner invites a user by email.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const check = await requireGroupOwner(id, session.user.id);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const { email } = inviteSchema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "No user with that email" }, { status: 404 });

    const existing = await prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId: id, userId: user.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "User is already invited or a member" }, { status: 409 });
    }

    const group = await prisma.group.findUnique({ where: { id }, select: { name: true } });

    await prisma.groupMembership.create({
      data: { groupId: id, userId: user.id, role: "MEMBER", status: "INVITED" },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "GROUP_INVITE",
        title: "Group invitation",
        message: `${session.user.name} invited you to join "${group?.name}"`,
        relatedId: id,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Invited user accepts or declines their own invite.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { accept } = respondSchema.parse(await req.json());

    const membership = await prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId: id, userId: session.user.id } },
    });
    if (!membership || membership.status !== "INVITED") {
      return NextResponse.json({ error: "No pending invite" }, { status: 404 });
    }

    if (!accept) {
      await prisma.groupMembership.delete({ where: { id: membership.id } });
      return NextResponse.json({ success: true, joined: false });
    }

    await prisma.groupMembership.update({
      where: { id: membership.id },
      data: { status: "ACTIVE", joinedAt: new Date() },
    });

    const group = await prisma.group.findUnique({ where: { id }, select: { ownerId: true, name: true } });
    if (group) {
      await prisma.notification.create({
        data: {
          userId: group.ownerId,
          type: "GROUP_JOINED",
          title: "New group member",
          message: `${session.user.name} joined "${group.name}"`,
          relatedId: id,
        },
      });
    }

    return NextResponse.json({ success: true, joined: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Owner removes a member (or member removes themselves / leaves).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { userId } = removeSchema.parse(await req.json());

    const isSelf = userId === session.user.id;
    if (!isSelf) {
      const check = await requireGroupOwner(id, session.user.id);
      if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });
    }

    const group = await prisma.group.findUnique({ where: { id }, select: { ownerId: true } });
    if (group?.ownerId === userId) {
      return NextResponse.json({ error: "The owner cannot be removed" }, { status: 400 });
    }

    await prisma.groupMembership.deleteMany({ where: { groupId: id, userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
