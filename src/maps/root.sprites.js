import { Engine } from '../js/modules/core/engineContext.js';

export default {
	shared: {},
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
			isAnimated: false,
			get resolution() {
				return Engine.LJS.vec2(19, 7);
			},
			get offset() {
				return Engine.LJS.vec2(209, 63);
			},
		},
		promptFrame: {
			isAnimated: false,
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
	},
};
