import { describe, it, expect, beforeAll } from 'vitest';
import { Content } from './content.js';

describe('ContentController', () => {
	// We run init() first to populate the internal #fileToPaths map. This might log a console error if mapLoader dynamic imports fail in the test environment, but it will still traverse the tree and build the paths correctly.
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
			const node = Content.findNodeByPath('architecture/projects/Unstant');
			expect(node).not.toBeNull();
			expect(node.id).toBe('Unstant');
			expect(node.file).toBe('gaming/Unstant.md');
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
			const parent = Content.getParentMapNode('architecture/projects/Unstant');
			expect(parent).not.toBeNull();
			expect(parent.id).toBe('projects');
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
});
