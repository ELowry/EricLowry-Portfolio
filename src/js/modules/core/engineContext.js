/**
 * EngineContext holds the LittleJS engine reference.
 * Decouples game subsystems from the main application controller.
 */
class EngineContext {
	/** @type {Object|null} The LittleJS engine namespace. */
	LJS = null;

	/**
	 * Creates an instance of EngineContext.
	 */
	constructor() {
		this.LJS = null;
	}

	/**
	 * Sets the active LittleJS engine namespace.
	 * @param {Object} engine - The LittleJS engine instance.
	 */
	setEngine(engine) {
		this.LJS = engine;
	}
}

export const Engine = new EngineContext();
