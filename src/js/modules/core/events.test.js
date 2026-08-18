import { describe, it, expect, vi } from 'vitest';
import { Events } from '../core/events.js';

describe('Events EventBus', () => {
	it('should register and trigger event handlers', () => {
		const handler = vi.fn();
		Events.on('test-event', handler);

		Events.emit('test-event', 'payload-data');

		expect(handler).toHaveBeenCalledWith('payload-data');

		Events.off('test-event', handler);
	});

	it('should allow multiple handlers for the same event', () => {
		const handler1 = vi.fn();
		const handler2 = vi.fn();

		Events.on('multi-event', handler1);
		Events.on('multi-event', handler2);

		Events.emit('multi-event');

		expect(handler1).toHaveBeenCalled();
		expect(handler2).toHaveBeenCalled();

		Events.off('multi-event', handler1);
		Events.off('multi-event', handler2);
	});

	it('should support triggering handlers only once', () => {
		const handler = vi.fn();
		Events.once('once-event', handler);

		Events.emit('once-event');
		Events.emit('once-event');

		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('should stop calling handler after it is offed', () => {
		const handler = vi.fn();
		Events.on('temp-event', handler);
		Events.emit('temp-event');

		Events.off('temp-event', handler);
		Events.emit('temp-event');

		expect(handler).toHaveBeenCalledTimes(1);
	});
});
