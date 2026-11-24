// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

/**
 * Reads the GLIBC symbol versions a Linux ELF binary requires.
 *
 * glibc's symbol versioning is forward-compatible but not backward-compatible:
 * a binary linked against glibc 2.43 refuses to start on a machine with glibc
 * 2.39 ("version `GLIBC_2.43' not found"), even when the architectures match.
 * Parsing the `.gnu.version_r` section lets the installation validator warn
 * about that before the user tries to launch the backend.
 *
 * Everything here is a pure function over bytes/file paths, so it can run
 * under plain mocha without a VS Code instance.
 */

import fs from 'fs';

/** ELF section type for `.gnu.version_r` (SHT_GNU_verneed). */
const SHT_GNU_VERNEED = 0x6ffffffe;

/** A `GLIBC_<version>` version name, without the `GLIBC_` prefix. */
const GLIBC_VERSION_NAME = /^GLIBC_(\d+(?:\.\d+)*)$/;

interface ElfContext {
    buffer: Buffer;
    is64Bit: boolean;
    littleEndian: boolean;
}

function u16(ctx: ElfContext, offset: number): number | undefined {
    if (offset < 0 || offset + 2 > ctx.buffer.length) {
        return undefined;
    }
    return ctx.littleEndian ? ctx.buffer.readUInt16LE(offset) : ctx.buffer.readUInt16BE(offset);
}

function u32(ctx: ElfContext, offset: number): number | undefined {
    if (offset < 0 || offset + 4 > ctx.buffer.length) {
        return undefined;
    }
    return ctx.littleEndian ? ctx.buffer.readUInt32LE(offset) : ctx.buffer.readUInt32BE(offset);
}

function u64(ctx: ElfContext, offset: number): number | undefined {
    if (offset < 0 || offset + 8 > ctx.buffer.length) {
        return undefined;
    }
    const value = ctx.littleEndian
        ? ctx.buffer.readBigUInt64LE(offset)
        : ctx.buffer.readBigUInt64BE(offset);
    // File offsets in a real ELF are far below Number.MAX_SAFE_INTEGER.
    return value > BigInt(Number.MAX_SAFE_INTEGER) ? undefined : Number(value);
}

/** Reads a NUL-terminated string from a string-table slice of the buffer. */
function readString(ctx: ElfContext, tableOffset: number, tableSize: number, nameOffset: number): string | undefined {
    if (nameOffset < 0 || nameOffset >= tableSize) {
        return undefined;
    }
    const start = tableOffset + nameOffset;
    const end = tableOffset + tableSize;
    if (start >= ctx.buffer.length) {
        return undefined;
    }
    let cursor = start;
    while (cursor < end && cursor < ctx.buffer.length && ctx.buffer[cursor] !== 0) {
        cursor++;
    }
    return ctx.buffer.toString('latin1', start, cursor);
}

/**
 * Compares dotted numeric version strings component by component, so
 * `2.2.5 < 2.34 < 2.43`. Missing components count as zero. Non-numeric input
 * compares as zero so a malformed version never looks newer than a good one.
 *
 * Returns a negative number when `a < b`, zero when equal, positive when
 * `a > b`.
 */
export function compareGlibcVersions(a: string, b: string): number {
    const parse = (value: string): number[] =>
        value.split('.').map((part) => {
            const n = Number.parseInt(part, 10);
            return Number.isFinite(n) ? n : 0;
        });
    const left = parse(a);
    const right = parse(b);
    const length = Math.max(left.length, right.length);
    for (let i = 0; i < length; i++) {
        const l = left[i] ?? 0;
        const r = right[i] ?? 0;
        if (l !== r) {
            return l - r;
        }
    }
    return 0;
}

/** Returns the highest version from `versions`, or undefined for an empty list. */
export function highestGlibcVersion(versions: string[]): string | undefined {
    if (versions.length === 0) {
        return undefined;
    }
    const sorted = [...versions].sort(compareGlibcVersions);
    return sorted[sorted.length - 1];
}

/**
 * Parses an ELF image and returns the `GLIBC_*` symbol versions it requires.
 *
 * Returns `undefined` when the bytes are not a readable ELF image (wrong
 * magic, truncated section table, ...). Returns `[]` for an ELF image that
 * needs no GLIBC versions at all (a static binary, or a musl binary).
 */
