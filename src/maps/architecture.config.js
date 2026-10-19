/**
 * Map configuration for Architecture.
 * @type {import('../js/modules/content/contentTree.js').MapConfig}
 */
export default {
	startPos: { x: 10, y: 0 },
	positions: {
		parent_exit: {
			x: 10,
			y: -1.1,
			doorSpriteType: 'templeDoorBack',
		},
		architecture: { x: 12, y: 0.4 },
		'3Dgallery': { x: 14, y: 0.4 },
		projects: { x: 8, y: 1 },
	},
	props: [
		{ type: 'templeOpeningLight', pos: { x: 13, y: -1.1 }, renderOrder: -2 },
		{ type: 'templeOpeningLight', pos: { x: 7, y: -1.1 }, renderOrder: -2 },
	],
};
