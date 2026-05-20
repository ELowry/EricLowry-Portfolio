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
	/**
	 * @property {Map<string, Set<Function>>} listeners - Registry of events and their subscriber callbacks.
	 */
	constructor() {
		this.listeners = new Map();
	}

	/**
	 * Registers a handler for an event.
	 * @param {string} event - The name of the event.
	 * @param {Function} handler - The callback function to execute when the event is emitted.
	 */
	on(event, handler) {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event).add(handler);
	}

	/**
	 * Unregisters a handler for an event.
	 * @param {string} event - The name of the event.
	 * @param {Function} handler - The callback function to remove.
	 */
	off(event, handler) {
		if (!this.listeners.has(event)) {
			return;
		}
		this.listeners.get(event).delete(handler);
	}

	/**
	 * Emits an event to all registered handlers.
	 * @param {string} event - The name of the event.
	 * @param {...any} args - Arguments to pass to the handlers.
	 */
	emit(event, ...args) {
		if (!this.listeners.has(event)) {
			return;
		}
		for (const h of Array.from(this.listeners.get(event))) {
			h(...args);
		}
	}

	/**
	 * Registers a handler for an event that will only be executed once.
	 * @param {string} event - The name of the event.
	 * @param {Function} handler - The callback function to execute when the event is emitted.
	 */
	once(event, handler) {
		const wrapper = (...args) => {
			handler(...args);
			this.off(event, wrapper);
		};
		this.on(event, wrapper);
	}
}

export const Events = new EventBus();
