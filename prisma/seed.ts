import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const skills = [
  { name: "JavaScript", category: "Programming" },
  { name: "TypeScript", category: "Programming" },
  { name: "React", category: "Programming" },
  { name: "Next.js", category: "Programming" },
  { name: "Node.js", category: "Programming" },
  { name: "Python", category: "Programming" },
  { name: "Django", category: "Programming" },
  { name: "FastAPI", category: "Programming" },
  { name: "Java", category: "Programming" },
  { name: "Kotlin", category: "Programming" },
  { name: "Swift", category: "Programming" },
  { name: "Flutter", category: "Programming" },
  { name: "React Native", category: "Programming" },
  { name: "SQL", category: "Programming" },
  { name: "PostgreSQL", category: "Programming" },
  { name: "MongoDB", category: "Programming" },
  { name: "Docker", category: "Programming" },
  { name: "Kubernetes", category: "Programming" },
  { name: "AWS", category: "Programming" },
  { name: "Machine Learning", category: "Programming" },
  { name: "UI/UX Design", category: "Design" },
  { name: "Figma", category: "Design" },
  { name: "Adobe Photoshop", category: "Design" },
  { name: "Adobe Illustrator", category: "Design" },
  { name: "Motion Design", category: "Design" },
  { name: "SEO", category: "Marketing" },
  { name: "Content Marketing", category: "Marketing" },
  { name: "Social Media Marketing", category: "Marketing" },
  { name: "Email Marketing", category: "Marketing" },
  { name: "Google Ads", category: "Marketing" },
  { name: "Product Management", category: "Business" },
  { name: "Entrepreneurship", category: "Business" },
  { name: "Financial Modeling", category: "Business" },
  { name: "Public Speaking", category: "Business" },
  { name: "English", category: "Language" },
  { name: "Spanish", category: "Language" },
  { name: "French", category: "Language" },
  { name: "Mandarin", category: "Language" },
  { name: "Japanese", category: "Language" },
  { name: "Guitar", category: "Music" },
  { name: "Piano", category: "Music" },
  { name: "Music Production", category: "Music" },
  { name: "Photography", category: "Arts" },
  { name: "Painting", category: "Arts" },
  { name: "Video Editing", category: "Arts" },
];

async function main() {
  console.log("Seeding database...");

  // Create skills
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    });
  }

  console.log(`Created ${skills.length} skills`);

  // Create demo users
  const password = await bcrypt.hash("password123", 12);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Alice Johnson",
      email: "alice@example.com",
      password,
      bio: "Full-stack developer with 5 years of experience. Love teaching React and Next.js!",
      location: "San Francisco, CA",
      website: "https://alice.dev",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      name: "Bob Smith",
      email: "bob@example.com",
      password,
      bio: "Designer turned developer. Expert in Figma and UI/UX. Learning React.",
      location: "Austin, TX",
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: "carol@example.com" },
    update: {},
    create: {
      name: "Carol Martinez",
      email: "carol@example.com",
      password,
      bio: "Python developer specializing in machine learning. Looking to learn frontend skills.",
      location: "New York, NY",
    },
  });

  // Add skills to users
  const reactSkill = await prisma.skill.findUnique({ where: { name: "React" } });
  const uiSkill = await prisma.skill.findUnique({ where: { name: "UI/UX Design" } });
  const pythonSkill = await prisma.skill.findUnique({ where: { name: "Python" } });
  const mlSkill = await prisma.skill.findUnique({ where: { name: "Machine Learning" } });
  const figmaSkill = await prisma.skill.findUnique({ where: { name: "Figma" } });
  const nextjsSkill = await prisma.skill.findUnique({ where: { name: "Next.js" } });

  if (reactSkill && uiSkill && pythonSkill && mlSkill && figmaSkill && nextjsSkill) {
    await prisma.userSkill.createMany({
      data: [
        { userId: alice.id, skillId: reactSkill.id, type: "TEACH", level: "EXPERT" },
        { userId: alice.id, skillId: nextjsSkill.id, type: "TEACH", level: "ADVANCED" },
        { userId: alice.id, skillId: uiSkill.id, type: "LEARN", level: "BEGINNER" },
        { userId: bob.id, skillId: figmaSkill.id, type: "TEACH", level: "EXPERT" },
        { userId: bob.id, skillId: uiSkill.id, type: "TEACH", level: "ADVANCED" },
        { userId: bob.id, skillId: reactSkill.id, type: "LEARN", level: "BEGINNER" },
        { userId: carol.id, skillId: pythonSkill.id, type: "TEACH", level: "EXPERT" },
        { userId: carol.id, skillId: mlSkill.id, type: "TEACH", level: "ADVANCED" },
        { userId: carol.id, skillId: reactSkill.id, type: "LEARN", level: "BEGINNER" },
      ],
      skipDuplicates: true,
    });
  }

  console.log("Created 3 demo users (alice@example.com, bob@example.com, carol@example.com) with password: password123");
  console.log("Seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
