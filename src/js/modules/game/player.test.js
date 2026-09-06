import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Input } from '../input/input.js';
import { Player } from './player.js';

vi.mock('../core/engineContext.js', () => {
	/**
	 * Mock representation of the LittleJS EngineObject base class.
	 */
	class MockEngineObject {
		/**
		 * @param {Object} pos - World position.
		 */
		constructor(pos) {
			this.pos = pos;
			this.velocity = { x: 0, y: 0 };
			this.size = { x: 1, y: 1 };
		}

		/**
		 * Mock update function.
		 */
		update() {}

		/**
		 * Mock collision settings.
		 */
		setCollision() {}
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
					 * Initializes the mock timer.
					 */
					constructor() {
						this.time = 0;
					}

					/**
					 * @param {number} t - Time to set.
					 */
					set(t) {
						this.time = t;
					}

					/**
					 * @returns {number} Current elapsed time.
					 */
					get() {
						return this.time;
					}

					/**
					 * @returns {boolean} Returns true if elapsed.
					 */
					elapsed() {
						return true;
					}
				},
				/**
				 * @returns {Object} A mock tile payload.
				 */
				tile: () => {
					return { textureInfo: 'mock-tex-info' };
				},
				EngineObject: MockEngineObject,
				/**
				 * @param {number} min - Minimum value.
				 * @returns {number} The minimum value.
				 */
				rand: (min) => {
					return min;
				},
				/**
				 * @returns {number} A zero integer.
				 */
				randInt: () => {
					return 0;
				},
			},
		},
	};
});

vi.mock('../core/layeredInputs.js', () => {
	return {
		LayeredInput: {
			isActive: vi.fn().mockReturnValue(true),
			LAYER_GAME: 'game',
		},
	};
});

vi.mock('../core/router.js', () => {
	return {
		Router: {
			currentMode: 'game',
		},
	};
});

vi.mock('../input/input.js', () => {
	return {
		Input: {
			axis: { x: 0, y: 0 },
		},
	};
});

vi.mock('./gameBridge.js', () => {
	return {
		GameBridge: {
			mapBounds: { minX: 0, maxX: 100 },
		},
	};
});

describe('Player', () => {
	let player;

	beforeEach(() => {
		vi.restoreAllMocks();
		Input.axis.x = 0;
		player = new Player({ x: 50, y: 10 });
	});

	it('should initialize with correct default properties', () => {
		expect(player.moveSpeed).toBe(Player.MOVE_SPEED);
		expect(player.facingLeft).toBe(true);
		expect(player.currentState).toBe('idle');
	});

	it('should update movement state and facing direction based on input', () => {
		Input.axis.x = -1;
		player.update(); // Transitions from 'idle' to 'walk'
		player.update(); // Applies velocity math

		expect(player.velocity.x).toBeLessThan(0);
		expect(player.facingLeft).toBe(true);
		expect(player.currentState).toBe('walk');

		Input.axis.x = 1;
		player.update(); // Already in 'walk' state, updates directly

		expect(player.velocity.x).toBeGreaterThan(0);
		expect(player.facingLeft).toBe(false);
	});

	it('should transition to stopping state when input ceases', () => {
		Input.axis.x = 1;
		player.update();
		expect(player.currentState).toBe('walk');

		Input.axis.x = 0;
		player.update();
		expect(player.currentState).toBe('stopping');
	});

	it('should restrict movement beyond map boundaries and dampen speed', () => {
		player.pos.x = 0.5;
		Input.axis.x = -1;

		player.update(); // Transitions to 'walk'
		player.update(); // Applies velocity math

		const dampenedSpeed = -1 * player.moveSpeed * (0.5 / Player.BOUNDS_BUFFER);
		expect(player.velocity.x).toBeCloseTo(dampenedSpeed);

		player.pos.x = -1;
		player.update();

		expect(player.pos.x).toBe(0);
	});

	it('should request specific front interact animation states', async () => {
		const delayPromise = player.playFrontInteract(0);
		expect(player.currentState).toBe('front_interact');
		await delayPromise;
	});

	it('should request specific behind interact animation states', async () => {
		const delayPromise = player.playBehindInteract(0);
		expect(player.currentState).toBe('behind_interact');
		await delayPromise;
	});

	it('should calculate accurate frame offsets for stopping animation transitions', () => {
		Input.axis.x = 1;
		player.update();

		Input.axis.x = 0;
		player.update();

		player.animTimer.time = 0.2;
		player.playFrontInteract(0);

		expect(player.savedStopFrame).toBe(13);
		expect(player.animations['front_interact_stopping'].frames[0]).toBe(13);
	});

	it('should transition through wave_start, wave, and wave_stop sequences', () => {
		player.setState('wave');
		expect(player.currentState).toBe('wave_start');
		expect(player.animations['wave_start'].frames).toEqual([19, 33]);

		// Simulate completion of wave_start
		player.animTimer.time = 1;
		player.update();
		expect(player.currentState).toBe('wave');
		expect(player.animations['wave'].frames).toEqual([34, 35]);

		// Stop waving
		player.setState('idle');
		expect(player.currentState).toBe('wave_stop');
		expect(player.animations['wave_stop'].frames).toEqual([33, 19]);

		// Simulate completion of wave_stop
		player.animTimer.time = 1;
		player.update();
		expect(player.currentState).toBe('idle');
	});

	it('should start waving when total idle time reaches IDLE_WAVE_DURATION', () => {
		player.totalIdleTimer.time = Player.IDLE_WAVE_DURATION;
		player.update();
		expect(player.currentState).toBe('wave_start');
	});
});
