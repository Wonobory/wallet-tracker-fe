<script lang="ts">
	import { useWealthDisplayContext } from '../../../../services/wealth-display/context';
	import PriceChart from './PriceChart.svelte';
	import PerformanceChart from './PerformanceChart.svelte';
	import Analytics from './Analytics.svelte';

	const { service } = useWealthDisplayContext();
	let showBreakdown = $state(false);

	$effect(() => {
		service.chartState.selectedRange;
		service.fetchData();
	});

	function formatMult(v: number): string {
		return `${v >= 1 ? '+' : ''}${((v - 1) * 100).toFixed(2)}%`;
	}
</script>

<div class="space-y-4">
	<div class="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">

		<!-- Mode tabs -->
		<div class="mb-5 flex gap-1 rounded-lg bg-white/[0.04] p-1 w-fit">
			<button
				class="rounded-md px-4 py-1.5 text-xs font-medium transition-colors {service.viewMode === 'value'
					? 'bg-white/10 text-white'
					: 'text-zinc-500 hover:text-zinc-300'}"
				onclick={() => (service.viewMode = 'value')}
			>
				Value
			</button>
			<button
				class="rounded-md px-4 py-1.5 text-xs font-medium transition-colors {service.viewMode === 'performance'
					? 'bg-white/10 text-white'
					: 'text-zinc-500 hover:text-zinc-300'}"
				onclick={() => (service.viewMode = 'performance')}
			>
				vs HODL
			</button>
			<button
				class="rounded-md px-4 py-1.5 text-xs font-medium transition-colors {service.viewMode === 'analytics'
					? 'bg-white/10 text-white'
					: 'text-zinc-500 hover:text-zinc-300'}"
				onclick={() => (service.viewMode = 'analytics')}
			>
				Analytics
			</button>
		</div>

		<!-- Stats block — fixed min-height prevents layout jumps -->
		<div class="min-h-[96px]">
			{#if service.chartState.error}
				<p class="text-sm text-red-400">{service.chartState.error}</p>
			{:else if service.viewMode === 'analytics'}
				<Analytics analytics={service.analytics} loading={service.chartState.loading} />
			{:else if service.viewMode === 'value'}
				<!-- Value mode stats -->
				<div class="flex items-start justify-between">
					<div>
						<p class="text-xs font-medium uppercase tracking-widest text-zinc-500">Total Value</p>
						<p
							class="mt-1 font-mono text-4xl font-semibold tabular-nums text-white transition-opacity duration-150"
							class:opacity-40={service.chartState.loading}
						>
							${service.formattedCurrentValue}
						</p>
					</div>

					<div class="text-right">
						<span
							class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium tabular-nums transition-opacity duration-150 {service.isPositive
								? 'bg-emerald-500/10 text-emerald-400'
								: 'bg-red-500/10 text-red-400'}"
							class:opacity-40={service.chartState.loading}
						>
							{service.isPositive ? '▲' : '▼'}
							{Math.abs(service.changePercent).toFixed(2)}%
						</span>
						<p
							class="mt-1 text-right text-sm tabular-nums transition-opacity duration-150 {service.isPositive
								? 'text-emerald-400'
								: 'text-red-400'}"
							class:opacity-40={service.chartState.loading}
						>
							{service.isPositive ? '+' : '−'}${service.formattedNominalChange}
						</p>
					</div>
				</div>

				<div
					class="mt-4 flex gap-5 border-t border-white/[0.06] pt-4 transition-opacity duration-150"
					class:opacity-40={service.chartState.loading}
				>
					{#if service.byrealValue > 0}
						<div>
							<p class="text-xs text-zinc-500">Byreal</p>
							<p class="mt-0.5 font-mono text-sm font-medium tabular-nums text-blue-400">
								${service.formattedByrealValue}
							</p>
						</div>
					{/if}
					{#if service.raydiumValue > 0}
						<div>
							<p class="text-xs text-zinc-500">Raydium</p>
							<p class="mt-0.5 font-mono text-sm font-medium tabular-nums text-teal-400">
								${service.formattedRaydiumValue}
							</p>
						</div>
					{/if}
					{#if service.meteoraValue > 0}
						<div>
							<p class="text-xs text-zinc-500">Meteora</p>
							<p class="mt-0.5 font-mono text-sm font-medium tabular-nums text-amber-400">
								${service.formattedMeteoraValue}
							</p>
						</div>
					{/if}
					{#if service.walletValue > 0}
						<div>
							<p class="text-xs text-zinc-500">Wallet</p>
							<p class="mt-0.5 font-mono text-sm font-medium tabular-nums text-violet-400">
								${service.formattedWalletValue}
							</p>
						</div>
					{/if}
				</div>

			{:else}
				<!-- Performance mode stats -->
				<div class="flex items-start justify-between">
					<div>
						<p class="text-xs font-medium uppercase tracking-widest text-zinc-500">LP Strategy</p>
						<p
							class="mt-1 font-mono text-4xl font-semibold tabular-nums transition-opacity duration-150 {service.lpIsOutperforming
								? 'text-emerald-400'
								: 'text-red-400'}"
							class:opacity-40={service.chartState.loading}
						>
							{formatMult(service.lpPerf)}
						</p>
					</div>

					<div class="text-right">
						<p class="text-xs text-zinc-500">SPYx HODL</p>
						<p
							class="mt-1 font-mono text-2xl font-semibold tabular-nums text-zinc-400 transition-opacity duration-150"
							class:opacity-40={service.chartState.loading}
						>
							{formatMult(service.spyxPerf)}
						</p>
					</div>
				</div>

				<div
					class="mt-4 border-t border-white/[0.06] pt-4 transition-opacity duration-150"
					class:opacity-40={service.chartState.loading}
				>
					<p class="text-xs text-zinc-500">LP vs HODL</p>
					<p
						class="mt-0.5 font-mono text-sm font-medium tabular-nums {service.lpIsOutperforming
							? 'text-emerald-400'
							: 'text-red-400'}"
					>
						{service.lpIsOutperforming ? '+' : ''}{((service.lpVsSpyx) * 100).toFixed(2)}pp
						{service.lpIsOutperforming ? 'outperforming' : 'underperforming'}
					</p>
				</div>
			{/if}
		</div>

		<!-- Chart area -->
		<div
			class="mt-6 transition-opacity duration-150"
			class:opacity-40={service.chartState.loading}
			class:hidden={service.viewMode === 'analytics'}
		>
			{#if service.viewMode === 'value'}
				{#if service.chartState.data && service.chartState.data.length > 0}
					<PriceChart
						data={service.chartState.data}
						bind:hoveredIndex={service.hoveredIndex}
						hoveredData={service.hoveredDataPoint}
						{showBreakdown}
					/>
				{:else if !service.chartState.loading}
					<div class="flex h-[160px] items-center justify-center">
						<p class="text-sm text-zinc-600">No data for this range</p>
					</div>
				{:else}
					<div class="h-[160px]"></div>
				{/if}
			{:else}
				{#if service.perfData && service.perfData.length > 0}
					<PerformanceChart
						data={service.perfData}
						bind:hoveredIndex={service.hoveredIndex}
						hoveredData={service.hoveredPerfPoint}
					/>
				{:else if !service.chartState.loading}
					<div class="flex h-[160px] items-center justify-center">
						<p class="text-sm text-zinc-600">
							{service.chartState.data ? 'Need SPYx price data to compare' : 'No data for this range'}
						</p>
					</div>
				{:else}
					<div class="h-[160px]"></div>
				{/if}
			{/if}
		</div>

		<!-- Controls row -->
		<div class="mt-4 flex items-center justify-between">
			<div class="flex gap-1">
				{#each service.timeRanges as { label, value }}
					<button
						class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors {service.chartState.selectedRange === value
							? 'bg-white text-black'
							: 'text-zinc-400 hover:text-white'}"
						onclick={() => (service.chartState.selectedRange = value)}
						disabled={service.chartState.loading}
					>
						{label}
					</button>
				{/each}
			</div>

			{#if service.viewMode === 'value'}
				<label class="flex cursor-pointer items-center gap-2 text-xs text-zinc-500 select-none">
					<span>Breakdown</span>
					<button
						role="switch"
						aria-checked={showBreakdown}
						aria-label="Toggle breakdown view"
						onclick={() => (showBreakdown = !showBreakdown)}
						class="relative h-5 w-9 rounded-full transition-colors duration-200 focus:outline-none {showBreakdown
							? 'bg-blue-500'
							: 'bg-zinc-700'}"
					>
						<span
							class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
							class:translate-x-4={showBreakdown}
						></span>
					</button>
				</label>
			{/if}
		</div>
	</div>
</div>
