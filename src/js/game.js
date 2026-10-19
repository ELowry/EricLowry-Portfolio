import { Engine } from './modules/core/engineContext.js';
import { Camera } from './modules/game/camera.js';
import { Dialog } from './modules/game/dialog.js';
import { GameBridge } from './modules/game/gameBridge.js';
import { Interaction } from './modules/game/interaction.js';
import { Player } from './modules/game/player.js';

/** @type {Player|null} The player character instance. */
let player;

/** @type {HTMLElement|null} Cache for the game layer DOM element to optimize the render loop. */
let gameLayerElement = null;

/**
 * Initializes the game world and player.
 * Called once by LittleJS engine on startup.
 */
function gameInit() {
	const startX = Engine.pendingStartPos ? Engine.pendingStartPos.x : 0;
	const startY = Engine.pendingStartPos ? Engine.pendingStartPos.y : 0;

	player = new Player(Engine.LJS.vec2(startX, startY));
	const halfHeight = player.size.y / 2;
	player.pos.y += halfHeight;

	if (import.meta.env.DEV) {
		player.anchorPos = Engine.LJS.vec2(startX, startY);
	}

	// LittleJS configuration
	Engine.LJS.setEnablePhysicsSolver(false);
	Engine.LJS.setGamepadDirectionEmulateStick(false);
	Engine.LJS.setInputWASDEmulateDirection(true);

	Engine.LJS.setCameraPos(player.pos);

	if (import.meta.env.DEV) {
		player.anchorPos = Engine.LJS.vec2(startX, startY);
	}

	// Register game-level implementations with GameBridge so the rest of the app can delegate game-specific behavior without creating circular imports.
	GameBridge.init(
		{
			teleportPlayer: (pos) => {
				if (!player) {
					return;
				}
				const hHeight = player.size.y / 2;
				player.pos = Engine.LJS.vec2(pos.x, pos.y + hHeight);

				if (import.meta.env.DEV) {
					player.anchorPos = Engine.LJS.vec2(pos.x, pos.y);
				}

				Engine.LJS.setCameraPos(player.pos);
				if (typeof player.setState === 'function') {
					player.setState('idle');
				}
			},
			getPlayerPos: () => {
				if (!player) {
					return null;
				}
				const hHeight = player.size.y / 2;
				return { x: player.pos.x, y: player.pos.y - hHeight };
			},
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

			playIntroCinematic: () => {
				Dialog.playIntro(player, (mode) => {
					if (window.App) {
						window.App.setMode(mode);
					}
				});
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
	if (!document.hasFocus() || !GameBridge.isGameModeActive) {
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
		Engine.appUpdate();
		Engine.handleInput();
	}

	Engine.LJS.setPaused(!GameBridge.isGameModeActive);
	Engine.LJS.setInputPreventDefault(GameBridge.shouldPreventInput);

	if (!player) {
		return;
	}

	if (GameBridge.isGameModeActive && Engine.isRunning) {
		Interaction.update(player.pos);
		Camera.follow(player);
	}

	// Run the dialog system
	Dialog.update();
}

/**
 * Renders the game world and interactive objects.  
 * Called each frame by LittleJS engine.
 */
function gameRender() {
	if (!GameBridge.isGameModeActive) {
		return;
	}

	const groundY = GameBridge.horizonY;
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

	Interaction.render();
}

/**
 * Post-render logic.
 * Called each frame by LittleJS engine after `gameRender`.
 */
function gameRenderPost() {
	if (!GameBridge.isGameModeActive || Engine.isPaused) {
		return;
	}

	// Debug anchor points
	if (import.meta.env.DEV && Engine.LJS.debugOverlay) {
		for (const obj of Engine.LJS.engineObjects) {
			if (obj) {
				const drawPos = obj.anchorPos || obj.pos;
				if (drawPos) {
					Engine.LJS.debugPoint(drawPos, new Engine.LJS.Color(1, 1, 0, 0.8));
				}
			}
		}

		if (GameBridge.debugGroups) {
			for (const group of GameBridge.debugGroups) {
				const pos = Engine.LJS.vec2(group.pos.x, group.pos.y);
				Engine.LJS.debugPoint(pos, new Engine.LJS.Color(0, 0, 1, 1));
				Engine.LJS.debugText(
					group.name ?? 'GROUP',
					Engine.LJS.vec2(pos.x, pos.y + 0.8),
					0.5,
					new Engine.LJS.Color(0, 0, 1, 1)
				);
			}
		}
	}
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
