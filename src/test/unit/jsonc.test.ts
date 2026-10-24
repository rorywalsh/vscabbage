// Unit tests for JSONC parsing and comment-preserving document edits.
// Run with: npm run test:unit
import assert from 'assert';
import { formatJsonText, minifyJsonText } from '../../utils/jsonFormat';
import {
    describeJsoncError,
    findCabbageInclude,
    getJsoncErrors,
    parseCabbageJson,
    parseJsonc,
    reconcileJsonDocument,
    reorderJsoncArrayValues,
} from '../../utils/jsonc';

const formatOptions = { maxLength: 120, indent: 4 };

describe('parseJsonc', () => {
    it('accepts line and block comments', () => {
        const value = parseJsonc<any>(`{
            // a line comment
            "a": 1,
            /* a block comment */
            "b": "http://example.com//not-a-comment"
        }`);
        assert.strictEqual(value.a, 1);
        assert.strictEqual(value.b, 'http://example.com//not-a-comment');
    });

    it('still rejects trailing commas', () => {
        const errors = getJsoncErrors('{ "a": 1, }');
        assert.ok(errors.length > 0);
        assert.ok(describeJsoncError(errors[0], '{ "a": 1, }').includes('Trailing comma'));
    });

    it('parseCabbageJson supports both root shapes', () => {
        const legacy = parseCabbageJson('[{"type":"form"}]');
        assert.ok(Array.isArray(legacy.root));
        assert.strictEqual(legacy.widgets[0].type, 'form');

        const object = parseCabbageJson('{ "package": {}, "widgets": [{"type":"form"}] }');
        assert.strictEqual(object.root.package !== undefined, true);
        assert.strictEqual(object.widgets[0].type, 'form');
    });
});

describe('findCabbageInclude', () => {
    it('ignores a commented-out include in invalid inline JSONC', () => {
        const text = `{
    // #include "other.json"
    "widgets": [
        { "type": "form", "size": { "width": 600, } }
    ]
}`;

        // The document is malformed, but its only #include is commented out.
        assert.ok(getJsoncErrors(text).length > 0);
        assert.strictEqual(findCabbageInclude(text), undefined);
    });

    it('ignores include-like text inside strings and block comments', () => {
        const text = `{
    /* #include "block-comment.json" */
    "caption": "// #include \\"inside-string.json\\""
}`;

        assert.strictEqual(findCabbageInclude(text), undefined);
    });

    it('finds a real include directive outside comments and strings', () => {
        const text = `// #include "ignored.json"
// Widgets live beside the CSD.
#include "widgets.json"`;
        const directive = findCabbageInclude(text);

        assert.ok(directive);
        assert.strictEqual(directive.filename, 'widgets.json');
        assert.strictEqual(directive.offset, text.indexOf('#include "widgets.json"'));
    });
});

