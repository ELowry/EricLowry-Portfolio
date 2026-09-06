import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PropManager } from './propManager.js';

vi.mock('../core/engineContext.js', () => {
	/**
	 * Mock representation of the LittleJS EngineObject base class.
	 */
	class MockEngineObject {
		constructor(pos, size) {
			this.pos = pos;
			this.size = size;
			this.isEngineObject = true;
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
				vec2: (x, y) => {
					return { x, y };
				},
				Color: class {
					constructor() {}
				},
				Timer: class {
					/**
					 * @param {number} _t - The time value.
					 */
					set(_t) {}

					/**
					 * @returns {number} The current time value.
					 */
					get() {
						return 0;
					}
				},
				TileInfo: class {
					constructor(pos, size, textureInfo) {
						this.pos = pos;
						this.size = size;
						this.textureInfo = textureInfo;
					}
				},
				/**
				 * @returns {Object} A mock tile payload.
				 */
				tile: () => {
					return { textureInfo: 'mock-tex-info' };
				},
				drawTile: vi.fn(),
				EngineObject: MockEngineObject,
			},
		},
	};
});

vi.mock('./props/inputPromptEntity.js', () => {
	/**
	 * Mock representation of the InputPromptEntity class.
	 */
	class MockInputPromptEntity {
		constructor(pos, size) {
			this.pos = pos;
			this.size = size;
			this.isInputPromptEntity = true;
			this.animations = {};
		}

		addAnimation() {}
		setState() {}
		setLogicalKey() {}
	}

	return {
		InputPromptEntity: MockInputPromptEntity,
	};
});

vi.mock('./animatedEntity.js', () => {
	/**
	 * Mock representation of the AnimatedEntity class.
	 */
	class MockAnimatedEntity {
		constructor(pos, size) {
			this.pos = pos;
			this.size = size;
			this.isAnimatedEntity = true;
			this.animations = {};
		}

		/**
		 * Mock addAnimation method.
		 */
		addAnimation() {}

		/**
		 * Mock setState method.
		 */
		setState() {}
	}

	return {
		AnimatedEntity: MockAnimatedEntity,
	};
});

vi.mock('../content/content.js', () => {
	return {
		Content: {
			getParentMapNode: vi.fn(),
			findNodeByPath: vi.fn(),
			tree: {},
		},
	};
});

describe('PropManagerController', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		PropManager.buildRegistry([]);
	});

	it('should correctly merge shared and local sprite definitions in buildRegistry', () => {
		const configChain = [
			{ shared: { tree: { size: 1 }, rock: { size: 1 } } },
			{ shared: { tree: { size: 2 } } },
			{ local: { rock: { size: 3 }, flower: { size: 1 } } },
		];

		PropManager.buildRegistry(configChain);

		const propsData = [
			{ type: 'tree', pos: { x: 0, y: 0 } },
			{ type: 'rock', pos: { x: 0, y: 0 } },
			{ type: 'flower', pos: { x: 0, y: 0 } },
		];

		const spawned = PropManager.spawnProps(propsData);
		expect(spawned.length).toBe(3);
	});

	it('should default size to resolution / 10 if not provided', () => {
		PropManager.buildRegistry([
			{
				local: {
					'auto-size-prop': {
						isAnimated: false,
						resolution: { x: 32, y: 16 },
					},
				},
			},
		]);

		const spawned = PropManager.spawnProps([{ type: 'auto-size-prop', pos: { x: 0, y: 0 } }]);

		expect(spawned.length).toBe(1);
		expect(spawned[0].size).toEqual({ x: 3.2, y: 1.6 });
	});

	it('should spawn an AnimatedEntity when isAnimated is true', () => {
		PropManager.buildRegistry([
			{
				local: {
					'animated-prop': {
						isAnimated: true,
						size: { x: 1, y: 1 },
						resolution: { x: 16, y: 16 },
						animations: { idle: { frames: [0], speed: 1, loop: false } },
					},
				},
			},
		]);

		const spawned = PropManager.spawnProps([{ type: 'animated-prop', pos: { x: 0, y: 0 } }]);

		expect(spawned.length).toBe(1);
		expect(spawned[0].isAnimatedEntity).toBe(true);
	});

	it('should spawn an EngineObject when isAnimated is false', () => {
		PropManager.buildRegistry([
			{
				local: {
					'static-prop': {
						isAnimated: false,
						size: { x: 1, y: 1 },
						resolution: { x: 16, y: 16 },
					},
				},
			},
		]);

		const spawned = PropManager.spawnProps([{ type: 'static-prop', pos: { x: 0, y: 0 } }]);

		expect(spawned.length).toBe(1);
		expect(spawned[0].isEngineObject).toBe(true);
	});

	it('should skip spawning if the definition does not exist', () => {
		PropManager.buildRegistry([]);
		const spawned = PropManager.spawnProps([{ type: 'missing-prop', pos: { x: 0, y: 0 } }]);

		expect(spawned.length).toBe(0);
	});

	it('should spawn an InputPromptEntity when entityType is inputPrompt', () => {
		PropManager.buildRegistry([
			{
				local: {
					'prompt-prop': {
						entityType: 'inputPrompt',
						size: { x: 1, y: 1 },
						resolution: { x: 16, y: 16 },
						animations: { mnk: { frames: [0], speed: 1 } },
					},
				},
			},
		]);

		const spawned = PropManager.spawnProps([{ type: 'prompt-prop', pos: { x: 0, y: 0 } }]);

		expect(spawned.length).toBe(1);
		expect(spawned[0].isInputPromptEntity).toBe(true);
	});
});
