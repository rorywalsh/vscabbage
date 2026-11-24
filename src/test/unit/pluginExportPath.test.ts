// Unit tests for the plugin export path helpers.
// Run with: npm run test:unit (plain mocha, no VS Code instance needed).
import assert from 'assert';
import {
    ensurePluginExtension,
    pluginExtensionForType,
    pluginNameFromPath,
} from '../../utils/pluginExportPath';

describe('pluginExtensionForType', () => {
    it('maps VST3 types (including ARA) to .vst3', () => {
        assert.strictEqual(pluginExtensionForType('VST3Effect'), '.vst3');
        assert.strictEqual(pluginExtensionForType('VST3Synth'), '.vst3');
        assert.strictEqual(pluginExtensionForType('VST3EffectARA'), '.vst3');
        assert.strictEqual(pluginExtensionForType('VST3SynthARA'), '.vst3');
    });

    it('maps CLAP types to .clap', () => {
        assert.strictEqual(pluginExtensionForType('CLAPEffect'), '.clap');
        assert.strictEqual(pluginExtensionForType('CLAPSynth'), '.clap');
    });

    it('maps AUv2 types to .component', () => {
        assert.strictEqual(pluginExtensionForType('AUv2Effect'), '.component');
        assert.strictEqual(pluginExtensionForType('AUv2Synth'), '.component');
        assert.strictEqual(pluginExtensionForType('AUv2MidiFx'), '.component');
    });
});

describe('ensurePluginExtension', () => {
    it('appends the VST3 extension when the save dialog omits it', () => {
        assert.strictEqual(
            ensurePluginExtension('/home/rory/.vst3/RotaryNotary', 'VST3Effect'),
            '/home/rory/.vst3/RotaryNotary.vst3',
        );
    });

    it('appends .clap and .component for those formats', () => {
        assert.strictEqual(ensurePluginExtension('/plugins/MyEffect', 'CLAPEffect'), '/plugins/MyEffect.clap');
        assert.strictEqual(ensurePluginExtension('/plugins/MyEffect', 'AUv2Effect'), '/plugins/MyEffect.component');
    });

    it('does not double-append an existing extension', () => {
        assert.strictEqual(
            ensurePluginExtension('/home/rory/.vst3/RotaryNotary.vst3', 'VST3Effect'),
            '/home/rory/.vst3/RotaryNotary.vst3',
        );
        assert.strictEqual(
            ensurePluginExtension('/home/rory/.vst3/RotaryNotary.VST3', 'VST3Effect'),
            '/home/rory/.vst3/RotaryNotary.VST3',
        );
        assert.strictEqual(ensurePluginExtension('/plugins/MyEffect.clap', 'CLAPSynth'), '/plugins/MyEffect.clap');
    });

    it('preserves spaces and Windows paths', () => {
        assert.strictEqual(
            ensurePluginExtension('C:\\Users\\Rory\\.vst3\\Rotary Notary', 'VST3Synth'),
            'C:\\Users\\Rory\\.vst3\\Rotary Notary.vst3',
        );
    });
});

describe('pluginNameFromPath', () => {
    it('removes the extension from POSIX and Windows paths', () => {
        assert.strictEqual(pluginNameFromPath('/home/rory/.vst3/RotaryNotary.vst3', 'VST3Effect'), 'RotaryNotary');
        assert.strictEqual(pluginNameFromPath('C:\\VST3\\RotaryNotary.vst3', 'VST3Effect'), 'RotaryNotary');
        assert.strictEqual(pluginNameFromPath('/plugins/MyEffect.clap', 'CLAPEffect'), 'MyEffect');
        assert.strictEqual(pluginNameFromPath('/plugins/My Effect.component', 'AUv2Effect'), 'My Effect');
    });

    it('returns the base name when the extension is absent', () => {
        assert.strictEqual(pluginNameFromPath('/home/rory/.vst3/RotaryNotary', 'VST3Effect'), 'RotaryNotary');
    });

    it('only strips the plugin extension, not other dots', () => {
        assert.strictEqual(pluginNameFromPath('/plugins/My.Plugin.vst3', 'VST3Effect'), 'My.Plugin');
    });
});