describe('reconcileJsonDocument', () => {
    it('updates a widget without removing comments elsewhere', () => {
        const text = `{
    // top-level note
    "widgets": [
        { "type": "form", "id": "form1", /* form note */ "size": { "width": 600, "height": 300 } },
        // button note
        {
            "type": "button",
            "id": "b1",
            "label": { "text": "old" }
        }
    ]
}`;
        const desired = parseJsonc<any>(text);
        desired.widgets[1].label.text = 'new';

        const result = reconcileJsonDocument(text, desired, formatOptions);
        assert.ok(result.includes('// top-level note'));
        assert.ok(result.includes('/* form note */'));
        assert.ok(result.includes('// button note'));
        assert.ok(result.includes('"text": "new"'));
        assert.ok(!result.includes('"old"'));
    });

    it('keeps comments in a renamed widget when an id alias is supplied', () => {
        const text = `{
    "widgets": [
        {
            // keep this widget note
            "type": "button",
            "id": "oldId",
            "label": { "text": "hello" }
        }
    ]
}`;
        const desired = parseJsonc<any>(text);
        desired.widgets[0].id = 'newId';
        desired.widgets[0].label.text = 'goodbye';

        const result = reconcileJsonDocument(text, desired, formatOptions, { oldId: 'newId' });
        assert.strictEqual((result.match(/"id": "oldId"/g) || []).length, 0);
        assert.ok(result.includes('"id": "newId"'));
        assert.ok(result.includes('// keep this widget note'));
        assert.ok(result.includes('"text": "goodbye"'));
        assert.strictEqual((result.match(/"type": "button"/g) || []).length, 1);
    });

    it('removes a widget and preserves comments in the remaining widgets', () => {
        const text = `{
    // file note
    "widgets": [
        { "type": "form", "id": "form1" },
        // remove me
        { "type": "button", "id": "removeMe" },
        {
            // keep me
            "type": "button",
            "id": "keepMe"
        }
    ]
}`;
        const desired = parseJsonc<any>(text);
        desired.widgets = desired.widgets.filter((widget: any) => widget.id !== 'removeMe');

        const result = reconcileJsonDocument(text, desired, formatOptions);
        assert.ok(result.includes('// file note'));
        assert.ok(result.includes('// keep me'));
        assert.ok(result.includes('"id": "keepMe"'));
        assert.ok(!result.includes('"id": "removeMe"'));
    });

    it('preserves top-level properties and legacy array roots', () => {
        const objectText = `{
            // root note
            "package": { "name": "old" },
            "widgets": [
                { "type": "form", "id": "form1" }
            ]
        }`;
        const objectDesired = parseJsonc<any>(objectText);
        objectDesired.package.name = 'new';
        const objectResult = reconcileJsonDocument(objectText, objectDesired, formatOptions);
        assert.ok(objectResult.includes('// root note'));
        assert.ok(objectResult.includes('"name": "new"'));
        assert.ok(!objectResult.includes('"name": "old"'));

        const arrayText = `[
            // legacy note
            { "type": "form", "id": "form1" }
        ]`;
        const arrayDesired = parseJsonc<any>(arrayText);
        arrayDesired.push({ type: 'button', id: 'button1' });
        const arrayResult = reconcileJsonDocument(arrayText, arrayDesired, formatOptions);
        assert.ok(Array.isArray(parseJsonc(arrayResult)));
        assert.ok(arrayResult.includes('// legacy note'));
        assert.ok(arrayResult.includes('"id": "button1"'));
    });

    it('inserts a new widget while retaining existing comments', () => {
        const text = `{
    "widgets": [
        // form stays
        { "type": "form", "id": "form1" }
    ]
}`;
        const desired = parseJsonc<any>(text);
        desired.widgets.push({ type: 'button', id: 'newButton' });

        const result = reconcileJsonDocument(text, desired, formatOptions);
        assert.ok(result.includes('// form stays'));
        assert.ok(result.includes('"id": "newButton"'));
        assert.strictEqual((result.match(/"id": "form1"/g) || []).length, 1);
    });

    it('adds a channel without serializing comments out of retained channels', () => {
        const text = `{
    "widgets": [
        {
            "type": "horizontalSlider",
            "id": "slider1",
            "channels": [
                {
                    // retained channel note
                    "id": "chan1",
                    "event": "channel1",
                    /* range note */
                    "range": { "min": 0, "max": 10 }
                }
            ]
        }
    ]
}`;
        const desired = parseJsonc<any>(text);
        desired.widgets[0].channels.push({ id: 'chan2', event: 'channel2', range: { min: 0, max: 1 } });

        const result = reconcileJsonDocument(text, desired, formatOptions);
        const channels = parseJsonc<any>(result).widgets[0].channels;
        assert.strictEqual(channels.length, 2);
        assert.strictEqual(channels[0].id, 'chan1');
        assert.strictEqual(channels[1].id, 'chan2');
        assert.ok(result.includes('// retained channel note'));
        assert.ok(result.includes('/* range note */'));
    });

    it('updates a generated form posted with a runtime id without losing comments', () => {
        const text = `{
    "widgets": [
        // form note
        {
            "type": "form",
            /* caption note */
            "caption": { "text": "Hello" }
        }
    ]
}`;
        // Generated CSD forms are stored without an id, but the runtime posts
        // them as MainForm. The first identified update must edit the existing
        // form in place rather than delete and reinsert it.
        const desired = parseJsonc<any>(text);
        desired.widgets[0].id = 'MainForm';
        desired.widgets[0].caption.text = 'Goodbye';

        const result = reconcileJsonDocument(text, desired, formatOptions);
        assert.ok(result.includes('// form note'));
        assert.ok(result.includes('/* caption note */'));
        assert.ok(result.includes('"text": "Goodbye"'));
        assert.ok(!result.includes('"text": "Hello"'));
        assert.strictEqual((result.match(/"type": "form"/g) || []).length, 1);
    });

    it('removes a channel while keeping comments inside a retained channel', () => {
        const text = `{
    "widgets": [
        {
            "type": "horizontalSlider",
            "id": "slider1",
            "channels": [
                {
                    "id": "chan1",
                    /* keep this note */
                    "event": "channel1",
                    "range": { // keep range note
                        "min": 0,
                        "max": 10
                    }
                },
                // remove this channel
                { "id": "chan2", "event": "channel2", "range": { "min": 0, "max": 1 } }
            ]
        }
    ]
}`;
        const desired = parseJsonc<any>(text);
        desired.widgets[0].channels = desired.widgets[0].channels.filter(
            (channel: any) => channel.id !== 'chan2'
        );

        const result = reconcileJsonDocument(text, desired, formatOptions);
        const channels = parseJsonc<any>(result).widgets[0].channels;
        assert.strictEqual(channels.length, 1);
        assert.strictEqual(channels[0].id, 'chan1');
        assert.ok(result.includes('/* keep this note */'));
        assert.ok(result.includes('// keep range note'));
        assert.ok(!result.includes('"id": "chan2"'));
    });
});

describe('reorderJsoncArrayValues', () => {
    it('reorders widget values while keeping all comments', () => {
        const text = `{
    "widgets": [
        // first
        { "type": "button", "id": "a" },
        // second
        { "type": "button", "id": "b" }
    ]
}`;
        const reordered = reorderJsoncArrayValues(text, ['widgets'], [1, 0]);
        assert.ok(reordered.includes('// first'));
        assert.ok(reordered.includes('// second'));
        assert.ok(reordered.indexOf('"id": "b"') < reordered.indexOf('"id": "a"'));
    });
});

describe('comment-preserving formatting', () => {
    it('formatJsonText and minifyJsonText keep comments', () => {
        const text = `{
    // top
    "widgets": [
        { "type": "form", "id": "form1" /* inline */ }
    ]
}`;
        const formatted = formatJsonText(text, formatOptions);
        assert.ok(formatted.includes('// top'));
        assert.ok(formatted.includes('/* inline */'));

        const minified = minifyJsonText(text, formatOptions);
        assert.ok(minified.includes('// top'));
        assert.ok(minified.includes('/* inline */'));
    });
});
