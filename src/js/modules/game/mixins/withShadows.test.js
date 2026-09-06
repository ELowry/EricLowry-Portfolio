import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WithShadows } from './withShadows.js';

vi.mock('../../core/engineContext.js', () => {
	/**
	 * Mock EngineObject base class.
	 */
	class MockEngineObject {
		/**
		 * @param {Object} pos - World position.
		 * @param {Object} size - Physical size.
		 */
		constructor(pos = { x: 0, y: 0 }, size = { x: 1, y: 2 }) {
			this.pos = pos;
			this.size = size;
			this.angle = 0;
			this.mirror = false;
		}
	}

	return {
		Engine: {
			LJS: {
				/**
				 * @param {number} x - X coordinate.
				 * @param {number} y - Y coordinate.
				 * @returns {Object} 2D vector.
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
				TileInfo: class {
					/**
					 * @param {Object} pos - Position.
					 * @param {Object} size - Dimensions.
					 * @param {Object} textureInfo - Texture.
					 * @param {number} [padding=0] - Padding.
					 * @param {number} [bleed=0] - Bleed.
					 */
					constructor(pos, size, textureInfo, padding = 0, bleed = 0) {
						this.pos = pos;
						this.size = size;
						this.textureInfo = textureInfo;
						this.padding = padding;
						this.bleed = bleed;
					}
				},
				drawTile: vi.fn(),
				EngineObject: MockEngineObject,
			},
		},
	};
});

