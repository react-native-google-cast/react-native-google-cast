import { NativeEventEmitter, NativeModules } from 'react-native';
import MediaQueueItem from '../types/MediaQueueItem';

const { RNGCMediaQueue: Native } = NativeModules;
const EventEmitter = new NativeEventEmitter(Native)

type Resolvable<T> = {
	resolve( value: T ): void,
	reject(): void,
}

interface MediaQueueState {
	count: number;
	queuedIds: number[];
}

export default class MediaQueue implements MediaQueueState {
	count: number;
	queuedIds: number[];

	private itemPromises: Array<Promise<MediaQueueItem>> = [];
	private itemResolvers: Array<Resolvable<MediaQueueItem>> = [];

	private constructor(state: MediaQueueState) {
		this.count = state.count;
		this.queuedIds = state.queuedIds;

		EventEmitter.addListener(Native.QUEUE_RECEIVED_ITEM, (item: MediaQueueItem) => {
			if (item.itemId && this.itemResolvers[item.itemId]) {
				this.itemResolvers[item.itemId].resolve(item);
			}
		});
	}

	static async getState(): Promise<MediaQueue | null> {
		const state = await Native.getState();
		if (!state) return null;

		return new MediaQueue(state);
	}

	static onChanged(listener: (queue: MediaQueue) => void) {
		return EventEmitter.addListener(Native.QUEUE_CHANGED, (state: MediaQueueState) => {
			listener(new MediaQueue(state));
		});
	}

	getItemById(id: number): Promise<MediaQueueItem> {
		if (this.itemPromises[id]) {
			return this.itemPromises[id];
		}

		// Prepare promise.
		this.itemPromises[id] = new Promise((resolve, reject) => {
			this.itemResolvers[id] = { resolve, reject };
		});

		// Actually fetch it too.
		// Responses are handled by the listener.
		Native.getItemWithId(id, true);

		return this.itemPromises[id];
	}
}
