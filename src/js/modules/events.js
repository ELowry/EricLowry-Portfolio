/**
 * EventBus - lightweight pub/sub dispatcher for app-wide events.
 *
 * Methods:
 *  - on(event, handler)
 *  - off(event, handler)
 *  - emit(event, ...args)
 *  - once(event, handler)
 */
class EventBus {
	constructor() {
		/** @type {Map<string, Set<Function>>} Registry of events and their subscriber callbacks. */
		this.listeners = new Map();
	}

	on(event, handler) {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event).add(handler);
	}
	off(event, handler) {
		if (!this.listeners.has(event)) {
			return;
		}
		this.listeners.get(event).delete(handler);
	}
	emit(event, ...args) {
		if (!this.listeners.has(event)) {
			return;
		}
		for (const h of Array.from(this.listeners.get(event))) {
			h(...args);
		}
	}
	once(event, handler) {
		const wrapper = (...args) => {
			handler(...args);
			this.off(event, wrapper);
		};
		this.on(event, wrapper);
	}
}

export const Events = new EventBus();
