"use client";

import { getInitials } from "@/lib/utils";

interface MapNode {
  id: string;
  name: string;
  avatar: string | null;
  teaches: string[];
  learns: string[];
}
interface MapEdge {
  from: string;
  to: string;
  skill: string;
}

// Lightweight node-link diagram: members on a circle, directed labeled edges
// "teacher → skill → learner". Pure SVG, no dependency.
export function SkillMapGraph({ nodes, edges }: { nodes: MapNode[]; edges: MapEdge[] }) {
  const size = 460;
  const cx = size / 2;
  const cy = size / 2;
  const radius = nodes.length <= 1 ? 0 : 170;

  const pos = new Map<string, { x: number; y: number }>();
  nodes.forEach((n, i) => {
    const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
    pos.set(n.id, {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  });

  if (nodes.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-8">
        No active members to map yet.
      </p>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[460px] mx-auto">
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#a5b4fc" />
          </marker>
        </defs>

        {edges.map((e, i) => {
          const a = pos.get(e.from);
          const b = pos.get(e.to);
          if (!a || !b) return null;
          // Shorten the line so it stops at the node circle edge.
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const r = 26;
          const x1 = a.x + (dx / len) * r;
          const y1 = a.y + (dy / len) * r;
          const x2 = b.x - (dx / len) * r;
          const y2 = b.y - (dy / len) * r;
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          return (
            <g key={i}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#c7d2fe"
                strokeWidth={1.5}
                markerEnd="url(#arrow)"
              />
              <text
                x={mx}
                y={my}
                textAnchor="middle"
                dy="-3"
                className="fill-indigo-500"
                style={{ fontSize: 9, fontWeight: 600 }}
              >
                {e.skill}
              </text>
            </g>
          );
        })}

        {nodes.map((n) => {
          const p = pos.get(n.id)!;
          return (
            <g key={n.id}>
              <circle cx={p.x} cy={p.y} r={24} fill="#eef2ff" stroke="#c7d2fe" strokeWidth={1.5} />
              <text
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dy="4"
                className="fill-indigo-700"
                style={{ fontSize: 13, fontWeight: 700 }}
              >
                {getInitials(n.name)}
              </text>
              <text
                x={p.x}
                y={p.y + 38}
                textAnchor="middle"
                className="fill-slate-600"
                style={{ fontSize: 10, fontWeight: 600 }}
              >
                {n.name.split(" ")[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
