import { SvelteDate, SvelteURLSearchParams } from 'svelte/reactivity';
import type {
	AvailableTimeRanges,
	ChartState,
	DataPoint,
	PerfPoint,
	AnalyticsResult,
	Deposit,
	PriceAdjustment
} from '../../types/wealthDisplay';
import { getToken, clearToken } from '$lib/auth';
import { computeAnalytics } from '$lib/analytics';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class WealthDisplayService {
	walletAddress: string | null = null;

	chartState = $state<ChartState>({
		data: null,
		loading: false,
		error: null,
		selectedRange: '1yr'
	});

	viewMode = $state<'value' | 'performance' | 'analytics'>('value');

	timeRanges: AvailableTimeRanges[] = [
		{ label: 'Today', value: 'today' },
		{ label: '7D', value: '7d' },
		{ label: '30D', value: '30d' },
		{ label: '6M', value: '6M' },
		{ label: '1Y', value: '1yr' }
	];

	hoveredIndex = $state<number | null>(null);
	hoveredDataPoint = $derived(
		this.hoveredIndex !== null ? this.chartState.data![this.hoveredIndex] : null
	);

	// --- Value mode ---

	currentValue = $derived(
		this.hoveredDataPoint?.totalValue ?? this.chartState.data?.at(-1)?.totalValue ?? 0
	);
	byrealValue = $derived(
		this.hoveredDataPoint?.byrealValue ?? this.chartState.data?.at(-1)?.byrealValue ?? 0
	);
	raydiumValue = $derived(
		this.hoveredDataPoint?.raydiumValue ?? this.chartState.data?.at(-1)?.raydiumValue ?? 0
	);
	meteoraValue = $derived(
		this.hoveredDataPoint?.meteoraValue ?? this.chartState.data?.at(-1)?.meteoraValue ?? 0
	);
	walletValue = $derived(
		this.hoveredDataPoint?.walletValue ?? this.chartState.data?.at(-1)?.walletValue ?? 0
	);
	lighterValue = $derived(
		this.hoveredDataPoint?.lighterValue ?? this.chartState.data?.at(-1)?.lighterValue ?? 0
	);
	startValue = $derived(this.chartState.data?.[0]?.totalValue ?? 0);
	changePercent = $derived(
		this.startValue ? ((this.currentValue - this.startValue) / this.startValue) * 100 : 0
	);
	nominalChange = $derived(this.currentValue - this.startValue);
	isPositive = $derived(this.changePercent >= 0);

	// --- Performance mode ---

	perfData = $derived(buildPerfData(this.chartState.data, this.priceAdjustments));

	hoveredPerfPoint = $derived(
		this.hoveredIndex !== null ? (this.perfData?.[this.hoveredIndex] ?? null) : null
	);

	lpPerf = $derived(this.hoveredPerfPoint?.lp ?? this.perfData?.at(-1)?.lp ?? 1);
	spyxPerf = $derived(this.hoveredPerfPoint?.spyx ?? this.perfData?.at(-1)?.spyx ?? 1);
	lpVsSpyx = $derived(this.lpPerf - this.spyxPerf);
	lpIsOutperforming = $derived(this.lpVsSpyx >= 0);

	// --- Analytics ---

	analytics = $derived<AnalyticsResult | null>(
		this.perfData ? computeAnalytics(this.perfData) : null
	);

	// --- Deposits ---

	deposits = $state<Deposit[]>([]);
	depositsLoading = $state(false);
	depositsError = $state<string | null>(null);

	// --- Price adjustments (dividends/rebases) ---

	priceAdjustments = $state<PriceAdjustment[]>([]);

	// --- Formatting ---

	formattedCurrentValue = $derived(formatUsd(this.currentValue));
	formattedByrealValue = $derived(formatUsd(this.byrealValue));
	formattedRaydiumValue = $derived(formatUsd(this.raydiumValue));
	formattedMeteoraValue = $derived(formatUsd(this.meteoraValue));
	formattedWalletValue = $derived(formatUsd(this.walletValue));
	formattedLighterValue = $derived(formatUsd(this.lighterValue));
	formattedNominalChange = $derived(formatUsd(Math.abs(this.nominalChange)));

	private authHeaders(): HeadersInit {
		const token = getToken();
		return token ? { Authorization: `Bearer ${token}` } : {};
	}

	public async fetchData() {
		this.chartState.loading = true;
		this.chartState.error = null;

		try {
			const params = new SvelteURLSearchParams({ timeRange: this.chartState.selectedRange });
			if (this.walletAddress) params.set('walletAddress', this.walletAddress);

			const response = await fetch(`${API_BASE_URL}/api/prices?${params.toString()}`, {
				headers: this.authHeaders()
			});

			if (response.status === 401) {
				clearToken();
				window.location.reload();
				return;
			}

			if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText}`);

			const json = await response.json();
			const points = json?.data?.points ?? [];

			let fetchedData: DataPoint[] = points.map((p: Record<string, unknown>) => ({
				date: new SvelteDate(p.timestamp as string).toISOString(),
				totalValue: Number(p.totalValue ?? 0),
				byrealValue: Number(p.byrealValue ?? 0),
				raydiumValue: Number(p.raydiumValue ?? 0),
				meteoraValue: Number(p.meteoraValue ?? 0),
				walletValue: Number(p.walletValue ?? 0),
				lighterValue: Number(p.lighterValue ?? 0),
				spyxPrice: Number(p.spyxPrice ?? 0)
			}));

			if (fetchedData.length > 400) {
				const step = Math.ceil(fetchedData.length / 400);
				fetchedData = fetchedData.filter((_, i) => i % step === 0 || i === fetchedData.length - 1);
			}

			this.chartState.data = fetchedData;
		} catch (e) {
			this.chartState.error = e instanceof Error ? e.message : 'Error fetching data';
			console.error('Prices API error:', e);
		} finally {
			this.chartState.loading = false;
		}
	}

	public async fetchPriceAdjustments() {
		try {
			const response = await fetch(`${API_BASE_URL}/api/price-adjustments`, {
				headers: this.authHeaders()
			});
			if (!response.ok) return;
			const json = await response.json();
			this.priceAdjustments = json?.data?.adjustments ?? [];
		} catch {
			// non-critical, silently ignore
		}
	}

	public async fetchDeposits() {
		this.depositsLoading = true;
		this.depositsError = null;
		try {
			const params = this.walletAddress ? `?walletAddress=${this.walletAddress}` : '';
			const response = await fetch(`${API_BASE_URL}/api/deposits${params}`, {
				headers: this.authHeaders()
			});
			if (!response.ok) throw new Error(`API error: ${response.status}`);
			const json = await response.json();
			this.deposits = json?.data?.deposits ?? [];
		} catch (e) {
			this.depositsError = e instanceof Error ? e.message : 'Error fetching deposits';
		} finally {
			this.depositsLoading = false;
		}
	}

	public async createDeposit(body: object): Promise<boolean> {
		try {
			const response = await fetch(`${API_BASE_URL}/api/deposits`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
				body: JSON.stringify(body)
			});
			if (!response.ok) return false;
			await this.fetchDeposits();
			return true;
		} catch {
			return false;
		}
	}

	public async deleteDeposit(id: string): Promise<boolean> {
		try {
			const response = await fetch(`${API_BASE_URL}/api/deposits/${id}`, {
				method: 'DELETE',
				headers: this.authHeaders()
			});
			if (!response.ok) return false;
			this.deposits = this.deposits.filter((d) => d._id !== id);
			return true;
		} catch {
			return false;
		}
	}

	public async fetchTokenPrice(mint: string): Promise<number> {
		try {
			const response = await fetch(`${API_BASE_URL}/api/token-price?mint=${mint}`, {
				headers: this.authHeaders()
			});
			if (!response.ok) return 0;
			const json = await response.json();
			return Number(json?.data?.price ?? 0);
		} catch {
			return 0;
		}
	}

	public setWalletAddress(walletAddress: string | null) {
		this.walletAddress = walletAddress;
		this.chartState.data = null;
	}
}

function buildPerfData(
	data: DataPoint[] | null,
	adjustments: PriceAdjustment[]
): PerfPoint[] | null {
	if (!data || data.length === 0) return null;
	const valid = data.filter((d) => d.spyxPrice > 0 && d.totalValue > 0);
	if (valid.length < 2) return null;

	// Build sorted list of adjustments within the data range
	const rangeStart = new Date(valid[0]!.date).getTime();
	const rangeEnd = new Date(valid[valid.length - 1]!.date).getTime();

	const relevantAdj = adjustments
		.filter((a) => {
			const t = new Date(a.timestamp).getTime();
			return t >= rangeStart && t <= rangeEnd;
		})
		.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

	const baseLp = valid[0]!.totalValue;
	const baseSpyx = valid[0]!.spyxPrice;

	// For each data point, compute cumulative adjustment factor for all
	// dividends that occurred AFTER this point's timestamp.
	// (We apply factors forward: after a dividend, subsequent raw prices
	//  are multiplied by the factor to get the "total return" adjusted price.)
	const totalCumulativeFactor = relevantAdj.reduce((acc, a) => acc * a.factor, 1);

	return valid.map((d) => {
		const pointMs = new Date(d.date).getTime();

		// Cumulative factor from adjustments that happened AFTER this point
		const remainingFactor = relevantAdj
			.filter((a) => new Date(a.timestamp).getTime() > pointMs)
			.reduce((acc, a) => acc * a.factor, 1);

		// Adjusted price = raw price × factor for future adjustments
		// This makes the series continuous (no drops at dividend dates)
		const adjustedSpyxPrice = d.spyxPrice * remainingFactor;
		const adjustedBaseSpyx = baseSpyx * totalCumulativeFactor;

		return {
			date: d.date,
			lp: d.totalValue / baseLp,
			spyx: adjustedSpyxPrice / adjustedBaseSpyx
		};
	});
}

function formatUsd(value: number): string {
	return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
