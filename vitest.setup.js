import { vi } from 'vitest';

// Mocks the CSS object for JSDOM
vi.stubGlobal('CSS', {
	supports: () => false,
});
