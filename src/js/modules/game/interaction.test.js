import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Events } from '../core/events.js';
import { Input } from '../input/input.js';
import { Interaction } from './interaction.js';

vi.mock('../core/engineContext.js', () => {
	/**
	 * Mock representation of the LittleJS EngineObject base class.
	 */
	class MockEngineObject {
		/**
		 * @param {Object} pos - World position.
		 * @param {Object} size - Physical size.
		 */
		constructor(pos, size) {
			this.pos = pos;
			this.size = size;
		}
	}

	return {
		Engine: {
			LJS: {
				/**
				 * @param {number} x - X coordinate.
				 * @param {number} y - Y coordinate.
				 * @returns {Object} A basic 2D vector object.
				 */
				vec2: (x, y) => ({ x, y }),
				Color: class {
					/**
					 * @param {number} r - Red.
					 * @param {number} g - Green.
					 * @param {number} b - Blue.
					 * @param {number} a - Alpha.
					 */
					constructor(r, g, b, a) {
						this.r = r;
						this.g = g;
						this.b = b;
						this.a = a;
					}
				},
				drawRect: vi.fn(),
				EngineObject: MockEngineObject,
			},
		},
	};
});

vi.mock('../ui/lang.js', () => ({
	Lang: {
		getString: vi.fn((_key, _data, fallback) => fallback),
	},
}));

vi.mock('../core/layeredInputs.js', () => ({
	LayeredInput: {
		isActive: vi.fn().mockReturnValue(true),
		LAYER_GAME: 'game_layer',
	},
}));

vi.mock('../input/input.js', () => ({
	Input: {
		interact: false,
		spawnTapRipple: vi.fn(),
		clearEvents: vi.fn(),
	},
}));

describe('InteractionController', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		Interaction.setObjects([]);
		Input.interact = false;
	});

	it('should identify the closest interactive object in range', () => {
		const objects = [
			{ id: 'far-away', pos: { x: 10, y: 10 }, radius: 1.5, path: 'far' },
			{ id: 'near-enough', pos: { x: 2, y: 2 }, radius: 2.0, path: 'near' },
		];
		Interaction.setObjects(objects);

		Interaction.update({ x: 1, y: 1 });

		expect(Interaction.highlightedObject).not.toBeNull();
		expect(Interaction.highlightedObject.id).toBe('near-enough');
	});

	it('should ignore objects outside their activation radius', () => {
		const objects = [{ id: 'out-of-range', pos: { x: 5, y: 5 }, radius: 1.0, path: 'test' }];
		Interaction.setObjects(objects);

		Interaction.update({ x: 1, y: 1 });

		expect(Interaction.highlightedObject).toBeNull();
	});

	it('should trigger path navigation on interaction input', () => {
		const emitSpy = vi.spyOn(Events, 'emit');
		const objects = [
			{
				id: 'trigger-me',
				pos: { x: 1, y: 1.2 },
				radius: 1.5,
				path: 'nav-target',
				type: 'path',
			},
		];
		Interaction.setObjects(objects);
		Input.interact = true;

		Interaction.update({ x: 1, y: 1 });

		expect(emitSpy).toHaveBeenCalledWith('request:navigate', 'nav-target');
		expect(Input.spawnTapRipple).toHaveBeenCalled();
	});
});
