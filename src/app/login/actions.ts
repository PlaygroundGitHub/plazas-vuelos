'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(password: string) {
    const SITE_PASSWORD = process.env.SITE_PASSWORD || 'vuelos2026'; // Fallback for local testing

    if (password === SITE_PASSWORD) {
        const cookieStore = await cookies();
        cookieStore.set('vuelos-session', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });
        return { success: true };
    }

    return { success: false, error: 'Contraseña incorrecta' };
}
