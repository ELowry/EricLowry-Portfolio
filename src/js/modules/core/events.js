/**
 * App-wide event dispatcher.
 */
class EventBus {
	/**
	 * Events and their subscriber callbacks.
	 * @type {Map<string, Set<Function>>}
	 */
	#listeners = new Map();

	/**
	 * Registers a handler for an event.
	 * @param {string} event - Event name.
	 * @param {Function} onEmitted - Function to execute when the event is emitted.
	 */
	subscribe(event, onEmitted) {
		if (!this.#listeners.has(event)) {
			this.#listeners.set(event, new Set());
		}
		this.#listeners.get(event).add(onEmitted);
	}

	/**
	 * Unregisters a handler for an event.
	 * @param {string} event - Event name.
	 * @param {Function} onEmitted - Function to unregister.
	 */
	unsubscribe(event, onEmitted) {
		if (!this.#listeners.has(event)) {
			return;
		}
		const subscribers = this.#listeners.get(event);
		for (const subscriber of subscribers) {
			if (subscriber === onEmitted || subscriber.original === onEmitted) {
				subscribers.delete(subscriber);
			}
		}
	}

	/**
	 * Emits an event to all registered subscribers.
	 * @param {string} event - Event name.
	 * @param {...any} args - Arguments to pass to subscriber functions.
	 */
	emit(event, ...args) {
		if (!this.#listeners.has(event)) {
			return;
		}
		for (const subscriberFunction of Array.from(this.#listeners.get(event))) {
			subscriberFunction(...args);
		}
	}
}

export const Events = new EventBus();
