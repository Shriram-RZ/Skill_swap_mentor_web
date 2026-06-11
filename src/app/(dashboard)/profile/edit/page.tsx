"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Save, Plus, X, Search } from "lucide-react";
import { skillLevelColor } from "@/lib/utils";

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface UserSkill {
  skillId: string;
  type: "TEACH" | "LEARN";
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  skill: Skill;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  avatar: string | null;
  location: string | null;
  website: string | null;
  skills: UserSkill[];
}

const SKILL_CATEGORIES = [
  "Programming",
  "Design",
  "Marketing",
  "Business",
  "Language",
  "Music",
  "Arts",
  "Science",
  "Mathematics",
  "Other",
];

const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;

export default function EditProfilePage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
    avatar: "",
  });
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Skill search
  const [skillQuery, setSkillQuery] = useState("");
  const [skillResults, setSkillResults] = useState<Skill[]>([]);
  const [addingSkill, setAddingSkill] = useState<{
    skill: Skill | null;
    type: "TEACH" | "LEARN";
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
    newSkillName: string;
    newSkillCategory: string;
    showNew: boolean;
  }>({
    skill: null,
    type: "TEACH",
    level: "BEGINNER",
    newSkillName: "",
    newSkillCategory: "Programming",
    showNew: false,
  });

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/profile");
      const data = await res.json();
      setProfile(data);
      setForm({
        name: data.name ?? "",
        bio: data.bio ?? "",
        location: data.location ?? "",
        website: data.website ?? "",
        avatar: data.avatar ?? "",
      });
      setSkills(data.skills ?? []);
    }
    load();
  }, []);

  const searchSkills = useCallback(async (q: string) => {
    if (!q.trim()) { setSkillResults([]); return; }
    const res = await fetch(`/api/skills?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setSkillResults(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchSkills(skillQuery), 300);
    return () => clearTimeout(t);
  }, [skillQuery, searchSkills]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        skills: skills.map((s) => ({
          skillId: s.skillId,
          type: s.type,
          level: s.level,
        })),
      }),
    });

    setSaving(false);

    if (!res.ok) {
      setError("Failed to save profile");
      return;
    }

    setSaved(true);
    await update({ name: form.name, image: form.avatar });
    setTimeout(() => setSaved(false), 3000);
  }

  async function addSkill() {
    let skill = addingSkill.skill;

    if (!skill && addingSkill.showNew && addingSkill.newSkillName.trim()) {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addingSkill.newSkillName.trim(),
          category: addingSkill.newSkillCategory,
        }),
      });
      skill = await res.json();
    }

    if (!skill) return;

    const exists = skills.some(
      (s) => s.skillId === skill!.id && s.type === addingSkill.type
    );
    if (!exists) {
      setSkills((prev) => [
        ...prev,
        { skillId: skill!.id, type: addingSkill.type, level: addingSkill.level, skill: skill! },
      ]);
    }

    setAddingSkill((p) => ({
      ...p,
      skill: null,
      newSkillName: "",
      showNew: false,
    }));
    setSkillQuery("");
    setSkillResults([]);
  }

  function removeSkill(skillId: string, type: string) {
    setSkills((prev) => prev.filter((s) => !(s.skillId === skillId && s.type === type)));
  }

  if (!profile) {
    return (
      <div className="p-8 max-w-3xl mx-auto animate-pulse">
        <div className="bg-white rounded-2xl p-8 border border-slate-100 h-64" />
      </div>
    );
  }

  const teachSkills = skills.filter((s) => s.type === "TEACH");
  const learnSkills = skills.filter((s) => s.type === "LEARN");

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Edit Profile</h1>
        <p className="text-slate-500 mt-1">Update your information and skills</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}
      {saved && (
        <div className="bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">
          Profile saved successfully!
        </div>
      )}

      <form onSubmit={save} className="space-y-4">
        {/* Basic Info */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Basic Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full border border-slate-100 rounded-xl px-4 py-3 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Tell people about yourself, your experience, and what you're passionate about..."
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                placeholder="City, Country"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                placeholder="https://yoursite.com"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Avatar URL
            </label>
            <input
              type="url"
              value={form.avatar}
              onChange={(e) => setForm((p) => ({ ...p, avatar: e.target.value }))}
              placeholder="https://example.com/avatar.jpg"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Skills</h2>

          {/* Current Skills */}
          {teachSkills.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium text-slate-500 mb-2">Teaching</div>
              <div className="flex flex-wrap gap-2">
                {teachSkills.map((s) => (
                  <div key={`${s.skillId}-${s.type}`} className="flex items-center gap-1">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${skillLevelColor(s.level)}`}>
                      {s.skill.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSkill(s.skillId, s.type)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {learnSkills.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium text-slate-500 mb-2">Learning</div>
              <div className="flex flex-wrap gap-2">
                {learnSkills.map((s) => (
                  <div key={`${s.skillId}-${s.type}`} className="flex items-center gap-1">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                      {s.skill.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSkill(s.skillId, s.type)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Skill */}
          <div className="border border-dashed border-slate-200 rounded-xl p-4">
            <div className="text-sm font-medium text-slate-700 mb-3">Add a skill</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <select
                value={addingSkill.type}
                onChange={(e) =>
                  setAddingSkill((p) => ({ ...p, type: e.target.value as "TEACH" | "LEARN" }))
                }
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TEACH">I can teach</option>
                <option value="LEARN">I want to learn</option>
              </select>
              <select
                value={addingSkill.level}
                onChange={(e) =>
                  setAddingSkill((p) => ({
                    ...p,
                    level: e.target.value as typeof addingSkill.level,
                  }))
                }
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l.charAt(0) + l.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={skillQuery}
                  onChange={(e) => {
                    setSkillQuery(e.target.value);
                    setAddingSkill((p) => ({ ...p, skill: null, showNew: false }));
                  }}
                  placeholder="Search skills..."
                  className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Skill search results */}
            {skillResults.length > 0 && (
              <div className="bg-slate-50 rounded-xl border border-slate-100 mb-3 max-h-40 overflow-y-auto">
                {skillResults.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setAddingSkill((p) => ({ ...p, skill: s, showNew: false }));
                      setSkillQuery(s.name);
                      setSkillResults([]);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-white transition-colors flex items-center justify-between"
                  >
                    <span>{s.name}</span>
                    <span className="text-xs text-slate-400">{s.category}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Create new skill */}
            {!addingSkill.skill && skillQuery && skillResults.length === 0 && (
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => setAddingSkill((p) => ({ ...p, showNew: true }))}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  + Create &quot;{skillQuery}&quot; as a new skill
                </button>
                {addingSkill.showNew && (
                  <div className="mt-2">
                    <select
                      value={addingSkill.newSkillCategory}
                      onChange={(e) =>
                        setAddingSkill((p) => ({ ...p, newSkillCategory: e.target.value, newSkillName: skillQuery }))
                      }
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                    >
                      {SKILL_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={addSkill}
              disabled={!addingSkill.skill && !addingSkill.showNew}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Plus size={14} /> Add Skill
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
