import { Engine } from '../js/modules/core/engineContext.js';

/**
 * Root sprite definitions.
 * @type {import('../js/modules/game/propManager.js').SpriteConfig}
 */
export default {
	shared: {
		doorFront: {
			resolution: Engine.LJS.vec2(16, 35),
			offset: Engine.LJS.vec2(0, 36),
			cols: 5,
			animDelayOpen: 24,
			animSpeedOpen: 12,
			yOffset: -0.25,
			shadowBaselineOffset: 0.3,
			framesOpening: [1, 2, 3],
			framesOpen: [3],
			highlightConfig: {
				resolution: Engine.LJS.vec2(20, 35),
				offset: Engine.LJS.vec2(72, 36),
				renderOffset: Engine.LJS.vec2(0, 0.1),
			},
		},
		doorBehind: {
			resolution: Engine.LJS.vec2(21, 35),
			offset: Engine.LJS.vec2(94, 36),
			cols: 4,
			animDelayOpen: 20,
			animSpeedOpen: 10,
			yOffset: -0.4,
			shadowBaselineOffset: 0.3,
			framesOpening: [1, 2, 3],
			framesOpen: [3],
			highlightConfig: {
				resolution: Engine.LJS.vec2(20, 35),
				offset: Engine.LJS.vec2(186, 36),
				renderOffset: Engine.LJS.vec2(-0.2, -0.2),
			},
		},
		templeDoor: {
			isAnimated: false,
			resolution: Engine.LJS.vec2(0.1, 0.1),
			offset: Engine.LJS.vec2(0, 0),
			shadowType: 'none',
			highlightConfig: {
				resolution: Engine.LJS.vec2(53, 65),
				offset: Engine.LJS.vec2(252, 181),
				renderOffset: Engine.LJS.vec2(0, 4.44),
			},
		},
		sign: {
			resolution: Engine.LJS.vec2(20, 19),
			offset: Engine.LJS.vec2(230, 52),
			shadowType: 'floor',
			highlightConfig: {
				resolution: Engine.LJS.vec2(22, 11),
				offset: Engine.LJS.vec2(252, 52),
				renderOffset: Engine.LJS.vec2(0, 0.5),
			},
		},
	},
	local: {
		boxes: {
			isAnimated: false,
			get resolution() {
				return Engine.LJS.vec2(19, 12);
			},
			get offset() {
				return Engine.LJS.vec2(208, 36);
			},
		},
		boxWarning: {
			isAnimated: false,
			get resolution() {
				return Engine.LJS.vec2(19, 10);
			},
			get offset() {
				return Engine.LJS.vec2(209, 50);
			},
		},
		signWarning: {
			isAnimated: false,
			get resolution() {
				return Engine.LJS.vec2(20, 14);
			},
			get offset() {
				return Engine.LJS.vec2(230, 36);
			},
		},
		dirtPiles: {
			shadowBaselineOffset: 0.1,
			isAnimated: false,
			get resolution() {
				return Engine.LJS.vec2(19, 7);
			},
			get offset() {
				return Engine.LJS.vec2(209, 63);
			},
		},
		promptFrame: {
			shadowType: 'wall',
			isAnimated: false,
			anchor: { x: 0.5, y: 0.5 },
			get resolution() {
				return Engine.LJS.vec2(30, 14);
			},
			get offset() {
				return Engine.LJS.vec2(252, 36);
			},
		},
		promptHorizontalLeft: {
			entityType: 'inputPrompt',
			logicalKey: 'A',
			anchor: { x: 0.5, y: 0.5 },
			get resolution() {
				return Engine.LJS.vec2(9, 9);
			},
			get offset() {
				return Engine.LJS.vec2(284, 36);
			},
			cols: 4,
			animations: {
				mnk: {
					keys: {
						A: 2,
						Q: 3,
						default: 0,
					},
					speed: 0,
					loop: false,
				},
				gamepad_default: { frames: [0], speed: 0, loop: false },
				gamepad_ps: { frames: [0], speed: 0, loop: false },
				gamepad_switch: { frames: [0], speed: 0, loop: false },
				touch: { frames: [1], speed: 0, loop: false },
			},
		},
		promptHorizontalRight: {
			entityType: 'inputPrompt',
			logicalKey: 'D',
			anchor: { x: 0.5, y: 0.5 },
			get resolution() {
				return Engine.LJS.vec2(9, 9);
			},
			get offset() {
				return Engine.LJS.vec2(328, 36);
			},
			cols: 5,
			animations: {
				mnk: {
					keys: {
						D: 2,
						E: 3,
						S: 4,
						default: 0,
					},
					speed: 0,
					loop: false,
				},
				gamepad_default: { frames: [0], speed: 0, loop: false },
				gamepad_ps: { frames: [0], speed: 0, loop: false },
				gamepad_switch: { frames: [0], speed: 0, loop: false },
				touch: { frames: [1], speed: 0, loop: false },
			},
		},
		gameCenter: {
			isAnimated: false,
			get resolution() {
				return Engine.LJS.vec2(127, 178);
			},
			get offset() {
				return Engine.LJS.vec2(0, 73);
			},
		},
		architecture: {
			isAnimated: false,
			get resolution() {
				return Engine.LJS.vec2(121, 110);
			},
			get offset() {
				return Engine.LJS.vec2(129, 181);
			},
		},
		// Doors
		slidingDouble: {
			resolution: Engine.LJS.vec2(49, 55),
			radius: 2.8,
			offset: Engine.LJS.vec2(129, 73),
			cols: 4,
			animDelayOpen: 24,
			animSpeedOpen: 12,
			yOffset: -0.56,
			shadowType: 'none',
			framesOpening: [1, 2, 3],
			framesOpen: [3],
			highlightConfig: {
				// Currently set for the Game arcade sign design, may need to create a generic version if reused and overwritten in the map's .config.js
				resolution: Engine.LJS.vec2(50, 19),
				offset: Engine.LJS.vec2(276, 52),
				renderOffset: Engine.LJS.vec2(0.05, 3.56),
			},
		},
	},
};