export function parseGlibcRequirements(buffer: Buffer): string[] | undefined {
    if (buffer.length < 0x34) {
        return undefined;
    }
    if (!(buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46)) {
        return undefined;
    }
    const elfClass = buffer[4];
    const elfData = buffer[5];
    if ((elfClass !== 1 && elfClass !== 2) || (elfData !== 1 && elfData !== 2)) {
        return undefined;
    }
    const ctx: ElfContext = {
        buffer,
        is64Bit: elfClass === 2,
        littleEndian: elfData === 1,
    };

    const sectionHeaderOffset = ctx.is64Bit ? u64(ctx, 0x28) : u32(ctx, 0x20);
    const sectionHeaderEntrySize = ctx.is64Bit ? u16(ctx, 0x3a) : u16(ctx, 0x2e);
    const sectionHeaderCount = ctx.is64Bit ? u16(ctx, 0x3c) : u16(ctx, 0x30);
    if (
        sectionHeaderOffset === undefined
        || sectionHeaderEntrySize === undefined
        || sectionHeaderCount === undefined
        || sectionHeaderEntrySize === 0
        || sectionHeaderCount === 0
    ) {
        // Extended section numbering (e_shnum == 0) is not used by the
        // compilers we ship binaries from; treat it as unreadable.
        return undefined;
    }
    if (sectionHeaderOffset + sectionHeaderCount * sectionHeaderEntrySize > buffer.length) {
        return undefined;
    }

    const sectionOffset = (index: number): number | undefined => {
        if (index < 0 || index >= sectionHeaderCount) {
            return undefined;
        }
        return sectionHeaderOffset + index * sectionHeaderEntrySize;
    };
    const sectionHeader = (index: number): {
        type?: number;
        offset?: number;
        size?: number;
        link?: number;
    } | undefined => {
        const offset = sectionOffset(index);
        if (offset === undefined || offset + sectionHeaderEntrySize > buffer.length) {
            return undefined;
        }
        return {
            type: u32(ctx, offset + 4),
            offset: ctx.is64Bit ? u64(ctx, offset + 24) : u32(ctx, offset + 16),
            size: ctx.is64Bit ? u64(ctx, offset + 32) : u32(ctx, offset + 20),
            link: u32(ctx, offset + (ctx.is64Bit ? 40 : 24)),
        };
    };

    const versions = new Set<string>();
    for (let i = 0; i < sectionHeaderCount; i++) {
        const verneed = sectionHeader(i);
        if (!verneed || verneed.type !== SHT_GNU_VERNEED) {
            continue;
        }
        if (
            verneed.offset === undefined
            || verneed.size === undefined
            || verneed.link === undefined
        ) {
            return undefined;
        }
        const strings = sectionHeader(verneed.link);
        if (
            !strings
            || strings.offset === undefined
            || strings.size === undefined
            || strings.type === undefined
        ) {
            return undefined;
        }

        // Elf_Verneed: vn_version(2) vn_cnt(2) vn_file(4) vn_aux(4) vn_next(4)
        // Elf_Vernaux: vna_hash(4) vna_flags(2) vna_other(2) vna_name(4) vna_next(4)
        const entrySize = 16;
        let verneedOffset = 0;
        while (verneedOffset + entrySize <= verneed.size) {
            const base = verneed.offset + verneedOffset;
            const count = u16(ctx, base + 2);
            const auxOffset = u32(ctx, base + 8);
            const nextOffset = u32(ctx, base + 12);
            if (count === undefined || auxOffset === undefined || nextOffset === undefined) {
                return undefined;
            }

            let aux = verneedOffset + auxOffset;
            for (let j = 0; j < count; j++) {
                if (aux + entrySize > verneed.size) {
                    break;
                }
                const auxBase = verneed.offset + aux;
                const nameOffset = u32(ctx, auxBase + 8);
                const auxNext = u32(ctx, auxBase + 12);
                if (nameOffset === undefined || auxNext === undefined) {
                    return undefined;
                }
                const name = readString(ctx, strings.offset, strings.size, nameOffset);
                if (name) {
                    const match = GLIBC_VERSION_NAME.exec(name);
                    if (match) {
                        versions.add(match[1]);
                    }
                }
                if (auxNext === 0) {
                    break;
                }
                aux += auxNext;
            }

            if (nextOffset === 0) {
                break;
            }
            verneedOffset += nextOffset;
        }
    }

    return [...versions].sort(compareGlibcVersions);
}

/**
 * Reads the GLIBC symbol versions required by the ELF file at `filePath`.
 * Returns `undefined` when the file cannot be read or is not an ELF image.
 */
export function readGlibcRequirements(filePath: string): string[] | undefined {
    let buffer: Buffer;
    try {
        buffer = fs.readFileSync(filePath);
    } catch {
        return undefined;
    }
    return parseGlibcRequirements(buffer);
}
