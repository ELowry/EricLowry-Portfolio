import { beforeAll, describe, expect, it } from 'vitest';

import { Content } from './content.js';

describe('ContentController', () => {
	// We run init() first to populate the internal #fileToPaths map. This might log a console error if map config dynamic imports fail in the test environment, but it will still traverse the tree and build the paths correctly.
	beforeAll(async () => {
		await Content.init();
	});

	describe('findNodeByPath', () => {
		it('should return the root tree if no path is provided', () => {
			const node = Content.findNodeByPath('');
			expect(node.id).toBe('root');
		});

		it('should find a top-level node', () => {
			const node = Content.findNodeByPath('about');
			expect(node).not.toBeNull();
			expect(node.id).toBe('about');
			expect(node.type).toBe('content');
		});

		it('should find a deeply nested node', () => {
			const node = Content.findNodeByPath('websites/lightweight-static/thenextmind');
			expect(node).not.toBeNull();
			expect(node.id).toBe('thenextmind');
			expect(node.file).toBe('websites/lightweight-static/thenextmind.md');
		});

		it('should handle case-insensitivity in the path', () => {
			const node = Content.findNodeByPath('ArChiTecTure/ProJeCts');
			expect(node).not.toBeNull();
			expect(node.id).toBe('projects');
		});

		it('should return null for completely invalid paths', () => {
			const node = Content.findNodeByPath('does/not/exist');
			expect(node).toBeNull();
		});
	});

	describe('getParentMapNode', () => {
		it('should return the category node if the path points to a content node', () => {
			const parent = Content.getParentMapNode('websites/lightweight-static/thenextmind');
			expect(parent).not.toBeNull();
			expect(parent.id).toBe('lightweight-static');
			expect(parent.type).toBe('category');
		});

		it('should return the node itself if the path already points to a category', () => {
			const node = Content.getParentMapNode('coaching-business/CinQ');
			expect(node).not.toBeNull();
			expect(node.id).toBe('CinQ');
			expect(node.type).toBe('category');
		});

		it('should return the root tree for empty paths or failed lookups', () => {
			expect(Content.getParentMapNode('').id).toBe('root');
			expect(Content.getParentMapNode('invalid/path').id).toBe('root');
		});
	});

	describe('findPathsByFile', () => {
		it('should return all tree paths associated with a specific markdown file', () => {
			const paths = Content.findPathsByFile('gaming/Unstant.md');
			expect(paths.length).toBe(2);
			expect(paths).toContain('architecture/projects/Unstant');
			expect(paths).toContain('gaming/Unstant');
		});

		it('should handle leading slashes gracefully', () => {
			const paths = Content.findPathsByFile('/osd/dns-toggle.md');
			expect(paths).toContain('osd/dns-toggle');
		});

		it('should return an empty array for a file that does not exist in the tree', () => {
			const paths = Content.findPathsByFile('ghost/file.md');
			expect(paths).toEqual([]);
			expect(Content.findPathsByFile('')).toEqual([]);
			expect(Content.findPathsByFile(null)).toEqual([]);
		});
	});

	describe('buildMapObjects', () => {
		it('should build interactive objects by combining child nodes and position data', () => {
			const mockMapNode = {
				id: 'mock-category',
				children: [
					{
						id: 'child-1',
						type: 'content',
						title: 'Child One',
						file: 'path/to/child1.md',
					},
					{ id: 'child-2', type: 'category', title: 'Child Two' },
				],
				mapData: {
					positions: {
						'child-1': { x: 10, y: 20, radius: 2, below: true },
						'child-2': { x: 30, y: 40, label: 'custom.label' },
					},
				},
			};

			const objects = Content.buildMapObjects(mockMapNode, 'parent/path');
			expect(objects.length).toBe(2);

			expect(objects[0]).toEqual({
				id: 'child-1',
				pos: { x: 10, y: 20 },
				radius: 2,
				label: 'Child One',
				below: true,
				path: 'parent/path/child-1',
				type: 'content',
				file: 'path/to/child1.md',
			});

			expect(objects[1]).toEqual({
				id: 'child-2',
				pos: { x: 30, y: 40 },
				radius: 1.5,
				label: 'custom.label',
				below: false,
				path: 'parent/path/child-2',
				type: 'category',
			});
		});

		it('should return an empty array if category is missing mapData or children', () => {
			expect(Content.buildMapObjects(null, '')).toEqual([]);
			expect(Content.buildMapObjects({ children: [] }, '')).toEqual([]);
			expect(Content.buildMapObjects({ mapData: {} }, '')).toEqual([]);
		});
	});
});
