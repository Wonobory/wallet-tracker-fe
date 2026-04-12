<script>
	import { setWealthDisplayContext } from '../../../../services/wealth-display/context';
	import WealthDisplay from './WealthDisplay.svelte';
	import DepositTracker from './DepositTracker.svelte';

	const { service } = setWealthDisplayContext();

	$effect(() => {
		service.fetchDeposits();
		service.fetchPriceAdjustments();
	});
</script>

<div class="min-h-screen bg-[#0d0d0f] px-4 py-8 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-2xl">
		<header class="mb-8">
			<p class="text-xs font-medium uppercase tracking-widest text-zinc-500">Portfolio</p>
			<h1 class="mt-1 text-2xl font-semibold text-white">Wealth Tracker</h1>
		</header>

		<WealthDisplay />

		<div class="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
			<DepositTracker />
		</div>
	</div>
</div>
