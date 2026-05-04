import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

/**
 * A simple Vite plugin to exclude specific folders from the final build output.
 * Since Vite's publicDir copy is all-or-nothing, this cleans up unwanted meta-folders.
 * @param {string[]} folders - Array of folder names to exclude from dist.
 * @returns {import('vite').Plugin}
 */
function excludePublicFolders(folders) {
	return {
		name: 'exclude-public-folders',
		apply: 'build',
		closeBundle() {
			folders.forEach((folder) => {
				const fullPath = path.resolve('dist', folder);
				if (fs.existsSync(fullPath)) {
					fs.rmSync(fullPath, { recursive: true, force: true });
				}
			});
		},
	};
}

export default defineConfig(({ mode }) => {
	return {
		resolve: {
			preserveSymlinks: true,
			alias: {
				$littlejs: path.resolve(
					process.cwd(),
					mode === 'production'
						? 'node_modules/littlejsengine/dist/littlejs.esm.min.js'
						: 'node_modules/littlejsengine/dist/littlejs.esm.js'
				),
			},
		},
		plugins: [excludePublicFolders(['obsidian', '.obsidian'])],
		server: {
			fs: {
				deny: [
					'.env',
					'.env.*',
					'*.{crt,pem}',
					'**/obsidian/**',
					'**/.obsidian/**',
					'.vault-nickname',
				],
			},
		},
		css: {
			transformer: 'lightningcss',
		},
		build: {
			outDir: 'dist',
			emptyOutDir: true,
			cssMinify: 'lightningcss',
			rollupOptions: {
				output: {
					manualChunks(id) {
						if (id.includes('.config.js')) {
							return 'configs';
						}
					},
				},
			},
		},
	};
});
