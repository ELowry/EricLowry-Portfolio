import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Interaction } from './interaction.js';
import { Input } from './input.js';
import { App } from '../app.js';

vi.mock('../app.js', () => ({
	App: {
		navigate: vi.fn(),
		loadContentInModal: vi.fn(),
		LJS: {
			vec2: (x, y) => ({ x, y }),
			Color: class {
				constructor(r, g, b, a) {
					this.r = r;
					this.g = g;
					this.b = b;
					this.a = a;
				}
			},
			drawRect: vi.fn(),
		},
	},
}));

vi.mock('./layeredInputs.js', () => ({
	LayeredInput: {
		isActive: vi.fn().mockReturnValue(true),
		LAYER_GAME: 'game_layer',
	},
}));

vi.mock('./input.js', () => ({
	Input: {
		interact: false,
		spawnTapRipple: vi.fn(),
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

		expect(App.navigate).toHaveBeenCalledWith('nav-target');
		expect(Input.spawnTapRipple).toHaveBeenCalled();
	});
});
