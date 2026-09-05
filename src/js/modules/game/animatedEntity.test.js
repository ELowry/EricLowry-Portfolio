import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnimatedEntity } from './animatedEntity.js';

vi.mock('../core/engineContext.js', () => {
	/**
	 * Mock representation of the LittleJS EngineObject base class.
	 */
	class MockEngineObject {
		/**
		 * @param {Object} pos - World position.
		 * @param {Object} size - Physical size.
		 * @param {Object} tileInfo - Sprite data.
		 * @param {number} angle - Rotation angle.
		 * @param {Object} color - Applied color.
		 * @param {number} renderOrder - Z-index sorting.
		 */
		constructor(pos, size, tileInfo, angle, color, renderOrder) {
			this.pos = pos;
			this.size = size;
			this.renderOrder = renderOrder;
		}

		/**
		 * Mock update cycle.
		 */
		update() {}

		/**
		 * Mock render cycle.
		 */
		render() {}
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
					/**
					 * @param {number} r - Red channel.
					 * @param {number} g - Green channel.
					 * @param {number} b - Blue channel.
					 * @param {number} a - Alpha channel.
					 */
					constructor(r, g, b, a) {
						this.r = r;
						this.g = g;
						this.b = b;
						this.a = a;
					}
				},
				Timer: class {
					/**
					 * Initializes the timer to zero.
					 */
					constructor() {
						this.time = 0;
					}

					/**
					 * @param {number} t - The time value to set.
					 */
					set(t) {
						this.time = t;
					}

					/**
					 * @returns {number} The current time value.
					 */
					get() {
						return this.time;
					}
				},
				TileInfo: class {
					/**
					 * @param {Object} pos - The pixel position.
					 * @param {Object} size - The pixel dimensions.
					 * @param {Object} texInfo - The texture data reference.
					 */
					constructor(pos, size, texInfo) {
						this.pos = pos;
						this.size = size;
						this.textureInfo = texInfo;
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

describe('AnimatedEntity', () => {
	let entity;

	beforeEach(() => {
		vi.restoreAllMocks();
		const pos = { x: 0, y: 0 };
		const size = { x: 1, y: 2 };
		const spriteResolution = { x: 16, y: 32 };
		entity = new AnimatedEntity(pos, size, 0, spriteResolution, 1);
	});

	it('should initialize with default states', () => {
		expect(entity.currentState).toBe('idle');
		expect(entity.prevState).toBe('idle');
		expect(entity.textureIndex).toBe(0);
		expect(entity.spriteResolution).toEqual({ x: 16, y: 32 });
	});

	it('should register animations via addAnimation', () => {
		entity.addAnimation('walk', [0, 1, 2], 10, true);

		expect(entity.animations['walk']).toBeDefined();
		expect(entity.animations['walk'].frames).toEqual([0, 1, 2]);
		expect(entity.animations['walk'].speed).toBe(10);
		expect(entity.animations['walk'].loop).toBe(true);
	});

	it('should transition states and reset timer when setState is called', () => {
		const timerSetSpy = vi.spyOn(entity.animTimer, 'set');

		entity.setState('running', 0.5);

		expect(entity.prevState).toBe('idle');
		expect(entity.currentState).toBe('running');
		expect(timerSetSpy).toHaveBeenCalledWith(0.5);
	});

	it('should calculate correct TileInfo pixel coordinates based on grid index and implicit padding', () => {
		entity.gridCols = 5;
		entity.gridOffset = { x: 10, y: 20 };

		const tileInfo = entity.getTileInfo(6);

		expect(tileInfo.pos).toEqual({ x: 29, y: 55 });
		expect(tileInfo.size).toEqual({ x: 16, y: 32 });
		expect(tileInfo.textureInfo).toBe('mock-tex-info');
	});

	it('should return cached TileInfo if called multiple times with the same index', () => {
		const tileInfo1 = entity.getTileInfo(2);
		const tileInfo2 = entity.getTileInfo(2);

		expect(tileInfo1).toBe(tileInfo2);
	});
});
