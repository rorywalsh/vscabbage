import assert from 'assert';
import { formatCabbageSection, formatCsdText } from '../../utils/csdFormat';

describe('formatCsdText', () => {
    it('formats the Cabbage JSON with FracturedJson', () => {
        const text = '<Cabbage>\n{"widgets":[{"type":"form","size":{"width":600,"height":300}}]}\n</Cabbage>';
        const out = formatCsdText(text, { indentSpaces: 4, jsonIndentSpaces: 4, maxLength: 120 });

        assert.ok(out.includes('{ "type": "form", "size": {"width": 600, "height": 300} }'));
    });

    it('preserves comments in the Cabbage JSON', () => {
        const text = '<Cabbage>\n{\n  // keep me\n  "widgets": []\n}\n</Cabbage>';
        const out = formatCsdText(text);

        assert.ok(out.includes('// keep me'));
    });

    it('formats Csound indentation when there is no Cabbage section', () => {
        const text = 'instr 1\nif 1 == 1 then\nprint 1\nendif\nendin';
        const out = formatCsdText(text);

        assert.ok(out.includes('    print 1'));
    });

    it('can format only the Cabbage section, leaving Csound untouched', () => {
        const text = 'instr 1\nprint 1\nendin\n<Cabbage>\n{"widgets":[{"type":"form"}]}\n</Cabbage>';
        const out = formatCabbageSection(text, { indent: 4, maxLength: 120 });

        assert.ok(out.startsWith('instr 1\nprint 1\nendin\n'));
        assert.ok(out.includes('"widgets"'));
    });
});
