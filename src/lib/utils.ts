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
    if (!dateStr) return '';
    // Use parseISO but format in a way that doesn't shift timezone if possible, 
    // or just return the parts we need from the string directly to be safe.
    try {
        const date = parseISO(dateStr);
        return format(date, 'MMM d, yyyy HH:mm');
    } catch (e) {
        return dateStr;
    }
}

/**
 * Extracts time (HH:mm) directly from an ISO string (YYYY-MM-DDTHH:mm:ss)
 * to avoid any timezone conversion shifts in the browser.
 */
export function formatLocalTime(isoStr: string) {
    if (!isoStr || !isoStr.includes('T')) return isoStr;
    return isoStr.split('T')[1].substring(0, 5);
}
