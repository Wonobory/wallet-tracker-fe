<script lang="ts">
	const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

	type Props = { onLogin: (token: string) => void };
	let { onLogin }: Props = $props();

	let username = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = null;
		loading = true;

		try {
			const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});

			if (res.status === 401) {
				error = 'Usuario o contraseña incorrectos';
				return;
			}

			if (!res.ok) {
				error = `Error del servidor (${res.status})`;
				return;
			}

			const { token } = await res.json();
			onLogin(token);
		} catch {
			error = 'No se pudo conectar con el servidor';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-[#0d0d0f] px-4">
	<div class="w-full max-w-sm">
		<div class="mb-8 text-center">
			<p class="text-xs font-medium uppercase tracking-widest text-zinc-500">Portfolio</p>
			<h1 class="mt-1 text-2xl font-semibold text-white">Wealth Tracker</h1>
		</div>

		<form
			onsubmit={handleSubmit}
			class="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 space-y-4"
		>
			<div>
				<label for="username" class="block text-xs font-medium text-zinc-500 mb-1.5">
					Usuario
				</label>
				<input
					id="username"
					type="text"
					bind:value={username}
					autocomplete="username"
					class="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20 focus:ring-0 transition-colors"
					placeholder="admin"
					disabled={loading}
				/>
			</div>

			<div>
				<label for="password" class="block text-xs font-medium text-zinc-500 mb-1.5">
					Contraseña
				</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					autocomplete="current-password"
					class="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20 focus:ring-0 transition-colors"
					placeholder="••••••••"
					disabled={loading}
				/>
			</div>

			{#if error}
				<p class="text-xs text-red-400">{error}</p>
			{/if}

			<button
				type="submit"
				disabled={loading || !username || !password}
				class="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
			>
				{loading ? 'Entrando…' : 'Entrar'}
			</button>
		</form>
	</div>
</div>
