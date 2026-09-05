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
	},
};
