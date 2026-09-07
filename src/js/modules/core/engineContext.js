/**
 * Holds the LittleJS engine reference and shared game engine state.  
 * Decouples game code from `app.js`.
 */
class EngineContext {
	/**
	 * The LittleJS engine.
	 * @type {Object|null}
	 */
	LJS = null;

	/**
	 * Whether the game is currently paused.
	 * @type {boolean}
	 */
	isPaused = false;

	/**
	 * Pending player start position.
	 * @type {{x: number, y: number}|null}
	 */
	pendingStartPosition = null;

	/**
	 * Callback to handle input from the main application.
	 * @type {Function|null}
	 */
	onHandleInput = null;

	constructor() {
		this.LJS = null;
		this.isPaused = false;
		this.pendingStartPosition = null;
		this.onHandleInput = null;
	}

	/**
	 * @returns {boolean} whether the game engine is actively updating and rendering.
	 */
	get isRunning() {
		return !this.isPaused;
	}

	/**
	 * Sets the active LittleJS engine.
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
