import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";

    const skills = await prisma.skill.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : {},
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(skills);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, category } = await req.json();
    if (!name || !category) {
      return NextResponse.json({ error: "Name and category required" }, { status: 400 });
    }

    const skill = await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name, category },
    });

    return NextResponse.json(skill, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
