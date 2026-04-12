<script lang="ts">
	import type { AnalyticsResult } from '../../../../types/wealthDisplay';

	type Props = { analytics: AnalyticsResult | null; loading: boolean };
	let { analytics, loading }: Props = $props();

	function fmt(v: number, decimals = 2): string {
		return v.toFixed(decimals);
	}

	function fmtPct(v: number): string {
		return `${v >= 0 ? '+' : ''}${(v * 100).toFixed(2)}%`;
	}

	function fmtPctRaw(v: number): string {
		return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
	}

	type Metric = {
		label: string;
		value: string;
		sub?: string;
		positive?: boolean | null;
		tooltip: string;
	};

	const metrics = $derived<Metric[]>(
		analytics
			? [
					{
						label: 'Sharpe Ratio',
						value: fmt(analytics.sharpe),
						positive: analytics.sharpe > 1 ? true : analytics.sharpe < 0 ? false : null,
						tooltip: 'Rentabilidad por unidad de riesgo. >1 es bueno, >2 es excelente.'
					},
					{
						label: 'Sortino Ratio',
						value: fmt(analytics.sortino),
						positive: analytics.sortino > 1 ? true : analytics.sortino < 0 ? false : null,
						tooltip: 'Como Sharpe pero penaliza solo la volatilidad negativa.'
					},
					{
						label: 'Max Drawdown',
						value: fmtPct(analytics.maxDrawdownLp),
						sub: `SPYx ${fmtPct(analytics.maxDrawdownSpyx)}`,
						positive: analytics.maxDrawdownLp > analytics.maxDrawdownSpyx,
						tooltip: 'Peor caída desde máximos en el periodo.'
					},
					{
						label: 'Volatilidad',
						value: fmtPct(analytics.volatilityAnnualized),
						sub: 'anualizada',
						positive: null,
						tooltip: 'Desviación estándar de retornos, anualizada.'
					},
					{
						label: 'Beta vs SPYx',
						value: fmt(analytics.beta),
						positive: null,
						tooltip: 'Sensibilidad de la LP a los movimientos de SPYx. <1 = menos volátil.'
					},
					{
						label: 'Win Rate',
						value: `${(analytics.winRate * 100).toFixed(1)}%`,
						positive: analytics.winRate > 0.5,
						tooltip: '% de periodos donde la LP supera a holdear SPYx.'
					},
					{
						label: 'Alpha',
						value: fmtPct(analytics.alpha),
						positive: analytics.alpha > 0,
						tooltip: 'Exceso de retorno acumulado vs holdear SPYx.'
					},
					{
						label: 'Retorno LP',
						value: fmtPct(analytics.totalReturnLp),
						sub: `${fmtPct(analytics.annualizedReturnLp)} anualizado`,
						positive: analytics.totalReturnLp > 0,
						tooltip: 'Retorno total de la estrategia LP en el periodo.'
					},
					{
						label: 'Mejor día',
						value: fmtPctRaw(analytics.bestDayReturn * 100),
						positive: true,
						tooltip: 'Mejor día de la LP en el periodo seleccionado.'
					},
					{
						label: 'Peor día',
						value: fmtPctRaw(analytics.worstDayReturn * 100),
						positive: false,
						tooltip: 'Peor día de la LP en el periodo seleccionado.'
					}
				]
			: []
	);
</script>

<div class="transition-opacity duration-150" class:opacity-40={loading}>
	{#if !analytics}
		<div class="flex h-32 items-center justify-center">
			<p class="text-sm text-zinc-600">
				Se necesitan al menos 2 días de datos con precio SPYx para calcular métricas.
			</p>
		</div>
	{:else}
		<p class="mb-4 text-xs text-zinc-600">
			Basado en {Math.round(analytics.daysElapsed)} días de datos
		</p>
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{#each metrics as metric}
				<div
					class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
					title={metric.tooltip}
				>
					<p class="text-xs text-zinc-500">{metric.label}</p>
					<p
						class="mt-1 font-mono text-lg font-semibold tabular-nums {metric.positive === true
							? 'text-emerald-400'
							: metric.positive === false
								? 'text-red-400'
								: 'text-white'}"
					>
						{metric.value}
					</p>
					{#if metric.sub}
						<p class="mt-0.5 text-xs tabular-nums text-zinc-600">{metric.sub}</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
