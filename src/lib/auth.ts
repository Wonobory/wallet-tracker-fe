import { browser } from '$app/environment';

const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
	return browser ? localStorage.getItem(TOKEN_KEY) : null;
}

export function setToken(token: string): void {
	if (browser) localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
	if (browser) localStorage.removeItem(TOKEN_KEY);
}
