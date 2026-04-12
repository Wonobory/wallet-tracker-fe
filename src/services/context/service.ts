import { getContext, hasContext, setContext } from 'svelte';

type Props<S> = {
	Service: new () => S;
};

type ServiceContext<S> = {
	service: S;
};

export const useServiceContext = <S>(props?: Props<S>) => {
	if (hasContext('service')) {
		return getContext<ServiceContext<S>>('service');
	}

	if (!props) {
		throw new Error(
			'useServiceContext was called before initialization. Props are required for initialization.'
		);
	}

	const { Service } = props;

	const service = new Service();

	setContext<ServiceContext<S>>('service', {
		service
	});

	return getContext<ServiceContext<S>>('service');
};
