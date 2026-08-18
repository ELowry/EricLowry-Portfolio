import { Engine } from '../core/engineContext.js';

/**
 * CameraController manages smooth camera following with a deadzone.
 */
class CameraController {
	/** @type {number} Camera damping factor */
	static get DAMPING() {
		return 0.02;
	}
	/** @type {number} Deadzone width factor */
	static get DEADZONE_WIDTH() {
		return 0.04;
	}
	/** @type {number} Camera baseline Y position */
	static get BASELINE_Y() {
		return 4;
	}

	/**
	 * Returns the current width of the viewport in world units.
	 * @returns {number} the viewport width
	 */
	get viewWidth() {
		return Engine.LJS.mainCanvasSize.x / Engine.LJS.cameraScale;
	}

	/**
	 * Smoothly moves the camera to keep the player within the central deadzone.
	 * @param {Object} player - The player object with a `.pos` vec2 property
	 */
	follow(player) {
		if (!player) {
			return;
		}

		const deadzoneX = this.viewWidth * CameraController.DEADZONE_WIDTH;
		const offset = player.pos.x - Engine.LJS.cameraPos.x;

		if (Math.abs(offset) > deadzoneX) {
			const drift = offset - Math.sign(offset) * deadzoneX;
			Engine.LJS.cameraPos.x += drift * CameraController.DAMPING;
		}

		Engine.LJS.cameraPos.y = player.pos.y + CameraController.BASELINE_Y;
	}
}

export const Camera = new CameraController();
