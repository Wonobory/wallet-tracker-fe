export type TimeRange = 'today' | '7d' | '30d' | '6M' | '1yr';

export type DataPoint = {
	date: string;
	totalValue: number;
	byrealValue: number;
	meteoraValue: number;
	walletValue: number;
	spyxPrice: number;
};

export type ChartState = {
	data: DataPoint[] | null;
	loading: boolean;
	error: string | null;
	selectedRange: TimeRange;
};

export type AvailableTimeRanges = {
	label: string;
	value: TimeRange;
};

export type PerfPoint = {
	date: string;
	lp: number;   // LP strategy multiplier relative to start (1.0 = baseline)
	spyx: number; // SPYx HODL multiplier relative to start
};

export type AnalyticsResult = {
	sharpe: number;
	sortino: number;
	maxDrawdownLp: number;
	maxDrawdownSpyx: number;
	volatilityAnnualized: number;
	beta: number;
	winRate: number;
	totalReturnLp: number;
	totalReturnSpyx: number;
	alpha: number;
	annualizedReturnLp: number;
	bestDayReturn: number;
	worstDayReturn: number;
	daysElapsed: number;
};

export type PriceAdjustment = {
	_id: string;
	timestamp: string;
	token: string;
	factor: number;
	priceBefore: number;
	priceAfter: number;
};

export type DepositToken = {
	mint: string;
	symbol: string;
	amount: number;
	entryPriceUsd: number;
};

export type Deposit = {
	_id: string;
	walletAddress: string;
	timestamp: string;
	protocol: 'byreal' | 'meteora' | 'wallet';
	poolName: string;
	tokenA: DepositToken;
	tokenB?: DepositToken;
	totalValueUsd: number;
	notes?: string;
	hodlValueUsd: number;
	hodlReturnPct: number;
	currentPriceA: number;
	currentPriceB: number;
};
