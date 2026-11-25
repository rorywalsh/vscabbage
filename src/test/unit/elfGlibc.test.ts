// Unit tests for the ELF glibc symbol-version reader.
// Run with: npm run test:unit (plain mocha, no VS Code instance needed).
import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
    compareGlibcVersions,
    highestGlibcVersion,
    parseGlibcRequirements,
    readGlibcRequirements,
} from '../../utils/elfGlibc';

interface ElfOptions {
    is64Bit?: boolean;
    names?: string[];
}

/**
 * Builds a minimal ELF image containing one `.gnu.version_r` section and a
 * `.dynstr` string table. Only the fields the parser reads are populated.
 */
function elfWithVerneed(options: ElfOptions = {}): Buffer {
    const is64Bit = options.is64Bit ?? true;
    const names = options.names ?? ['GLIBC_2.43', 'GLIBC_2.2.5', 'GLIBC_2.34'];
    const ehdrSize = is64Bit ? 64 : 52;
    const shdrSize = is64Bit ? 64 : 40;
    const shCount = 3;
    const shoff = ehdrSize;
    const dynstrOffset = shoff + shCount * shdrSize;

    const strings: string[] = [''];
    strings.push('libc.so.6');
    const nameOffsets = names.map((name) => {
        let offset = 0;
        for (let i = 0; i < strings.length; i++) {
            offset += strings[i].length + 1;
        }
        strings.push(name);
        return offset;
    });
    const dynstr = Buffer.from(strings.join('\0') + '\0', 'latin1');

    const verneedOffset = dynstrOffset + dynstr.length;
    const entrySize = 16;
    const verneedSize = entrySize + names.length * entrySize;
    const totalSize = verneedOffset + verneedSize;
    const buf = Buffer.alloc(totalSize);

    // ELF header.
    buf[0] = 0x7f;
    buf[1] = 0x45; // E
    buf[2] = 0x4c; // L
    buf[3] = 0x46; // F
    buf[4] = is64Bit ? 2 : 1;
    buf[5] = 1; // little-endian
    buf.writeUInt16LE(3, 16); // e_type = ET_DYN
    buf.writeUInt16LE(is64Bit ? 0x3e : 0x03, 18); // e_machine
    buf.writeUInt32LE(1, 20); // e_version
    if (is64Bit) {
        buf.writeBigUInt64LE(BigInt(shoff), 0x28);
        buf.writeUInt16LE(ehdrSize, 0x34);
        buf.writeUInt16LE(shdrSize, 0x3a);
        buf.writeUInt16LE(shCount, 0x3c);
    } else {
        buf.writeUInt32LE(shoff, 0x20);
        buf.writeUInt16LE(ehdrSize, 0x28);
        buf.writeUInt16LE(shdrSize, 0x2e);
        buf.writeUInt16LE(shCount, 0x30);
    }

    const writeSection = (
        index: number,
        type: number,
        offset: number,
        size: number,
        link: number,
    ): void => {
        const sh = shoff + index * shdrSize;
        buf.writeUInt32LE(type, sh + 4);
        if (is64Bit) {
            buf.writeBigUInt64LE(BigInt(offset), sh + 24);
            buf.writeBigUInt64LE(BigInt(size), sh + 32);
            buf.writeUInt32LE(link, sh + 40);
        } else {
            buf.writeUInt32LE(offset, sh + 16);
            buf.writeUInt32LE(size, sh + 20);
            buf.writeUInt32LE(link, sh + 24);
        }
    };

    // Section 0 is the all-zero null section.
    writeSection(1, 0x6ffffffe, verneedOffset, verneedSize, 2); // .gnu.version_r
    writeSection(2, 3, dynstrOffset, dynstr.length, 0); // .dynstr

    dynstr.copy(buf, dynstrOffset);

    // Elf_Verneed.
    buf.writeUInt16LE(1, verneedOffset); // vn_version
    buf.writeUInt16LE(names.length, verneedOffset + 2); // vn_cnt
    buf.writeUInt32LE(1, verneedOffset + 4); // vn_file -> "libc.so.6"
    buf.writeUInt32LE(entrySize, verneedOffset + 8); // vn_aux
    buf.writeUInt32LE(0, verneedOffset + 12); // vn_next

    // Elf_Vernaux entries.
    for (let i = 0; i < names.length; i++) {
        const aux = verneedOffset + entrySize + i * entrySize;
        buf.writeUInt32LE(0, aux); // vna_hash
        buf.writeUInt16LE(0, aux + 4); // vna_flags
        buf.writeUInt16LE(2 + i, aux + 6); // vna_other
        buf.writeUInt32LE(nameOffsets[i], aux + 8); // vna_name
        buf.writeUInt32LE(i === names.length - 1 ? 0 : entrySize, aux + 12); // vna_next
    }

    return buf;
}

