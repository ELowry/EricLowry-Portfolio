import { Engine } from '../core/engineContext.js';
import { LayeredInput } from '../core/layeredInputs.js';
import { Router } from '../core/router.js';
import { Input } from '../input/input.js';

/**
 * Player character controlled by user input.
 * Extends LittleJS `EngineObject` for positioning and rendering.
 */
export class Player extends Engine.LJS.EngineObject {
	/**
	 * Creates a new Player instance.
	 * @param {Vector2} pos - Initial position in world space
	 */
	constructor(pos) {
		super(pos, Engine.LJS.vec2(1, 2.9));

		this.moveSpeed = Player.MOVE_SPEED;
		this.color = new Engine.LJS.Color(1, 1, 1);
		this.state = 'idle';
		this.prevState = 'idle';
		this.facingLeft = true;
		this.stateTimer = new Engine.LJS.Timer();
		this.idleLookTimer = new Engine.LJS.Timer(
			Engine.LJS.rand(Player.IDLE_LOOK_DURATION_MIN, Player.IDLE_LOOK_DURATION_MAX)
		);
		this.isLookingAround = false;
		this.angle = 0;

		this.setCollision(true, true);
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
		return 10;
	}

	/**
	 * @returns {Vector2} the dimensions of a single player sprite in the spritesheet.
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
	 * Updates the player's state and position each frame.
	 */
	// fallow-ignore-next-line unused-class-member
	update() {
		if (Router.currentMode !== 'game') {
			return;
		}

		const moveDir = LayeredInput.isActive(LayeredInput.LAYER_GAME) ? Input.axis.x : 0;

		switch (this.state) {
			case 'walk': {
				this.velocity.x = moveDir * this.moveSpeed;

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
				if (this.stateTimer.get() > stopDuration) {
					this.setState('idle');
				}
				break;
			}
			case 'idle': {
				this.velocity.x *= 0.8;

				if (moveDir !== 0) {
					this.setState('walk');
					this.facingLeft = moveDir < 0;
				}

				if (!this.isLookingAround && this.idleLookTimer.elapsed()) {
					this.isLookingAround = true;
					this.stateTimer.set();
				}

				if (this.isLookingAround && this.stateTimer.get() > 3 / Player.ANIM_SPEED_IDLE) {
					this.isLookingAround = false;
					this.idleLookTimer.set(
						Engine.LJS.rand(
							Player.IDLE_LOOK_DURATION_MIN,
							Player.IDLE_LOOK_DURATION_MAX
						)
					);
				}
				break;
			}
			case 'front_interact_stopping': {
				this.velocity.x *= 0.8;
				const startFrame = this.savedStopFrame || 12;
				const localFrame = Math.floor(
					this.stateTimer.get() * Player.ANIM_SPEED_INTERACT_FRONT_STOP
				);
				if (startFrame + localFrame > 16) {
					this.setState('front_interact');
				}
				break;
			}
			case 'behind_interact':
			case 'front_interact': {
				this.velocity.x *= 0.8;
				break;
			}
		}

		super.update();
	}

	/**
	 * Renders the player using the current animation frame and orientation.
	 */
	render() {
		if (Router.currentMode !== 'game') {
			return;
		}

		let tileIndex = 21;

		switch (this.state) {
			case 'walk': {
				tileIndex = Math.floor(Engine.LJS.time * Player.ANIM_SPEED_WALK) % 12;
				break;
			}
			case 'stopping': {
				const frameOffset = Math.floor(this.stateTimer.get() * Player.ANIM_SPEED_STOP);
				tileIndex = 11 + Math.min(frameOffset, 7);
				break;
			}
			case 'idle': {
				if (this.isLookingAround) {
					const localFrame = Math.floor(this.stateTimer.get() * Player.ANIM_SPEED_IDLE);
					const lookSequence = [20, 21, 22];
					tileIndex = lookSequence[Math.min(localFrame, 2)];
				} else {
					tileIndex = 21;
				}
				break;
			}
			case 'behind_interact': {
				const startFrame =
					this.prevState === 'walk' || this.prevState === 'stopping' ? 24 : 23;
				const localFrame = Math.floor(
					this.stateTimer.get() * Player.ANIM_SPEED_INTERACT_BACK
				);
				tileIndex = Math.min(startFrame + localFrame, 27);
				break;
			}
			case 'front_interact_stopping': {
				const startFrame = this.savedStopFrame || 12;
				const localFrame = Math.floor(
					this.stateTimer.get() * Player.ANIM_SPEED_INTERACT_FRONT_STOP
				);
				tileIndex = Math.min(startFrame + localFrame, 16);
				break;
			}
			case 'front_interact': {
				const startOffset = this.prevState === 'front_interact_stopping' ? 29 : 28;
				const localFrame = Math.floor(
					this.stateTimer.get() * Player.ANIM_SPEED_INTERACT_FRONT
				);
				tileIndex = Math.min(startOffset + localFrame, 32);
				break;
			}
		}

		const playerTile = Engine.LJS.tile(
			tileIndex,
			Player.SPRITE_RESOLUTION,
			0,
			Player.SPRITE_PADDING
		);

		Engine.LJS.drawTile(this.pos, this.size, playerTile, this.color, 0, !this.facingLeft);
	}

	/**
	 * Sets the player's current state animation.
	 * @param {any} newState - New state to set
	 */
	setState(newState) {
		if (this.state === 'stopping') {
			const frameOffset = Math.floor(this.stateTimer.get() * Player.ANIM_SPEED_STOP);
			this.savedStopFrame = 11 + Math.min(frameOffset, 7);
		} else {
			this.savedStopFrame = null;
		}
		this.prevState = this.state;
		this.state = newState;
		this.stateTimer.set();
		this.isLookingAround = false;
		this.idleLookTimer.set(
			Engine.LJS.rand(Player.IDLE_LOOK_DURATION_MIN, Player.IDLE_LOOK_DURATION_MAX)
		);
	}

	/**
	 * Request the behind-interact animation and return a promise that resolves after the requested animation delay so callers can coordinate fade and navigation.
	 * @param {number} [duration=500] - milliseconds to wait while animation plays
	 * @returns {Promise<void>}
	 */
	// fallow-ignore-next-line unused-class-member
	playBehindInteract(duration = 500) {
		if (this.state !== 'behind_interact') {
			this.setState('behind_interact');
		}
		return new Promise((resolve) => setTimeout(resolve, duration));
	}

	/**
	 * Request the behind-interact animation and return a promise that resolves after the requested animation delay so callers can coordinate fade and navigation.
	 * Handles transition from walking/stopping by playing a stop sequence first.
	 * @param {number} [duration=800] - milliseconds to wait while animation plays
	 * @returns {Promise<void>}
	 */
	// fallow-ignore-next-line unused-class-member
	playFrontInteract(duration = 800) {
		if (this.state === 'walk' || this.state === 'stopping') {
			if (this.state !== 'front_interact_stopping') {
				this.setState('front_interact_stopping');
			}
		} else {
			if (this.state !== 'front_interact') {
				this.setState('front_interact');
			}
		}
		return new Promise((resolve) => setTimeout(resolve, duration));
	}
}
