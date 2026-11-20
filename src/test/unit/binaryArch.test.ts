// Unit tests for the binary-architecture guard helpers.
// Run with: npm run test:unit (plain mocha, no VS Code instance needed).
import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { readBinaryArch, isCompatibleArch, BinaryArch } from '../../utils/binaryArch';

// Minimal PE image: "MZ" + e_lfanew pointing at a "PE\0\0" header + machine.
function peBuffer(machine: number): Buffer {
    const buf = Buffer.alloc(0x100);
    buf.write('MZ', 0, 'ascii');
    buf.writeUInt32LE(0x40, 0x3c); // e_lfanew -> PE header at offset 0x40
    buf.write('PE\0\0', 0x40, 'ascii');
    buf.writeUInt16LE(machine, 0x40 + 4);
    return buf;
}

// Minimal ELF image: \x7fELF + e_machine at offset 18.
function elfBuffer(machine: number): Buffer {
    const buf = Buffer.alloc(0x40);
    buf[0] = 0x7f;
    buf[1] = 0x45;
    buf[2] = 0x4c;
    buf[3] = 0x46;
    buf.writeUInt16LE(machine, 18);
    return buf;
}

// Minimal thin 64-bit little-endian Mach-O: 0xfeedfacf (LE: cf fa ed fe) + cputype.
function machoBuffer(cputype: number): Buffer {
    const buf = Buffer.alloc(0x20);
    buf[0] = 0xcf;
    buf[1] = 0xfa;
    buf[2] = 0xed;
    buf[3] = 0xfe;
    buf.writeUInt32LE(cputype, 4);
    return buf;
}

describe('readBinaryArch', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cabbage-arch-'));
    const writeAndRead = (buf: Buffer): BinaryArch => {
        const p = path.join(tmp, `bin-${Math.random().toString(36).slice(2)}`);
        fs.writeFileSync(p, buf);
        return readBinaryArch(p);
    };
    after(() => {
        fs.rmSync(tmp, { recursive: true, force: true });
    });

    it('detects PE x64 / arm64 / x86', () => {
        assert.strictEqual(writeAndRead(peBuffer(0x8664)), 'x64');
        assert.strictEqual(writeAndRead(peBuffer(0xaa64)), 'arm64');
        assert.strictEqual(writeAndRead(peBuffer(0x014c)), 'x86');
    });

    it('detects ELF x64 / arm64 / x86', () => {
        assert.strictEqual(writeAndRead(elfBuffer(0x3e)), 'x64');
        assert.strictEqual(writeAndRead(elfBuffer(0xb7)), 'arm64');
        assert.strictEqual(writeAndRead(elfBuffer(0x03)), 'x86');
    });

    it('detects Mach-O x64 / arm64', () => {
        assert.strictEqual(writeAndRead(machoBuffer(0x01000007)), 'x64');
        assert.strictEqual(writeAndRead(machoBuffer(0x0100000c)), 'arm64');
    });

    it('returns unknown for missing or unrecognised files', () => {
        assert.strictEqual(readBinaryArch(path.join(tmp, 'does-not-exist')), 'unknown');
        assert.strictEqual(writeAndRead(Buffer.from('not a binary at all')), 'unknown');
    });
});

describe('isCompatibleArch', () => {
    it('allows identical architectures', () => {
        assert.strictEqual(isCompatibleArch('x64', 'x64'), true);
        assert.strictEqual(isCompatibleArch('arm64', 'arm64'), true);
        assert.strictEqual(isCompatibleArch('x86', 'ia32'), true);
    });

    it('allows x64 and x86 to run under emulation on arm64', () => {
        assert.strictEqual(isCompatibleArch('x64', 'arm64'), true);
        assert.strictEqual(isCompatibleArch('x86', 'arm64'), true);
    });

    it('allows x86 on x64 (WOW64)', () => {
        assert.strictEqual(isCompatibleArch('x86', 'x64'), true);
    });

    it('rejects an arm64 binary on an x64 host', () => {
        assert.strictEqual(isCompatibleArch('arm64', 'x64'), false);
    });

    it('degrades to compatible when the arch is unknown', () => {
        assert.strictEqual(isCompatibleArch('unknown', 'x64'), true);
        assert.strictEqual(isCompatibleArch('x64', 's390x'), true);
    });
});
