import { Engine } from '../js/modules/core/engineContext.js';

/**
 * Gaming sprite definitions.
 * @type {import('../js/modules/game/propManager.js').SpriteConfig}
 */
export default {
	local: {
		// Doors
		slidingDoubleBack: {
			resolution: Engine.LJS.vec2(49, 49),
			offset: Engine.LJS.vec2(129, 130),
			cols: 4,
			animDelayOpen: 24,
			animSpeedOpen: 12,
			shadowType: 'none',
			framesOpening: [1, 2, 3],
			framesOpen: [3],
			highlightConfig: {
				resolution: Engine.LJS.vec2(55, 49),
				offset: Engine.LJS.vec2(333, 130),
				renderOffset: Engine.LJS.vec2(0, 0),
			},
		},
	},
};
