<script lang="ts">
	import './layout.css';
	import Login from '$lib/components/Login.svelte';
	import { getToken, setToken } from '$lib/auth';

	let { children } = $props();

	let token = $state(getToken());

	function onLogin(t: string) {
		setToken(t);
		token = t;
	}
</script>

{#if token}
	{@render children()}
{:else}
	<Login {onLogin} />
{/if}
