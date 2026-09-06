import { Engine } from '../core/engineContext.js';
import { WithShadows } from './mixins/withShadows.js';

/**
 * Base class for all animated game objects.
 * Extends LittleJS `EngineObject` to provide a robust state machine and sub-grid sprite rendering.
 */
export class AnimatedEntity extends WithShadows(Engine.LJS.EngineObject) {
	/** @type {string} */
	currentState;

	/** @type {string} */
	prevState;

	/** @type {Object} */
	animTimer;

	/** @type {Object<string, Object>} */
	animations;

	/** @type {number} */
	textureIndex;

	/** @type {Object} */
	spriteResolution;

	/** @type {Object} */
	gridOffset;

	/** @type {number} */
	gridCols;

	/** @type {Array<Object>} */
	#tileCache;

	/**
	 * @returns {number} the universal transparent padding around every packed sprite frame.
	 * @constant
	 */
	static get SPRITE_PADDING() {
		return 1;
	}

	/**
	 * @param {Object} pos - The world position.
	 * @param {Object} size - The physical size.
	 * @param {number} textureIndex - The sprite sheet index.
	 * @param {Object} spriteResolution - The pixel dimensions of a single frame (inner bounds).
	 * @param {number} [renderOrder=0] - Z-index sorting order.
	 */
	constructor(pos, size, textureIndex, spriteResolution, renderOrder = 0) {
		super(pos, size, undefined, 0, new Engine.LJS.Color(1, 1, 1), renderOrder);

		this.currentState = 'idle';
		this.prevState = 'idle';
		this.animTimer = new Engine.LJS.Timer();
		this.prevAnimTime = 0;
		this.currentDelay = 0;
		this.animations = {};
		this.textureIndex = textureIndex;
		this.spriteResolution = spriteResolution;
		this.gridOffset = Engine.LJS.vec2(0, 0);
		this.gridCols = 1;
		this.shadowType = null;

		this.#tileCache = [];
	}

	/**
	 * Updates the entity state.
	 * @returns {void}
	 */
	update() {
		super.update();
	}

	/**
	 * Renders the current frame of the active animation state and its shadow.
	 * @returns {void}
	 */
	render() {
		let activeState = this.currentState;
		let timeElapsed = this.animTimer.get();

		if (timeElapsed < 0 && this.prevState) {
			activeState = this.prevState;
			timeElapsed = this.prevAnimTime + (this.currentDelay + timeElapsed);
		}

		const anim = this.animations[activeState];
		if (!anim) {
			return;
		}

		let frameIndex = 0;

		if (anim.speed > 0 && timeElapsed > 0) {
			const elapsedFrames = Math.floor(timeElapsed * anim.speed);
			if (anim.loop) {
				frameIndex = elapsedFrames % anim.frames.length;
			} else {
				frameIndex = Math.min(elapsedFrames, anim.frames.length - 1);
			}
		}

		const localTileIndex = anim.frames[frameIndex];
		const tileInfo = this.getTileInfo(localTileIndex);

		this.renderShadow(tileInfo);

		Engine.LJS.drawTile(this.pos, this.size, tileInfo, this.color, this.angle, this.mirror);
	}

	/**
	 * Calculates and caches the TileInfo pixel coordinates for a specific frame index.
	 * @param {number} localTileIndex - The index of the frame in the animation grid.
	 * @returns {Object} The cached TileInfo object.
	 */
	getTileInfo(localTileIndex) {
		if (this.#tileCache[localTileIndex]) {
			return this.#tileCache[localTileIndex];
		}

		const col = localTileIndex % this.gridCols;
		const row = Math.floor(localTileIndex / this.gridCols);

		const padding = AnimatedEntity.SPRITE_PADDING;
		const strideX = this.spriteResolution.x + padding * 2;
		const strideY = this.spriteResolution.y + padding * 2;

		const pixelX = this.gridOffset.x + col * strideX + padding;
		const pixelY = this.gridOffset.y + row * strideY + padding;

		const dummyTile = Engine.LJS.tile(0, this.spriteResolution, this.textureIndex);

		const tileInfo = new Engine.LJS.TileInfo(
			Engine.LJS.vec2(pixelX, pixelY),
			this.spriteResolution,
			dummyTile.textureInfo,
			padding
		);

		this.#tileCache[localTileIndex] = tileInfo;
		return tileInfo;
	}

	/**
	 * Registers a new animation sequence.
	 * @param {string} name - The state name.
	 * @param {Array<number>} frames - The ordered array of grid indexes.
	 * @param {number} speed - Playback speed in frames per second.
	 * @param {boolean} [loop=true] - Whether the animation loops.
	 * @returns {void}
	 */
	addAnimation(name, frames, speed, loop = true) {
		this.animations[name] = { frames, speed, loop };
	}

	/**
	 * Transitions the entity to a new animation state.
	 * @param {string} newState - The state to transition to.
	 * @param {number} [delayInSeconds=0] - Optional delay before the animation starts.
	 * @param {boolean} [forceRestart=false] - Force the timer to reset even if already in this state.
	 * @returns {void}
	 */
	setState(newState, delayInSeconds = 0, forceRestart = false) {
		if (this.currentState !== newState || forceRestart) {
			this.prevAnimTime = this.animTimer.get() > 0 ? this.animTimer.get() : 0;
			this.currentDelay = delayInSeconds;

			this.prevState = this.currentState;
			this.currentState = newState;
			this.animTimer.set(delayInSeconds);
		}
	}
}
