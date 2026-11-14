import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	// Unit tests run under plain mocha (npm run test:unit). This config drives
	// only the hosted VS Code integration suite.
	files: 'out/test/integration/**/*.test.js',
	mocha: {
		ui: 'bdd',
		timeout: 30000,
	},
});
