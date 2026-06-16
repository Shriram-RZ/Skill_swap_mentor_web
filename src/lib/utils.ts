import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDate(date: Date | string) {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function skillLevelColor(level: string) {
  const colors: Record<string, string> = {
    BEGINNER: "bg-green-100 text-green-800",
    INTERMEDIATE: "bg-blue-100 text-blue-800",
    ADVANCED: "bg-purple-100 text-purple-800",
    EXPERT: "bg-red-100 text-red-800",
  };
  return colors[level] ?? "bg-gray-100 text-gray-800";
}

export function resourceTypeColor(type: string) {
  const colors: Record<string, string> = {
    NOTE: "bg-amber-100 text-amber-800",
    PDF: "bg-red-100 text-red-800",
    VIDEO: "bg-purple-100 text-purple-800",
    ASSIGNMENT: "bg-blue-100 text-blue-800",
  };
  return colors[type] ?? "bg-gray-100 text-gray-800";
}

export function requestStatusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ACCEPTED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    COMPLETED: "bg-blue-100 text-blue-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-800";
}
