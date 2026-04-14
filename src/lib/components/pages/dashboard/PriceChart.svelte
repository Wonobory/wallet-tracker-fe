<script lang="ts">
	import type { DataPoint } from '../../../../types/wealthDisplay';

	type Props = {
		hoveredIndex: number | null;
		hoveredData: DataPoint | null;
		data: DataPoint[];
		showBreakdown?: boolean;
		height?: number;
	};

	let {
		data,
		hoveredData,
		showBreakdown = false,
		height = 160,
		hoveredIndex = $bindable()
	}: Props = $props();

	const width = 600;
	const padX = 0;
	const padY = 8;

	const normalized = $derived(
		data.map((d) => ({
			total: Number.isFinite(d.totalValue) ? d.totalValue : 0,
			byreal: Number.isFinite(d.byrealValue) ? d.byrealValue : 0,
			raydium: Number.isFinite(d.raydiumValue) ? d.raydiumValue : 0,
			meteora: Number.isFinite(d.meteoraValue) ? d.meteoraValue : 0
		}))
	);

	const allValues = $derived(
		showBreakdown
			? normalized.flatMap((d) => [d.byreal, d.raydium, d.meteora])
			: normalized.map((d) => d.total)
	);

	const maxValue = $derived(allValues.length ? Math.max(...allValues) : 0);
	const minValue = $derived(allValues.length ? Math.min(...allValues) : 0);
	const valueRange = $derived(maxValue - minValue || 1);

	function xAt(i: number): number {
		return padX + (i / (data.length - 1 || 1)) * (width - 2 * padX);
	}

	function yAt(v: number): number {
		return height - padY - ((v - minValue) / valueRange) * (height - 2 * padY);
	}

	function toPolyline(values: number[]): string {
		return values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ');
	}

	function toArea(values: number[]): string {
		const line = values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ');
		const bl = `${xAt(values.length - 1)},${height}`;
		const br = `${xAt(0)},${height}`;
		return `${line} ${bl} ${br}`;
	}

	const pointsTotal = $derived(toPolyline(normalized.map((d) => d.total)));
	const areaTotal = $derived(toArea(normalized.map((d) => d.total)));
	const pointsByreal = $derived(toPolyline(normalized.map((d) => d.byreal)));
	const pointsRaydium = $derived(toPolyline(normalized.map((d) => d.raydium)));
	const pointsMeteora = $derived(toPolyline(normalized.map((d) => d.meteora)));

	const startValue = $derived(data[0]?.totalValue ?? 0);
	const endValue = $derived(data[data.length - 1]?.totalValue ?? 0);
	const isPositive = $derived(endValue >= startValue);

	const colorTotal = $derived(isPositive ? '#34d399' : '#f87171');
	const colorTotalDim = $derived(isPositive ? '#34d39930' : '#f8717130');

	const handleMouseMove = (event: MouseEvent) => {
		const svg = event.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		const scaledX = ((event.clientX - rect.left) / rect.width) * width;
		const relX = Math.max(0, Math.min(width - 2 * padX, scaledX - padX));
		hoveredIndex = Math.max(
			0,
			Math.min(data.length - 1, Math.round((relX / (width - 2 * padX)) * (data.length - 1)))
		);
	};

	const handleMouseLeave = () => {
		hoveredIndex = null;
	};

	const hx = $derived(hoveredIndex !== null ? xAt(hoveredIndex) : null);
</script>

<div class="w-full">
	<svg
		viewBox="0 0 {width} {height}"
		class="w-full cursor-crosshair overflow-visible"
		onmousemove={handleMouseMove}
		onmouseleave={handleMouseLeave}
		role="img"
		aria-label="Price history chart"
		preserveAspectRatio="none"
	>
		<defs>
			<linearGradient id="grad-total" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0%" stop-color={colorTotal} stop-opacity="0.18" />
				<stop offset="100%" stop-color={colorTotal} stop-opacity="0" />
			</linearGradient>
			<linearGradient id="grad-byreal" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0%" stop-color="#60a5fa" stop-opacity="0.18" />
				<stop offset="100%" stop-color="#60a5fa" stop-opacity="0" />
			</linearGradient>
			<linearGradient id="grad-raydium" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0%" stop-color="#2dd4bf" stop-opacity="0.18" />
				<stop offset="100%" stop-color="#2dd4bf" stop-opacity="0" />
			</linearGradient>
			<linearGradient id="grad-meteora" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0%" stop-color="#fbbf24" stop-opacity="0.18" />
				<stop offset="100%" stop-color="#fbbf24" stop-opacity="0" />
			</linearGradient>
		</defs>

		{#if data.length > 0}
			{#if showBreakdown}
				<polygon fill="url(#grad-byreal)" points={toArea(normalized.map((d) => d.byreal))} />
				<polyline fill="none" stroke="#60a5fa" stroke-width="1.5" points={pointsByreal} />
				<polygon fill="url(#grad-raydium)" points={toArea(normalized.map((d) => d.raydium))} />
				<polyline fill="none" stroke="#2dd4bf" stroke-width="1.5" points={pointsRaydium} />
				<polygon fill="url(#grad-meteora)" points={toArea(normalized.map((d) => d.meteora))} />
				<polyline fill="none" stroke="#fbbf24" stroke-width="1.5" points={pointsMeteora} />
			{:else}
				<polygon fill="url(#grad-total)" points={areaTotal} />
				<polyline fill="none" stroke={colorTotal} stroke-width="1.5" points={pointsTotal} />
			{/if}

			<!-- Hover crosshair -->
			{#if hx !== null && hoveredData}
				<line
					x1={hx} y1={padY}
					x2={hx} y2={height - padY}
					stroke="#ffffff20"
					stroke-width="1"
				/>
				{#if showBreakdown}
					<circle cx={hx} cy={yAt(hoveredData.byrealValue)} r="3.5" fill="#60a5fa" />
					<circle cx={hx} cy={yAt(hoveredData.raydiumValue)} r="3.5" fill="#2dd4bf" />
					<circle cx={hx} cy={yAt(hoveredData.meteoraValue)} r="3.5" fill="#fbbf24" />
				{:else}
					<circle cx={hx} cy={yAt(hoveredData.totalValue)} r="3.5" fill={colorTotal} />
				{/if}
			{/if}
		{/if}
	</svg>

	<!-- Hover date label -->
	<div class="mt-1 h-4 text-center">
		{#if hoveredData}
			<p class="text-xs text-zinc-500">
				{new Date(hoveredData.date).toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				})}
			</p>
		{/if}
	</div>
</div>
