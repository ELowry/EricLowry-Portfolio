import { App } from '../app.js';

/**
 * CameraController manages smooth camera following with a deadzone.
 */
class CameraController {
	constructor() {
		this.damping = 0.02;
		this.deadzoneWidth = 0.04;
		this.baselineY = 4;
	}

	/**
	 * Returns the current width of the viewport in world units.
	 * @returns {number} Viewport width
	 */
	get viewWidth() {
		return App.LJS.mainCanvasSize.x / App.LJS.cameraScale;
	}

	/**
	 * Smoothly moves the camera to keep the player within the central deadzone.
	 * @param {Object} player - The player object with a `.pos` vec2 property
	 */
	follow(player) {
		if (!player) {
			return;
		}

		const deadzoneX = this.viewWidth * this.deadzoneWidth;
		const offset = player.pos.x - App.LJS.cameraPos.x;

		if (Math.abs(offset) > deadzoneX) {
			const drift = offset - Math.sign(offset) * deadzoneX;
			App.LJS.cameraPos.x += drift * this.damping;
		}

		App.LJS.cameraPos.y = player.pos.y + this.baselineY;
	}
}

export const Camera = new CameraController();
