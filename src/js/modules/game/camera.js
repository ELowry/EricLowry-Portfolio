import { Engine } from '../core/engineContext.js';

/**
 * CameraController manages smooth camera following and time-based zoom transitions.
 */
class CameraController {
	/** @type {number|null} The target scale for camera zoom interpolations. */
	#targetScale = null;
	/** @type {number} The starting scale when a zoom begins. */
	#startScale = null;

	/** @type {number} The current Y-offset from the player. */
	#currentBaselineY;
	/** @type {number|null} The target Y-offset to interpolate towards. */
	#targetBaselineY = null;
	/** @type {number} The starting Y-offset when a zoom begins. */
	#startBaselineY = null;

	/** @type {Object|null} LittleJS Timer for the zoom transition. */
	#zoomTimer = null;
	/** @type {Function} The active easing function for zoom. */
	#zoomEase = null;
	/** @type {Function} The active easing function for panning. */
	#panEase = null;

	/**
	 * Creates an instance of CameraController.
	 */
	constructor() {
		this.#currentBaselineY = CameraController.BASELINE_Y;
	}

	/**
	 * @returns {number} The damping factor applied to camera movement smoothing.
	 * @constant
	 */
	static get DAMPING() {
		return 0.02;
	}

	/**
	 * @returns {number} The fractional width of the screen deadzone where the camera won't track the player.
	 * @constant
	 */
	static get DEADZONE_WIDTH() {
		return 0.04;
	}

	/**
	 * @returns {number} The default vertical offset of the camera relative to the player.
	 * @constant
	 */
	static get BASELINE_Y() {
		return 4;
	}

	/**
	 * @returns {number} The default zoom scale of the camera.
	 * @constant
	 */
	static get DEFAULT_SCALE() {
		return 32;
	}

	/**
	 * @returns {number} The visible width of the game world in world units based on current scale.
	 */
	get viewWidth() {
		return Engine.LJS.mainCanvasSize.x / Engine.LJS.cameraScale;
	}

	/**
	 * Sets the target zoom scale and pan behavior for the camera over time.
	 * @param {number} scale - Target scale (e.g., 64 for close up, 32 for default).
	 * @param {number} [duration=1] - Duration of the zoom in seconds.
	 * @param {Function|null} [ease=null] - Easing function (defaults to smoothStep).
	 * @param {number|null} [baselineY=null] - Target Y offset relative to player. If null, centers on player when zoomed in.
	 * @param {Function|null} [panEase=null] - Easing function for the Y panning (defaults to the zoom ease).
	 */
	setZoom(
		scale = CameraController.DEFAULT_SCALE,
		duration = 1.0,
		ease = null,
		baselineY = null,
		panEase = null
	) {
		this.#targetScale = scale;
		this.#startScale = Engine.LJS.cameraScale;

		this.#zoomEase = ease || Engine.LJS.smoothStep;
		this.#panEase = panEase || this.#zoomEase;

		this.#startBaselineY = this.#currentBaselineY;
		this.#targetBaselineY =
			baselineY !== null
				? baselineY
				: scale > CameraController.DEFAULT_SCALE
					? 0
					: CameraController.BASELINE_Y;

		if (!this.#zoomTimer) {
			this.#zoomTimer = new Engine.LJS.Timer();
		}
		this.#zoomTimer.set(duration);
	}

	/**
	 * Smoothly moves the camera to keep the player within the central deadzone.
	 * @param {Object} player - The player object with a `.pos` vec2 property
	 */
	follow(player) {
		if (this.#targetScale !== null && this.#zoomTimer) {
			if (this.#zoomTimer.elapsed()) {
				Engine.LJS.setCameraScale(this.#targetScale);
				this.#currentBaselineY = this.#targetBaselineY;
				this.#targetScale = null;
			} else {
				const percent = this.#zoomTimer.getPercent();
				const zoomEased = this.#zoomEase(percent);
				const panEased = this.#panEase(percent);

				const newScale = Engine.LJS.lerp(this.#startScale, this.#targetScale, zoomEased);
				Engine.LJS.setCameraScale(newScale);

				const startScreenOffset = this.#startBaselineY * this.#startScale;
				const targetScreenOffset = this.#targetBaselineY * this.#targetScale;
				const currentScreenOffset = Engine.LJS.lerp(
					startScreenOffset,
					targetScreenOffset,
					panEased
				);

				this.#currentBaselineY = currentScreenOffset / newScale;
			}
		}

		if (!player) {
			return;
		}

		const deadzoneX = this.viewWidth * CameraController.DEADZONE_WIDTH;
		const offset = player.pos.x - Engine.LJS.cameraPos.x;

		if (Math.abs(offset) > deadzoneX) {
			const drift = offset - Math.sign(offset) * deadzoneX;
			Engine.LJS.cameraPos.x += drift * CameraController.DAMPING;
		}

		Engine.LJS.cameraPos.y = player.pos.y + this.#currentBaselineY;
	}
}

export const Camera = new CameraController();