describe('compareGlibcVersions', () => {
    it('orders by numeric component, not lexicographically', () => {
        assert.ok(compareGlibcVersions('2.9', '2.34') < 0);
        assert.ok(compareGlibcVersions('2.34', '2.43') < 0);
        assert.ok(compareGlibcVersions('2.43', '2.9') > 0);
    });

    it('treats missing components as zero', () => {
        assert.strictEqual(compareGlibcVersions('2.39', '2.39.0'), 0);
        assert.ok(compareGlibcVersions('2.2.5', '2.3') < 0);
    });

    it('is stable for identical versions', () => {
        assert.strictEqual(compareGlibcVersions('2.43', '2.43'), 0);
    });
});

describe('highestGlibcVersion', () => {
    it('returns the newest version regardless of input order', () => {
        assert.strictEqual(highestGlibcVersion(['2.34', '2.2.5', '2.43']), '2.43');
    });

    it('returns undefined for an empty list', () => {
        assert.strictEqual(highestGlibcVersion([]), undefined);
    });
});

describe('parseGlibcRequirements', () => {
    it('extracts, dedupes and sorts GLIBC_* requirements (ELF64)', () => {
        const req = parseGlibcRequirements(elfWithVerneed({
            names: ['GLIBC_2.43', 'GLIBC_2.2.5', 'GLIBC_2.34', 'GLIBC_2.34'],
        }));
        assert.deepStrictEqual(req, ['2.2.5', '2.34', '2.43']);
    });

    it('extracts requirements from an ELF32 image', () => {
        const req = parseGlibcRequirements(elfWithVerneed({
            is64Bit: false,
            names: ['GLIBC_2.39', 'GLIBC_2.4'],
        }));
        assert.deepStrictEqual(req, ['2.4', '2.39']);
    });

    it('ignores non-glibc version names such as GLIBCXX_* and GLIBC_PRIVATE', () => {
        const req = parseGlibcRequirements(elfWithVerneed({
            names: ['GLIBC_2.34', 'GLIBCXX_3.4.29', 'GLIBC_PRIVATE', 'CXXABI_1.3.13'],
        }));
        assert.deepStrictEqual(req, ['2.34']);
    });

    it('returns an empty list for an ELF with no dependencies', () => {
        assert.deepStrictEqual(parseGlibcRequirements(elfWithVerneed({ names: [] })), []);
    });

    it('returns undefined for non-ELF or truncated input', () => {
        assert.strictEqual(parseGlibcRequirements(Buffer.from('not an elf file')), undefined);
        assert.strictEqual(parseGlibcRequirements(Buffer.alloc(0)), undefined);
        const truncated = elfWithVerneed().subarray(0, 80);
        assert.strictEqual(parseGlibcRequirements(truncated), undefined);
    });
});

describe('readGlibcRequirements', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cabbage-glibc-'));
    after(() => {
        fs.rmSync(tmp, { recursive: true, force: true });
    });

    it('reads requirements from a file', () => {
        const p = path.join(tmp, 'fake-elf');
        fs.writeFileSync(p, elfWithVerneed());
        assert.deepStrictEqual(readGlibcRequirements(p), ['2.2.5', '2.34', '2.43']);
    });

    it('returns undefined for a missing file', () => {
        assert.strictEqual(readGlibcRequirements(path.join(tmp, 'nope')), undefined);
    });

    it('can parse the local Node binary on Linux', function () {
        if (process.platform !== 'linux') {
            this.skip();
        }
        const req = readGlibcRequirements(process.execPath);
        assert.ok(Array.isArray(req), 'Node should be a readable ELF image on Linux');
    });
});
