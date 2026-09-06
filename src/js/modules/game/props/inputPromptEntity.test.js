import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InputPrompts } from '../../input/inputPrompts.js';
import { InputPromptEntity } from './inputPromptEntity.js';

vi.mock('../../input/inputPrompts.js', () => ({
	InputPrompts: {
		currentType: 'mnk',
		gamepadType: 'default',
		layoutMap: new Map(),
	},
}));

vi.mock('../animatedEntity.js', () => {
	class MockAnimatedEntity {
		constructor(pos, size, _textureIndex, _resolution, _renderOrder) {
			this.pos = pos;
			this.size = size;
			this.animations = {};
			this.currentState = 'idle';
		}

		update() {}

		setState(state) {
			this.currentState = state;
		}
	}

	return {
		AnimatedEntity: MockAnimatedEntity,
	};
});

describe('InputPromptEntity', () => {
	let entity;

	beforeEach(() => {
		vi.restoreAllMocks();
		InputPrompts.currentType = 'mnk';
		InputPrompts.gamepadType = 'default';
		InputPrompts.layoutMap.clear();

		entity = new InputPromptEntity({ x: 0, y: 0 }, { x: 1, y: 1 }, 0, { x: 16, y: 16 });

		entity.animations = {
			mnk: {
				keys: { A: 0, Q: 1, default: 0 },
				frames: [0],
			},
			gamepad_default: { frames: [2] },
			gamepad_ps: { frames: [3] },
			touch: { frames: [4] },
		};
	});

	it('should default to MNK and resolve the default logical key frame', () => {
		entity.setLogicalKey('A');
		entity.update();

		expect(entity.currentState).toBe('mnk');
		expect(entity.animations['mnk'].frames).toEqual([0]);
	});

	it('should switch to gamepad states based on InputPrompts', () => {
		InputPrompts.currentType = 'gamepad';
		InputPrompts.gamepadType = 'ps';

		entity.update();

		expect(entity.currentState).toBe('gamepad_ps');
	});

	it('should fall back to gamepad_default if the specific gamepad type is missing', () => {
		InputPrompts.currentType = 'gamepad';
		InputPrompts.gamepadType = 'switch'; // Not in our mock animations

		entity.update();

		expect(entity.currentState).toBe('gamepad_default');
	});

	it('should resolve localized keyboard characters via layoutMap', () => {
		InputPrompts.currentType = 'mnk';
		// Simulate an AZERTY keyboard where 'A' maps to '[Q]'
		InputPrompts.layoutMap.set('A', '[Q]');

		entity.setLogicalKey('A');
		entity.update();

		// It should look up 'Q' in the keys dictionary and assign frame 1
		expect(entity.animations['mnk'].frames).toEqual([1]);
	});

	it('should gracefully fallback to default frame if character is not defined in keys', () => {
		InputPrompts.currentType = 'mnk';
		// Simulate an unknown mapping
		InputPrompts.layoutMap.set('A', '[Z]');

		entity.setLogicalKey('A');
		entity.update();

		// 'Z' is missing from `keys`, so it falls back to `default`
		expect(entity.animations['mnk'].frames).toEqual([0]);
	});
});
