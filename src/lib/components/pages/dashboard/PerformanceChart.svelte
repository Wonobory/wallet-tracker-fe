<script lang="ts">
	import type { PerfPoint } from '../../../../types/wealthDisplay';

	type Props = {
		data: PerfPoint[];
		hoveredIndex: number | null;
		hoveredData: PerfPoint | null;
		height?: number;
	};

	let { data, hoveredData, height = 160, hoveredIndex = $bindable() }: Props = $props();

	const width = 600;
	const padX = 0;
	const padY = 8;

	const allValues = $derived(data.flatMap((d) => [d.lp, d.spyx]));
	const maxValue = $derived(allValues.length ? Math.max(...allValues) : 1);
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
		const baseline = yAt(1); // normalized baseline at 1×
		return (
			values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ') +
			` ${xAt(values.length - 1)},${baseline} ${xAt(0)},${baseline}`
		);
	}

	const pointsLp = $derived(toPolyline(data.map((d) => d.lp)));
	const pointsSpyx = $derived(toPolyline(data.map((d) => d.spyx)));

	const lastLp = $derived(data.at(-1)?.lp ?? 1);
	const lpIsAhead = $derived(lastLp >= (data.at(-1)?.spyx ?? 1));
	const colorLp = $derived(lpIsAhead ? '#34d399' : '#f87171');

	// Y-axis ticks: show 4 ticks including 1× baseline
	const yTicks = $derived.by(() => {
		const count = 4;
		return Array.from({ length: count + 1 }, (_, i) => {
			const v = minValue + (valueRange * i) / count;
			return { v, y: yAt(v) };
		});
	});

	// Baseline at 1×
	const baselineY = $derived(yAt(1));
	const baselineVisible = $derived(baselineY >= padY && baselineY <= height - padY);

	const hx = $derived(hoveredIndex !== null ? xAt(hoveredIndex) : null);

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
</script>

<div class="w-full">
	<!-- Legend -->
	<div class="mb-3 flex items-center gap-4 text-xs">
		<span class="flex items-center gap-1.5">
			<span class="h-2 w-3 rounded-full {lpIsAhead ? 'bg-emerald-400' : 'bg-red-400'}"></span>
			<span class="text-zinc-400">LP Strategy</span>
		</span>
		<span class="flex items-center gap-1.5">
			<span class="h-[1px] w-3 bg-zinc-500" style="border-top: 1px dashed #71717a"></span>
			<span class="text-zinc-400">SPYx HODL</span>
		</span>
	</div>

	<svg
		viewBox="0 0 {width} {height}"
		class="w-full cursor-crosshair overflow-visible"
		onmousemove={handleMouseMove}
		onmouseleave={handleMouseLeave}
		role="img"
		aria-label="Performance comparison chart"
		preserveAspectRatio="none"
	>
		<defs>
			<linearGradient id="grad-lp-perf" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0%" stop-color={colorLp} stop-opacity="0.15" />
				<stop offset="100%" stop-color={colorLp} stop-opacity="0" />
			</linearGradient>
		</defs>

		{#if data.length > 0}
			<!-- Baseline at 1× -->
			{#if baselineVisible}
				<line
					x1={padX} y1={baselineY}
					x2={width - padX} y2={baselineY}
					stroke="#3f3f46"
					stroke-width="1"
					stroke-dasharray="4,4"
				/>
			{/if}

			<!-- LP area + line -->
			<polygon fill="url(#grad-lp-perf)" points={toArea(data.map((d) => d.lp))} />
			<polyline fill="none" stroke={colorLp} stroke-width="1.5" points={pointsLp} />

			<!-- SPYx HODL line -->
			<polyline fill="none" stroke="#52525b" stroke-width="1.5" stroke-dasharray="5,4" points={pointsSpyx} />

			<!-- Hover -->
			{#if hx !== null && hoveredData}
				<line
					x1={hx} y1={padY}
					x2={hx} y2={height - padY}
					stroke="#ffffff18"
					stroke-width="1"
				/>
				<circle cx={hx} cy={yAt(hoveredData.lp)} r="3.5" fill={colorLp} />
				<circle cx={hx} cy={yAt(hoveredData.spyx)} r="3.5" fill="#71717a" />
			{/if}
		{/if}
	</svg>

	<!-- Hover date -->
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
