import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatScore(score: number): string {
	return `${(score * 100).toFixed(1)}%`;
}

export function getScoreColor(score: number): string {
	if (score >= 0.8) return "text-green-600";
	if (score >= 0.6) return "text-blue-600";
	if (score >= 0.4) return "text-yellow-600";
	return "text-orange-600";
}

export function getScoreBgColor(score: number): string {
	if (score >= 0.8) return "bg-green-100";
	if (score >= 0.6) return "bg-blue-100";
	if (score >= 0.4) return "bg-yellow-100";
	return "bg-orange-100";
}
