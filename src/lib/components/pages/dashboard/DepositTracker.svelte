<script lang="ts">
	import { useWealthDisplayContext } from '../../../../services/wealth-display/context';
	import type { Deposit } from '../../../../types/wealthDisplay';

	const { service } = useWealthDisplayContext();

	let showForm = $state(false);
	let saving = $state(false);
	let formError = $state<string | null>(null);

	// Form state
	let protocol = $state<'byreal' | 'meteora' | 'wallet'>('meteora');
	let poolName = $state('');
	let depositDate = $state(new Date().toISOString().slice(0, 16));
	let notes = $state('');
	let tokenASymbol = $state('');
	let tokenAMint = $state('');
	let tokenAAmount = $state('');
	let tokenAPrice = $state('');
	let tokenBSymbol = $state('');
	let tokenBMint = $state('');
	let tokenBAmount = $state('');
	let tokenBPrice = $state('');
	let fetchingPriceA = $state(false);
	let fetchingPriceB = $state(false);

	const hasTokenB = $derived(protocol !== 'wallet');

	const totalValue = $derived(() => {
		const a = Number(tokenAAmount || 0) * Number(tokenAPrice || 0);
		const b = hasTokenB ? Number(tokenBAmount || 0) * Number(tokenBPrice || 0) : 0;
		return a + b;
	});

	async function autoFetchPrice(token: 'A' | 'B') {
		const mint = token === 'A' ? tokenAMint : tokenBMint;
		if (!mint || mint.length < 32) return;
		if (token === 'A') fetchingPriceA = true;
		else fetchingPriceB = true;
		const price = await service.fetchTokenPrice(mint);
		if (token === 'A') {
			if (price > 0) tokenAPrice = price.toString();
			fetchingPriceA = false;
		} else {
			if (price > 0) tokenBPrice = price.toString();
			fetchingPriceB = false;
		}
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		formError = null;
		saving = true;

		const body: Record<string, unknown> = {
			walletAddress: service.walletAddress ?? '',
			timestamp: new Date(depositDate).toISOString(),
			protocol,
			poolName,
			notes: notes || undefined,
			totalValueUsd: totalValue(),
			tokenA: {
				mint: tokenAMint,
				symbol: tokenASymbol,
				amount: Number(tokenAAmount),
				entryPriceUsd: Number(tokenAPrice)
			}
		};

		if (hasTokenB && tokenBMint) {
			body.tokenB = {
				mint: tokenBMint,
				symbol: tokenBSymbol,
				amount: Number(tokenBAmount),
				entryPriceUsd: Number(tokenBPrice)
			};
		}

		const ok = await service.createDeposit(body);
		saving = false;
		if (ok) {
			showForm = false;
			resetForm();
		} else {
			formError = 'Error al guardar el depósito';
		}
	}

	function resetForm() {
		protocol = 'meteora';
		poolName = '';
		depositDate = new Date().toISOString().slice(0, 16);
		notes = '';
		tokenASymbol = '';
		tokenAMint = '';
		tokenAAmount = '';
		tokenAPrice = '';
		tokenBSymbol = '';
		tokenBMint = '';
		tokenBAmount = '';
		tokenBPrice = '';
	}

	function formatUsd(v: number) {
		return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	function formatPct(v: number) {
		return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
	}

	function protocolLabel(p: Deposit['protocol']) {
		return p === 'byreal' ? 'Byreal' : p === 'meteora' ? 'Meteora' : 'Wallet';
	}
</script>

<div>
	<!-- Header -->
	<div class="mb-4 flex items-center justify-between">
		<p class="text-xs font-medium uppercase tracking-widest text-zinc-500">Posiciones registradas</p>
		<button
			onclick={() => {
				showForm = !showForm;
				formError = null;
			}}
			class="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10"
		>
			{showForm ? 'Cancelar' : '+ Añadir depósito'}
		</button>
	</div>

	<!-- Add form -->
	{#if showForm}
		<form
			onsubmit={handleSubmit}
			class="mb-6 space-y-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
		>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="block text-xs text-zinc-500 mb-1">Protocolo</label>
					<select
						bind:value={protocol}
						class="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-white/20"
					>
						<option value="meteora">Meteora</option>
						<option value="byreal">Byreal</option>
						<option value="wallet">Wallet</option>
					</select>
				</div>
				<div>
					<label class="block text-xs text-zinc-500 mb-1">Nombre del pool</label>
					<input
						type="text"
						bind:value={poolName}
						placeholder="QQQx/SPYx"
						required
						class="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20"
					/>
				</div>
			</div>

			<div>
				<label class="block text-xs text-zinc-500 mb-1">Fecha de entrada</label>
				<input
					type="datetime-local"
					bind:value={depositDate}
					required
					class="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-white/20"
				/>
			</div>

			<!-- Token A -->
			<div class="space-y-2">
				<p class="text-xs font-medium text-zinc-400">Token {hasTokenB ? 'A' : ''}</p>
				<div class="grid grid-cols-2 gap-2">
					<input
						type="text"
						bind:value={tokenASymbol}
						placeholder="Símbolo (ej. SPYx)"
						required
						class="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20"
					/>
					<div class="flex gap-1">
						<input
							type="text"
							bind:value={tokenAMint}
							onblur={() => autoFetchPrice('A')}
							placeholder="Mint address"
							required
							class="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20"
						/>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-2">
					<input
						type="number"
						bind:value={tokenAAmount}
						placeholder="Cantidad"
						min="0"
						step="any"
						required
						class="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20"
					/>
					<div class="relative">
						<input
							type="number"
							bind:value={tokenAPrice}
							placeholder="Precio USD entrada"
							min="0"
							step="any"
							required
							class="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20"
						/>
						{#if fetchingPriceA}
							<span class="absolute right-2 top-2 text-xs text-zinc-500">...</span>
						{/if}
					</div>
				</div>
			</div>

			<!-- Token B -->
			{#if hasTokenB}
				<div class="space-y-2">
					<p class="text-xs font-medium text-zinc-400">Token B</p>
					<div class="grid grid-cols-2 gap-2">
						<input
							type="text"
							bind:value={tokenBSymbol}
							placeholder="Símbolo (ej. QQQx)"
							class="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20"
						/>
						<input
							type="text"
							bind:value={tokenBMint}
							onblur={() => autoFetchPrice('B')}
							placeholder="Mint address"
							class="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20"
						/>
					</div>
					<div class="grid grid-cols-2 gap-2">
						<input
							type="number"
							bind:value={tokenBAmount}
							placeholder="Cantidad"
							min="0"
							step="any"
							class="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20"
						/>
						<div class="relative">
							<input
								type="number"
								bind:value={tokenBPrice}
								placeholder="Precio USD entrada"
								min="0"
								step="any"
								class="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20"
							/>
							{#if fetchingPriceB}
								<span class="absolute right-2 top-2 text-xs text-zinc-500">...</span>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<div>
				<label class="block text-xs text-zinc-500 mb-1">Notas (opcional)</label>
				<input
					type="text"
					bind:value={notes}
					placeholder="Ej. entrada inicial, rebalanceo..."
					class="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-white/20"
				/>
			</div>

			{#if totalValue() > 0}
				<p class="text-xs text-zinc-500">
					Valor total de entrada: <span class="font-mono text-white">${formatUsd(totalValue())}</span>
				</p>
			{/if}

			{#if formError}
				<p class="text-xs text-red-400">{formError}</p>
			{/if}

			<button
				type="submit"
				disabled={saving}
				class="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
			>
				{saving ? 'Guardando…' : 'Guardar depósito'}
			</button>
		</form>
	{/if}

	<!-- Deposits list -->
	{#if service.depositsLoading}
		<p class="text-sm text-zinc-600">Cargando...</p>
	{:else if service.deposits.length === 0}
		<p class="text-sm text-zinc-600">No hay depósitos registrados.</p>
	{:else}
		<div class="space-y-3">
			{#each service.deposits as deposit (deposit._id)}
				{@const lpReturn = deposit.totalValueUsd > 0 ? (deposit.hodlValueUsd - deposit.totalValueUsd) / deposit.totalValueUsd * 100 : 0}
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
					<div class="flex items-start justify-between">
						<div>
							<div class="flex items-center gap-2">
								<span class="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-zinc-400">
									{protocolLabel(deposit.protocol)}
								</span>
								<span class="text-sm font-medium text-white">{deposit.poolName}</span>
							</div>
							<p class="mt-1 text-xs text-zinc-500">
								Entrada: {new Date(deposit.timestamp).toLocaleDateString('es-ES', {
									day: 'numeric',
									month: 'short',
									year: 'numeric'
								})}
								·
								<span class="font-mono text-zinc-400">${formatUsd(deposit.totalValueUsd)}</span>
							</p>
						</div>
						<button
							onclick={() => service.deleteDeposit(deposit._id)}
							class="text-zinc-600 transition-colors hover:text-red-400"
							aria-label="Eliminar"
						>
							×
						</button>
					</div>

					<div class="mt-3 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3">
						<div>
							<p class="text-xs text-zinc-500">HODL value ahora</p>
							<p class="mt-0.5 font-mono text-sm font-medium tabular-nums text-white">
								${formatUsd(deposit.hodlValueUsd)}
							</p>
							<p
								class="text-xs tabular-nums {deposit.hodlReturnPct >= 0
									? 'text-emerald-400'
									: 'text-red-400'}"
							>
								{formatPct(deposit.hodlReturnPct)}
							</p>
						</div>
						<div>
							<p class="text-xs text-zinc-500">Tokens entrada</p>
							<p class="mt-0.5 text-xs text-zinc-400">
								{deposit.tokenA.amount.toLocaleString()} {deposit.tokenA.symbol}
								@ ${deposit.tokenA.entryPriceUsd.toFixed(4)}
							</p>
							{#if deposit.tokenB}
								<p class="text-xs text-zinc-400">
									{deposit.tokenB.amount.toLocaleString()} {deposit.tokenB.symbol}
									@ ${deposit.tokenB.entryPriceUsd.toFixed(4)}
								</p>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
