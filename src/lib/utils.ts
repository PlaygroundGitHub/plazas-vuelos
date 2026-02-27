import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, intervalToDuration } from "date-fns";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDuration(duration: string) {
    // Amadeus returns duration in PTnHnMn format (ISO 8601)
    // Simple regex parser
    const match = duration.match(/PT(\d+H)?(\d+M)?/);
    if (!match) return duration;

    const hours = match[1] ? match[1].replace('H', '') + 'h ' : '';
    const minutes = match[2] ? match[2].replace('M', '') + 'm' : '';

    return (hours + minutes).trim();
}

export function formatDateTime(dateStr: string) {
    return format(parseISO(dateStr), 'MMM d, yyyy HH:mm');
}