describe('WithShadows Mixin', () => {
	let ShadowClass;
	let entity;
	let mockTileInfo;
	let engine;

	beforeEach(async () => {
		vi.clearAllMocks();
		const engineContext = await import('../../core/engineContext.js');
		engine = engineContext.Engine;

		ShadowClass = WithShadows(engine.LJS.EngineObject);
		entity = new ShadowClass(engine.LJS.vec2(10, 5), engine.LJS.vec2(2, 4));

		mockTileInfo = new engine.LJS.TileInfo(
			engine.LJS.vec2(100, 200),
			engine.LJS.vec2(20, 40),
			{ id: 'texture-0' },
			1,
			0
		);
	});

	it('should initialize with shadowType none by default', () => {
		expect(entity.shadowType).toBe('none');
		expect(entity.shadowDistance).toBeNull();
	});

	it('should not render anything when shadowType is none or null', () => {
		entity.shadowType = 'none';
		entity.renderShadow(mockTileInfo);
		expect(engine.LJS.drawTile).not.toHaveBeenCalled();

		entity.shadowType = null;
		entity.renderShadow(mockTileInfo);
		expect(engine.LJS.drawTile).not.toHaveBeenCalled();
	});

	it('should not render anything when currentTileInfo is missing', () => {
		entity.shadowType = 'floor';
		entity.renderShadow(null);
		expect(engine.LJS.drawTile).not.toHaveBeenCalled();
	});

	describe('Floor Shadows', () => {
		beforeEach(() => {
			entity.shadowType = 'floor';
		});

		it('should generate sliced horizontal strips aligned with object bottom', () => {
			entity.renderShadow(mockTileInfo);

			expect(engine.LJS.drawTile).toHaveBeenCalledTimes(40);

			const firstSliceCall = engine.LJS.drawTile.mock.calls[0];
			const lastSliceCall = engine.LJS.drawTile.mock.calls[39];

			const objBottomY = 5 - 4 / 2;
			const totalShadowHeight = 4 * ShadowClass.FLOOR_HEIGHT_FACTOR;
			const sliceHeight = totalShadowHeight / 40;

			const lastSlicePos = lastSliceCall[0];
			const lastSliceSize = lastSliceCall[1];
			expect(lastSliceSize.x).toBe(2);
			expect(lastSliceSize.y).toBeCloseTo(sliceHeight);
			expect(lastSlicePos.y + lastSliceSize.y / 2).toBeCloseTo(objBottomY);
			expect(lastSlicePos.x).toBeCloseTo(10, 1);

			const firstSlicePos = firstSliceCall[0];
			const firstSliceSize = firstSliceCall[1];
			const expectedSkewX = 10 + 4 * ShadowClass.FLOOR_SKEW_FACTOR;
			expect(firstSlicePos.x).toBeCloseTo(expectedSkewX, 1);
			expect(firstSlicePos.y - firstSliceSize.y / 2).toBeCloseTo(
				objBottomY - totalShadowHeight
			);
		});

		it('should preserve padding and bleed on slice TileInfo objects', () => {
			entity.renderShadow(mockTileInfo);

			const firstSliceTileInfo = engine.LJS.drawTile.mock.calls[0][2];
			expect(firstSliceTileInfo.padding).toBe(1);
			expect(firstSliceTileInfo.bleed).toBe(0);
			expect(firstSliceTileInfo.pos.x).toBe(100);
			expect(firstSliceTileInfo.pos.y).toBe(200);
		});

		it('should reuse cached slice TileInfo objects on subsequent frames', () => {
			entity.renderShadow(mockTileInfo);
			const firstPassSlices = engine.LJS.drawTile.mock.calls.map((call) => call[2]);

			engine.LJS.drawTile.mockClear();
			entity.renderShadow(mockTileInfo);
			const secondPassSlices = engine.LJS.drawTile.mock.calls.map((call) => call[2]);

			expect(firstPassSlices).toEqual(secondPassSlices);
		});
	});

	describe('Wall Shadows', () => {
		beforeEach(() => {
			entity.shadowType = 'wall';
		});

		it('should render shifted by default wall distance', () => {
			entity.renderShadow(mockTileInfo);

			expect(engine.LJS.drawTile).toHaveBeenCalledTimes(1);
			const [pos, size, tileInfo] = engine.LJS.drawTile.mock.calls[0];

			const expectedDist = ShadowClass.DEFAULT_WALL_DISTANCE;
			expect(pos.x).toBeCloseTo(10 + expectedDist);
			expect(pos.y).toBeCloseTo(5 - expectedDist);
			expect(size).toEqual({ x: 2, y: 4 });
			expect(tileInfo).toBe(mockTileInfo);
		});

		it('should respect custom shadowDistance override', () => {
			entity.shadowDistance = 0.5;
			entity.renderShadow(mockTileInfo);

			const [pos] = engine.LJS.drawTile.mock.calls[0];
			expect(pos.x).toBeCloseTo(10.5);
			expect(pos.y).toBeCloseTo(4.5);
		});
	});

	describe('Wall-Floor Shadows', () => {
		beforeEach(() => {
			entity.shadowType = 'wall-floor';
		});

		it('should clip shadow at base and trim texture height proportionally without squashing', () => {
			entity.renderShadow(mockTileInfo);

			expect(engine.LJS.drawTile).toHaveBeenCalledTimes(1);
			const [pos, size, tileInfo] = engine.LJS.drawTile.mock.calls[0];

			const dist = ShadowClass.DEFAULT_WALL_DISTANCE;
			const objBottomY = 5 - 4 / 2;
			const expectedClippedHeight = 4 - dist;

			expect(size.y).toBeCloseTo(expectedClippedHeight);
			expect(pos.y - size.y / 2).toBeCloseTo(objBottomY);

			const expectedPixelHeight = 40 * (expectedClippedHeight / 4);
			expect(tileInfo.size.y).toBeCloseTo(expectedPixelHeight);
			expect(tileInfo.pos.y).toBe(200);
			expect(tileInfo.padding).toBe(1);
		});

		it('should account for shadowBaselineOffset when clipping wall-floor shadows', () => {
			entity.shadowBaselineOffset = 0.3;
			entity.renderShadow(mockTileInfo);

			expect(engine.LJS.drawTile).toHaveBeenCalledTimes(1);
			const [pos, size, tileInfo] = engine.LJS.drawTile.mock.calls[0];

			const dist = ShadowClass.DEFAULT_WALL_DISTANCE;
			const objBottomY = 5 - 4 / 2 + 0.3;
			const expectedClippedHeight = 4 - (dist + 0.3);

			expect(size.y).toBeCloseTo(expectedClippedHeight);
			expect(pos.y - size.y / 2).toBeCloseTo(objBottomY);

			const expectedPixelHeight = 40 * (expectedClippedHeight / 4);
			expect(tileInfo.size.y).toBeCloseTo(expectedPixelHeight);
		});

		it('should not render if overflow exceeds or equals object height', () => {
			entity.shadowDistance = 10;
			entity.renderShadow(mockTileInfo);

			expect(engine.LJS.drawTile).not.toHaveBeenCalled();
		});
	});
});
