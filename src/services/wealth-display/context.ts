import { useServiceContext } from '../context/service';
import { WealthDisplayService } from './service.svelte';

export const setWealthDisplayContext = () =>
	useServiceContext({
		Service: WealthDisplayService
	});

export const useWealthDisplayContext = () =>
	useServiceContext() as ReturnType<typeof setWealthDisplayContext>;
