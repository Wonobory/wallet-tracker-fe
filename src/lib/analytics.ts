import type { PerfPoint, AnalyticsResult } from '../types/wealthDisplay';

function mean(arr: number[]): number {
	if (arr.length === 0) return 0;
	return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[]): number {
	if (arr.length < 2) return 0;
	const m = mean(arr);
	return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
}

function maxDrawdown(values: number[]): number {
	let peak = values[0] ?? 1;
	let maxDD = 0;
	for (const v of values) {
		if (v > peak) peak = v;
		const dd = (v - peak) / peak;
		if (dd < maxDD) maxDD = dd;
	}
	return maxDD;
}

export function computeAnalytics(perfData: PerfPoint[]): AnalyticsResult | null {
	if (perfData.length < 10) return null;

	const startMs = new Date(perfData[0].date).getTime();
	const endMs = new Date(perfData[perfData.length - 1].date).getTime();
	const daysElapsed = (endMs - startMs) / (1000 * 60 * 60 * 24);
	if (daysElapsed < 0.1) return null;

	const periodsPerYear = (perfData.length / daysElapsed) * 365;

	const lpValues = perfData.map((d) => d.lp);
	const spyxValues = perfData.map((d) => d.spyx);

	// Period-to-period returns
	const lpReturns: number[] = [];
	const spyxReturns: number[] = [];
	for (let i = 1; i < perfData.length; i++) {
		lpReturns.push(lpValues[i] / lpValues[i - 1] - 1);
		spyxReturns.push(spyxValues[i] / spyxValues[i - 1] - 1);
	}

	// Sharpe (risk-free = 0)
	const meanLp = mean(lpReturns);
	const stdLp = stdDev(lpReturns);
	const sharpe = stdLp === 0 ? 0 : (meanLp / stdLp) * Math.sqrt(periodsPerYear);

	// Sortino (downside deviation only)
	const downside = lpReturns.filter((r) => r < 0);
	const downsideStd = downside.length > 1 ? stdDev(downside) : stdLp;
	const sortino = downsideStd === 0 ? 0 : (meanLp / downsideStd) * Math.sqrt(periodsPerYear);

	// Volatility (annualized)
	const volatilityAnnualized = stdLp * Math.sqrt(periodsPerYear);

	// Max Drawdown
	const maxDrawdownLp = maxDrawdown(lpValues);
	const maxDrawdownSpyx = maxDrawdown(spyxValues);

	// Beta (LP sensitivity to SPYx)
	const meanSpyx = mean(spyxReturns);
	let cov = 0;
	let varSpyx = 0;
	for (let i = 0; i < lpReturns.length; i++) {
		cov += (lpReturns[i] - meanLp) * (spyxReturns[i] - meanSpyx);
		varSpyx += (spyxReturns[i] - meanSpyx) ** 2;
	}
	const beta = varSpyx === 0 ? 0 : cov / varSpyx;

	// Win Rate (% periods LP > SPYx)
	const wins = lpReturns.filter((r, i) => r > spyxReturns[i]).length;
	const winRate = lpReturns.length > 0 ? wins / lpReturns.length : 0;

	// Total returns
	const totalReturnLp = lpValues[lpValues.length - 1] - 1;
	const totalReturnSpyx = spyxValues[spyxValues.length - 1] - 1;
	const alpha = totalReturnLp - totalReturnSpyx;
	const annualizedReturnLp =
		daysElapsed > 0 ? Math.pow(lpValues[lpValues.length - 1], 365 / daysElapsed) - 1 : 0;

	// Best / Worst day (resample to daily)
	const dailyMap = new Map<string, { end: number; start: number }>();
	for (let i = 1; i < perfData.length; i++) {
		const day = perfData[i].date.slice(0, 10);
		if (!dailyMap.has(day)) {
			dailyMap.set(day, { start: lpValues[i - 1], end: lpValues[i] });
		} else {
			dailyMap.get(day)!.end = lpValues[i];
		}
	}
	const dailyReturns = [...dailyMap.values()].map(({ start, end }) => end / start - 1);
	const bestDayReturn = dailyReturns.length > 0 ? Math.max(...dailyReturns) : 0;
	const worstDayReturn = dailyReturns.length > 0 ? Math.min(...dailyReturns) : 0;

	return {
		sharpe,
		sortino,
		maxDrawdownLp,
		maxDrawdownSpyx,
		volatilityAnnualized,
		beta,
		winRate,
		totalReturnLp,
		totalReturnSpyx,
		alpha,
		annualizedReturnLp,
		bestDayReturn,
		worstDayReturn,
		daysElapsed
	};
}
