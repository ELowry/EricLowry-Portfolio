import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LayeredInput } from './layeredInputs.js';
import { Events } from './events.js';

vi.mock('./events.js', () => {
	return {
		Events: {
			emit: vi.fn(),
		},
	};
});

describe('LayeredInput System', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		LayeredInput.clearAll();
	});

	it('should activate and deactivate layers correctly', () => {
		LayeredInput.activate(LayeredInput.LAYER_GAME);
		expect(LayeredInput.activeLayerId).toBe(LayeredInput.LAYER_GAME);

		LayeredInput.deactivate(LayeredInput.LAYER_GAME);
		expect(LayeredInput.activeLayerId).toBeNull();
	});

	it('should respect layer priority hierarchy', () => {
		LayeredInput.activate(LayeredInput.LAYER_GAME);
		LayeredInput.activate(LayeredInput.LAYER_GAME_MENU);

		expect(LayeredInput.activeLayerId).toBe(LayeredInput.LAYER_GAME_MENU);
	});

	it('should restore previous active layer in hierarchy when deactivating', () => {
		LayeredInput.activate(LayeredInput.LAYER_GAME);
		LayeredInput.activate(LayeredInput.LAYER_GAME_MENU);
		LayeredInput.deactivate(LayeredInput.LAYER_GAME_MENU);

		expect(LayeredInput.activeLayerId).toBe(LayeredInput.LAYER_GAME);
	});

	it('should block inputs within FRAME_SECURITY_MS cooldown period', () => {
		LayeredInput.activate(LayeredInput.LAYER_GAME);

		expect(LayeredInput.isActive(LayeredInput.LAYER_GAME)).toBe(false);
	});

	it('should allow unsafe activation check to bypass FRAME_SECURITY_MS cooldown', () => {
		LayeredInput.activate(LayeredInput.LAYER_GAME);

		expect(LayeredInput.isActive(LayeredInput.LAYER_GAME, true)).toBe(true);
	});

	it('should broadcast activation events', () => {
		LayeredInput.activate(LayeredInput.LAYER_GAME);

		expect(Events.emit).toHaveBeenCalledWith(
			LayeredInput.LAYER_ACTIVATION_EVENT,
			LayeredInput.LAYER_GAME
		);
		expect(Events.emit).toHaveBeenCalledWith(
			`${LayeredInput.LAYER_ACTIVATION_EVENT}:${LayeredInput.LAYER_GAME}`
		);
	});
});
