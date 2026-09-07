import { describe, expect, it, vi } from 'vitest';

import { Events } from '../core/events.js';

describe('Events EventBus', () => {
	it('should register and trigger event handlers', () => {
		const handler = vi.fn();
		Events.subscribe('test-event', handler);

		Events.emit('test-event', 'payload-data');

		expect(handler).toHaveBeenCalledWith('payload-data');

		Events.unsubscribe('test-event', handler);
	});

	it('should allow multiple handlers for the same event', () => {
		const handler1 = vi.fn();
		const handler2 = vi.fn();

		Events.subscribe('multi-event', handler1);
		Events.subscribe('multi-event', handler2);

		Events.emit('multi-event');

		expect(handler1).toHaveBeenCalled();
		expect(handler2).toHaveBeenCalled();

		Events.unsubscribe('multi-event', handler1);
		Events.unsubscribe('multi-event', handler2);
	});

	it('should stop calling handler after it is offed', () => {
		const handler = vi.fn();
		Events.subscribe('temp-event', handler);
		Events.emit('temp-event');

		Events.unsubscribe('temp-event', handler);
		Events.emit('temp-event');

		expect(handler).toHaveBeenCalledTimes(1);
	});
});
