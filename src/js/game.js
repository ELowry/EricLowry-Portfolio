import { App } from './app.js';
import { Camera } from './modules/camera.js';
import { Player } from './modules/player.js';
import { Input } from './modules/input.js';
import { LayeredInput } from './modules/layeredInputs.js';
import { Interaction } from './modules/interaction.js';
import { GameBridge } from './modules/gameBridge.js';

let player;

/**
 * Initializes the game world and player.
 * Called once by LittleJS engine on startup.
 */
function gameInit() {
	const startX = App.pendingStartPos ? App.pendingStartPos.x : 10;
	const startY = App.pendingStartPos ? App.pendingStartPos.y : 10;
	const startVec = App.LJS.vec2(startX, startY);

	// LittleJS configuration
	App.LJS.setEnablePhysicsSolver(false);
	App.LJS.setGamepadDirectionEmulateStick(true);
	App.LJS.setInputWASDEmulateDirection(true);

	App.LJS.setCameraPos(startVec);
	player = new Player(startVec);

	// Register game-level implementations with GameBridge so the rest of the app can delegate game-specific behavior without creating circular imports.
	GameBridge.init({
		teleportPlayer: (pos) => {
			if (!player) {
				return;
			}
			player.pos = App.LJS.vec2(pos.x, pos.y);
			App.LJS.setCameraPos(player.pos);
			if (typeof player.setState === 'function') {
				player.setState('idle');
			}
		},
		getPlayerPos: () => (player ? player.pos : null),
		requestBehindInteract: (duration = 500) => {
			if (!player) {
				return Promise.resolve();
			}
			if (typeof player.playBehindInteract === 'function') {
				return player.playBehindInteract(duration);
			}
			return Promise.resolve();
		},
		requestFrontInteract: (duration = 800) => {
			if (!player) {
				return Promise.resolve();
			}
			if (typeof player.playFrontInteract === 'function') {
				return player.playFrontInteract(duration);
			}
			return Promise.resolve();
		},
	});
}

/**
 * Main game update loop.
 * Called each frame by LittleJS engine.
 */
function gameUpdate() {
	if (!document.hasFocus() || App.mode !== 'game') {
		return;
	}
}

/**
 * Post-update logic.
 * Used for camera and pause state management.
 * Called each frame by LittleJS engine after `gameUpdate`.
 */
function gameUpdatePost() {
	if (document.hasFocus()) {
		Input.update();
		App.handleInput();
	}

	App.LJS.setPaused(App.mode !== 'game');
	App.LJS.setInputPreventDefault(LayeredInput.isActive(LayeredInput.LAYER_GAME));

	if (!player) {
		return;
	}

	if (App.isRunning) {
		Interaction.update(player.pos);
		Camera.follow(player);
	}

	// Clear virtual inputs at the end of the frame
	Input.clearEvents();
}

/**
 * Renders the game world and interactive objects.
 * Called each frame by LittleJS engine.
 */
function gameRender() {
	if (App.mode === 'text') {
		return;
	}

	// HACK: Background color
	App.LJS.drawRect(
		App.LJS.vec2(100, 0),
		App.LJS.vec2(1000, 200),
		new App.LJS.Color(0.2, 0.2, 0.3)
	);

	if (App.mode !== 'game') {
		return;
	}

	Interaction.render();
}

/**
 * Post-render logic.
 * Called each frame by LittleJS engine after `gameRender`.
 */
function gameRenderPost() {
	if (App.mode === 'text' || App.isPaused) {
		return;
	}
	// These are not the renders you are looking for.
}

/**
 * Initialize LittleJS into the `#game-layer` DOM object.
 */
function initLittleJS() {
	// Prevent duplicate engine instances
	if (App.uiManager.elements.gameLayer.querySelector('canvas')) {
		console.log('LittleJS already initialized, skipping.');
		return;
	}

	App.LJS.engineInit(
		gameInit,
		gameUpdate,
		gameUpdatePost,
		gameRender,
		gameRenderPost,
		// Assets that can be referenced by ID within LittleJS.
		['/assets/sprites/eric.png'],
		App.uiManager.elements.gameLayer
	);
}

/* EXECUTE INITIALIZATION */

// Prevent LittleJS from logging its version in production.
if (App.isLocal) {
	initLittleJS();
} else {
	const originalLog = console.log;
	console.log = (...args) => {
		if (typeof args[0] === 'string' && args[0].includes('LittleJS Engine v')) {
			return;
		}
		originalLog.apply(console, args);
	};
	initLittleJS();
	console.log = originalLog;
}
