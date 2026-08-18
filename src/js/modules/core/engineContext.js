/**
 * EngineContext holds the LittleJS engine reference and shared game engine state.
 * Decouples game subsystems from the main application controller.
 */
class EngineContext {
	/** @type {Object|null} The LittleJS engine namespace. */
	LJS = null;

	/** @type {boolean} Whether the game is currently paused. */
	isPaused = false;

	/** @type {{x: number, y: number}|null} Pending player start position. */
	pendingStartPos = null;

	/** @type {Function|null} Callback to handle input from the main application. */
	onHandleInput = null;

	/**
	 * Creates an instance of EngineContext.
	 */
	constructor() {
		this.LJS = null;
		this.isPaused = false;
		this.pendingStartPos = null;
		this.onHandleInput = null;
	}

	/**
	 * `true` if the game engine is actively updating and rendering.
	 * @returns {boolean} whether the game engine is running.
	 */
	get isRunning() {
		return !this.isPaused;
	}

	/**
	 * Sets the active LittleJS engine namespace.
	 * @param {Object} engine - The LittleJS engine instance.
	 */
	setEngine(engine) {
		this.LJS = engine;
	}

	/**
	 * Invokes the registered input handler callback if available.
	 */
	handleInput() {
		if (typeof this.onHandleInput === 'function') {
			this.onHandleInput();
		}
	}
}

export const Engine = new EngineContext();
