import { Engine } from './modules/core/engineContext.js';
import { LayeredInput } from './modules/core/layeredInputs.js';
import { Router } from './modules/core/router.js';
import { Camera } from './modules/game/camera.js';
import { GameBridge } from './modules/game/gameBridge.js';
import { Interaction } from './modules/game/interaction.js';
import { Player } from './modules/game/player.js';
import { Input } from './modules/input/input.js';
import { VirtualCursor } from './modules/input/virtualCursor.js';

/** @type {Player|null} The player character instance. */
let player;

/** @type {HTMLElement|null} Cache for the game layer DOM element to optimize the render loop. */
let gameLayerElement = null;

/**
 * Initializes the game world and player.
 * Called once by LittleJS engine on startup.
 */
function gameInit() {
	const startX = Engine.pendingStartPos ? Engine.pendingStartPos.x : 10;
	const startY = Engine.pendingStartPos ? Engine.pendingStartPos.y : 10;
	const startVec = Engine.LJS.vec2(startX, startY);

	// LittleJS configuration
	Engine.LJS.setEnablePhysicsSolver(false);
	Engine.LJS.setGamepadDirectionEmulateStick(false);
	Engine.LJS.setInputWASDEmulateDirection(true);

	Engine.LJS.setCameraPos(startVec);
	player = new Player(startVec);

	// Register game-level implementations with GameBridge so the rest of the app can delegate game-specific behavior without creating circular imports.
	GameBridge.init(
		{
			teleportPlayer: (pos) => {
				if (!player) {
					return;
				}
				player.pos = Engine.LJS.vec2(pos.x, pos.y);
				Engine.LJS.setCameraPos(player.pos);
				if (typeof player.setState === 'function') {
					player.setState('idle');
				}
			},
			getPlayerPos: () => (player ? player.pos : null),
			setPlayerTexture: (index) => {
				if (player) {
					player.textureIndex = index;
				}
			},
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
		},
		import.meta.env.DEV
	);
}

/**
 * Main game update loop.
 * Called each frame by LittleJS engine.
 */
function gameUpdate() {
	if (!document.hasFocus() || Router.currentMode !== 'game') {
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
		VirtualCursor.update();
		Engine.handleInput();
	}

	Engine.LJS.setPaused(Router.currentMode !== 'game');
	Engine.LJS.setInputPreventDefault(LayeredInput.isActive(LayeredInput.LAYER_GAME));

	if (!player) {
		return;
	}

	if (Router.currentMode === 'game' && Engine.isRunning) {
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
	if (Router.currentMode === 'text') {
		return;
	}

	const groundY = player ? player.pos.y - 0.45 : 8.72;
	const horizonScreenPos = Engine.LJS.worldToScreen(Engine.LJS.vec2(0, groundY));
	const horizonPercent = Math.max(
		0,
		Math.min(100, (horizonScreenPos.y / Engine.LJS.mainCanvasSize.y) * 100)
	);

	if (!gameLayerElement) {
		gameLayerElement = document.getElementById('game-layer');
	}

	if (gameLayerElement) {
		gameLayerElement.style.setProperty('--horizon-pos', `${horizonPercent}%`);
	}

	if (Router.currentMode !== 'game') {
		return;
	}

	Interaction.render();
}

/**
 * Post-render logic.
 * Called each frame by LittleJS engine after `gameRender`.
 */
function gameRenderPost() {
	if (Router.currentMode === 'text' || Engine.isPaused) {
		return;
	}
	// These are not the renders you are looking for.
}

/**
 * Initialize LittleJS into the `#game-layer` DOM object.
 */
function initLittleJS() {
	const gameLayer = document.getElementById('game-layer');
	if (!gameLayer) {
		return;
	}

	// Prevent duplicate engine instances
	if (gameLayer.querySelector('canvas')) {
		console.log('LittleJS already initialized, skipping.');
		return;
	}

	Engine.LJS.engineInit(
		gameInit,
		gameUpdate,
		gameUpdatePost,
		gameRender,
		gameRenderPost,
		// Assets that can be referenced by ID within LittleJS.
		['/assets/sprites/main.png'],
		gameLayer
	);
}

/* EXECUTE INITIALIZATION */

// Prevent LittleJS from logging its version in production.
if (import.meta.env.DEV) {
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
