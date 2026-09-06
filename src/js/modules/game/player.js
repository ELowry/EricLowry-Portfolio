import { Engine } from '../core/engineContext.js';
import { LayeredInput } from '../core/layeredInputs.js';
import { Router } from '../core/router.js';
import { Input } from '../input/input.js';
import { AnimatedEntity } from './animatedEntity.js';
import { GameBridge } from './gameBridge.js';

/**
 * Player character controlled by user input.
 * Extends AnimatedEntity for state-based sprite rendering.
 */
export class Player extends AnimatedEntity {
	/** @type {number} */
	moveSpeed;

	/** @type {Object} */
	color;

	/** @type {boolean} */
	facingLeft;

	/** @type {Object} */
	idleLookTimer;

	/** @type {Object} */
	totalIdleTimer;

	/** @type {boolean} */
	isLookingAround;

	/** @type {number|null} */
	savedStopFrame;

	/** @type {Array<Object>} */
	#tileCache;

	/**
	 * Creates a new Player instance.
	 * @param {Object} pos - Initial position in world space.
	 */
	constructor(pos) {
		super(pos, Engine.LJS.vec2(1, 2.9), 0, Player.SPRITE_RESOLUTION, 0);

		this.shadowType = 'floor';
		this.shadowBaselineOffset = 0.15;

		this.moveSpeed = Player.MOVE_SPEED;
		this.color = new Engine.LJS.Color(1, 1, 1);
		this.facingLeft = true;

		this.idleLookTimer = new Engine.LJS.Timer(
			Engine.LJS.rand(Player.IDLE_LOOK_DURATION_MIN, Player.IDLE_LOOK_DURATION_MAX)
		);
		this.totalIdleTimer = new Engine.LJS.Timer();
		this.isLookingAround = false;
		this.savedStopFrame = null;
		this.#tileCache = [];

		this.setCollision(true, true);

		this.addAnimation(
			'walk',
			[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
			Player.ANIM_SPEED_WALK,
			true
		);
		this.addAnimation(
			'stopping',
			[11, 12, 13, 14, 15, 16, 17, 18],
			Player.ANIM_SPEED_STOP,
			false
		);
		this.addAnimation('idle', [21], 0, false);
		this.addAnimation(
			'front_interact_stopping',
			[12, 13, 14, 15, 16],
			Player.ANIM_SPEED_INTERACT_FRONT_STOP,
			false
		);
		this.addAnimation(
			'behind_interact',
			[23, 24, 25, 26, 27],
			Player.ANIM_SPEED_INTERACT_BACK,
			false
		);
		this.addAnimation(
			'front_interact',
			[28, 29, 30, 31, 32],
			Player.ANIM_SPEED_INTERACT_FRONT,
			false
		);
		this.addAnimation('wave_start', [19, 33], Player.ANIM_SPEED_WAVE, false);
		this.addAnimation('wave', [34, 35], Player.ANIM_SPEED_WAVE_LOOP, true);
		this.addAnimation('wave_stop', [33, 19], Player.ANIM_SPEED_WAVE, false);
	}

	/**
	 * @returns {number} the walking animation speed in frames per second.
	 * @constant
	 */
	static get ANIM_SPEED_WALK() {
		return 14;
	}

	/**
	 * @returns {number} the stopping animation speed in frames per second.
	 * @constant
	 */
	static get ANIM_SPEED_STOP() {
		return 10;
	}

	/**
	 * @returns {number} the idle animation speed in frames per second.
	 * @constant
	 */
	static get ANIM_SPEED_IDLE() {
		return 3;
	}

	/**
	 * @returns {number} the animation speed for interacting from behind in frames per second.
	 * @constant
	 */
	static get ANIM_SPEED_INTERACT_BACK() {
		return 10;
	}

	/**
	 * @returns {number} the speed for the transition into a front-facing interaction in frames per second.
	 * @constant
	 */
	static get ANIM_SPEED_INTERACT_FRONT_STOP() {
		return 12;
	}

	/**
	 * @returns {number} the front-facing interaction animation speed in frames per second.
	 * @constant
	 */
	static get ANIM_SPEED_INTERACT_FRONT() {
		return 6;
	}

	/**
	 * @returns {number} the transition speed for the waving animation in frames per second.
	 * @constant
	 */
	static get ANIM_SPEED_WAVE() {
		return 8;
	}

	/**
	 * @returns {number} the looping wave animation speed in frames per second.
	 * @constant
	 */
	static get ANIM_SPEED_WAVE_LOOP() {
		return 3;
	}

	/**
	 * @returns {number} the base horizontal movement speed of the player.
	 * @constant
	 */
	static get MOVE_SPEED() {
		return 0.06;
	}

	/**
	 * @returns {number} the minimum duration in seconds before the player performs a 'look around' idle action.
	 * @constant
	 */
	static get IDLE_LOOK_DURATION_MIN() {
		return 2;
	}

	/**
	 * @returns {number} the maximum duration in seconds before the player performs a 'look around' idle action.
	 * @constant
	 */
	static get IDLE_LOOK_DURATION_MAX() {
		return 8;
	}

	/**
	 * @returns {number} the duration in seconds of continuous idle time before the player starts waving.
	 * @constant
	 */
	static get IDLE_WAVE_DURATION() {
		return 60;
	}

	/**
	 * @returns {Object} the dimensions of a single player sprite in the spritesheet.
	 * @constant
	 */
	static get SPRITE_RESOLUTION() {
		return Engine.LJS.vec2(11, 34);
	}

	/**
	 * @returns {number} the amount of padding between sprites in the spritesheet.
	 * @constant
	 */
	static get SPRITE_PADDING() {
		return 1;
	}

	/**
	 * @returns {number} the distance from the map bounds where the player begins to slow down.
	 * @constant
	 */
	static get BOUNDS_BUFFER() {
		return 1.5;
	}

	/**
	 * Updates the player's state and position each frame.
	 */
	update() {
		if (Router.currentMode !== 'game') {
			return;
		}

		let moveDir = LayeredInput.isActive(LayeredInput.LAYER_GAME) ? Input.axis.x : 0;
		let speedMult = 1;

		const bounds = GameBridge.mapBounds;
		if (bounds) {
			if (this.pos.x < bounds.minX + Player.BOUNDS_BUFFER && moveDir < 0) {
				speedMult = Math.max(0, (this.pos.x - bounds.minX) / Player.BOUNDS_BUFFER);
			} else if (this.pos.x > bounds.maxX - Player.BOUNDS_BUFFER && moveDir > 0) {
				speedMult = Math.max(0, (bounds.maxX - this.pos.x) / Player.BOUNDS_BUFFER);
			}

			if (this.pos.x < bounds.minX) {
				this.pos.x = bounds.minX;
			}
			if (this.pos.x > bounds.maxX) {
				this.pos.x = bounds.maxX;
			}

			if (speedMult < 0.2 && moveDir !== 0) {
				moveDir = 0;
			}
		}

		switch (this.currentState) {
			case 'walk': {
				this.velocity.x = moveDir * this.moveSpeed * speedMult;

				if (moveDir === 0) {
					this.setState('stopping');
				} else {
					this.facingLeft = moveDir < 0;
				}
				break;
			}
			case 'stopping': {
				this.velocity.x *= 0.8;

				if (moveDir !== 0) {
					this.setState('walk');
					this.facingLeft = moveDir < 0;
				}

				const stopDuration = 8 / Player.ANIM_SPEED_STOP;
				if (this.animTimer.get() > stopDuration) {
					this.setState('idle');
				}
				break;
			}
			case 'idle': {
				this.velocity.x *= 0.8;

				if (moveDir !== 0) {
					this.setState('walk');
					this.facingLeft = moveDir < 0;
				} else if (this.totalIdleTimer.get() >= Player.IDLE_WAVE_DURATION) {
					this.setState('wave');
				} else if (!this.isLookingAround && this.idleLookTimer.elapsed()) {
					this.isLookingAround = true;
					this.setState('idle_look');
				}
				break;
			}
			case 'idle_look': {
				this.velocity.x *= 0.8;

				if (moveDir !== 0) {
					this.setState('walk');
					this.facingLeft = moveDir < 0;
				} else {
					const anim = this.animations['idle_look'];
					if (this.animTimer.get() > anim.frames.length / anim.speed) {
						this.isLookingAround = false;
						this.setState('idle');
					}
				}
				break;
			}
			case 'front_interact_stopping': {
				this.velocity.x *= 0.8;

				const anim = this.animations['front_interact_stopping'];
				if (this.animTimer.get() > anim.frames.length / anim.speed) {
					this.setState('front_interact');
				}
				break;
			}
			case 'behind_interact':
			case 'front_interact': {
				this.velocity.x *= 0.8;
				break;
			}
			case 'wave_start': {
				this.velocity.x *= 0.8;

				if (moveDir !== 0) {
					this.setState('walk');
					this.facingLeft = moveDir < 0;
					break;
				}

				const anim = this.animations['wave_start'];
				if (this.animTimer.get() > anim.frames.length / anim.speed) {
					this.setState('wave');
				}
				break;
			}
			case 'wave': {
				this.velocity.x *= 0.8;

				if (moveDir !== 0) {
					this.setState('walk');
					this.facingLeft = moveDir < 0;
				}
				break;
			}
			case 'wave_stop': {
				this.velocity.x *= 0.8;

				if (moveDir !== 0) {
					this.setState('walk');
					this.facingLeft = moveDir < 0;
					break;
				}

				const anim = this.animations['wave_stop'];
				if (this.animTimer.get() > anim.frames.length / anim.speed) {
					this.setState('idle');
				}
				break;
			}
		}

		this.mirror = !this.facingLeft;
		super.update();
	}

	/**
	 * Sets the player's current state animation, dynamically generating
	 * precise animation arrays for context-sensitive transitions.
	 * @param {string} newState - New state to set.
	 * @param {number} [delayInSeconds=0] - Delay before playing animation.
	 * @param {boolean} [forceRestart=false] - Force animation to restart.
	 */
	setState(newState, delayInSeconds = 0, forceRestart = false) {
		if (this.currentState === 'stopping') {
			const frameOffset = Math.floor(this.animTimer.get() * Player.ANIM_SPEED_STOP);
			this.savedStopFrame = 11 + Math.min(frameOffset, 7);
		} else {
			this.savedStopFrame = null;
		}

		if (
			newState === 'walk'
			|| newState === 'stopping'
			|| newState === 'front_interact'
			|| newState === 'front_interact_stopping'
			|| newState === 'behind_interact'
		) {
			this.totalIdleTimer.set();
		}

		if (newState === 'wave') {
			if (this.currentState !== 'wave' && this.currentState !== 'wave_start') {
				newState = 'wave_start';
			}
		} else if (newState === 'idle') {
			if (this.currentState === 'wave' || this.currentState === 'wave_start') {
				newState = 'wave_stop';
			}
		}

		if (newState === 'idle_look') {
			const lookVariant = Engine.LJS.randInt(14);
			const frames = [];

			if (lookVariant <= 4) {
				frames.push(19);
			} else if (lookVariant <= 8) {
				frames.push(28);
			} else if (lookVariant <= 10) {
				frames.push(20, 21, 22);
			} else if (lookVariant <= 12) {
				frames.push(22, 21, 20);
			} else if (lookVariant === 13) {
				frames.push(20);
			} else {
				frames.push(22);
			}

			this.addAnimation('idle_look', frames, Player.ANIM_SPEED_IDLE, false);
		} else if (newState === 'front_interact_stopping') {
			const startFrame = this.savedStopFrame || 12;
			const frames = [];
			for (let i = startFrame; i <= 16; i++) {
				frames.push(i);
			}
			this.addAnimation(
				'front_interact_stopping',
				frames,
				Player.ANIM_SPEED_INTERACT_FRONT_STOP,
				false
			);
		} else if (newState === 'behind_interact') {
			const startFrame =
				this.currentState === 'walk' || this.currentState === 'stopping' ? 24 : 23;
			const frames = [];
			for (let i = startFrame; i <= 27; i++) {
				frames.push(i);
			}
			this.addAnimation('behind_interact', frames, Player.ANIM_SPEED_INTERACT_BACK, false);
		} else if (newState === 'front_interact') {
			const startOffset = this.currentState === 'front_interact_stopping' ? 29 : 28;
			const frames = [];
			for (let i = startOffset; i <= 32; i++) {
				frames.push(i);
			}
			this.addAnimation('front_interact', frames, Player.ANIM_SPEED_INTERACT_FRONT, false);
		}

		super.setState(newState, delayInSeconds, forceRestart);

		this.isLookingAround = false;
		this.idleLookTimer.set(
			Engine.LJS.rand(Player.IDLE_LOOK_DURATION_MIN, Player.IDLE_LOOK_DURATION_MAX)
		);
	}

	/**
	 * Overrides AnimatedEntity's tile resolution to utilize LittleJS default spacing
	 * while caching the generated TileInfo object to prevent garbage collection leaks.
	 * @param {number} localTileIndex - The index of the tile in the spritesheet.
	 * @returns {Object} A TileInfo object representing the player's graphic.
	 */
	getTileInfo(localTileIndex) {
		if (!this.#tileCache[localTileIndex]) {
			this.#tileCache[localTileIndex] = Engine.LJS.tile(
				localTileIndex,
				Player.SPRITE_RESOLUTION,
				0,
				Player.SPRITE_PADDING
			);
		}
		return this.#tileCache[localTileIndex];
	}

	/**
	 * Request the behind-interact animation.
	 * @param {number} [duration=500] - milliseconds to wait while animation plays.
	 * @returns {Promise<void>} Resolves when the duration has elapsed.
	 */
	// fallow-ignore-next-line unused-class-member
	playBehindInteract(duration = 500) {
		if (this.currentState !== 'behind_interact') {
			this.setState('behind_interact');
		}
		return new Promise((resolve) => setTimeout(resolve, duration));
	}

	/**
	 * Request the front-interact animation.
	 * @param {number} [duration=800] - milliseconds to wait while animation plays.
	 * @returns {Promise<void>} Resolves when the duration has elapsed.
	 */
	// fallow-ignore-next-line unused-class-member
	playFrontInteract(duration = 800) {
		if (this.currentState === 'walk' || this.currentState === 'stopping') {
			if (this.currentState !== 'front_interact_stopping') {
				this.setState('front_interact_stopping');
			}
		} else {
			if (this.currentState !== 'front_interact') {
				this.setState('front_interact');
			}
		}
		return new Promise((resolve) => setTimeout(resolve, duration));
	}
}
