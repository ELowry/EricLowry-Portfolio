/**
 * Map configuration for Gaming.
 * @type {import('../js/modules/content/contentTree.js').MapConfig}
 */
export default {
	startPos: { x: 10, y: 0 },
	positions: {
		parent_exit: {
			x: 10,
			y: -1.1,
			doorSpriteType: 'slidingDoubleBack',
		},
		gaming: { x: 14, y: 0.4 },
		CinQ: { x: 6, y: 0.4 },
		InputLayers: { x: 16, y: 0.4 },
		Unstant: { x: 4, y: 0.4 },
	},
};
