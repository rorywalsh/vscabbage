// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

import fs from 'fs';

/**
 * Architecture of a native binary, as detected from its header.
 * 'unknown' means the file could not be read or the header was not
 * recognised (the caller should let the OS spawn attempt decide).
 */
export type BinaryArch = 'x86' | 'x64' | 'arm64' | 'unknown';

const PE_MACHINE: Record<number, BinaryArch> = {
    0x014c: 'x86',  // IMAGE_FILE_MACHINE_I386
    0x8664: 'x64',  // IMAGE_FILE_MACHINE_AMD64
    0xaa64: 'arm64', // IMAGE_FILE_MACHINE_ARM64
};

const ELF_MACHINE: Record<number, BinaryArch> = {
    0x03: 'x86',  // EM_386
    0x3e: 'x64',  // EM_X86_64
    0xb7: 'arm64', // EM_AARCH64
};

const MACHO_CPU: Record<number, BinaryArch> = {
    0x00000007: 'x86',   // CPU_TYPE_X86
    0x01000007: 'x64',   // CPU_TYPE_X86_64
    0x0100000c: 'arm64', // CPU_TYPE_ARM64
};

function machoCpuToArch(cpu: number): BinaryArch {
    return MACHO_CPU[cpu] ?? 'unknown';
}

/**
 * Reads the machine architecture from a native binary's header without
 * executing it. Supports the three binary formats the extension ships:
 * Windows PE (.exe/.vst3/.clap), macOS Mach-O, and Linux ELF.
 *
 * Returns 'unknown' for anything unrecognised (not a native binary, or a
 * truncated file) rather than throwing, so callers can simply skip the check.
 */
export function readBinaryArch(filePath: string): BinaryArch {
    let buf: Buffer;
    try {
        buf = fs.readFileSync(filePath);
    } catch {
        return 'unknown';
    }
    if (buf.length < 4) {
        return 'unknown';
    }

    // Windows PE — "MZ" magic, then the PE header offset at 0x3c.
    if (buf[0] === 0x4d && buf[1] === 0x5a) {
        if (buf.length < 0x40) {
            return 'unknown';
        }
        const peOffset = buf.readUInt32LE(0x3c);
        if (peOffset + 6 > buf.length) {
            return 'unknown';
        }
        return PE_MACHINE[buf.readUInt16LE(peOffset + 4)] ?? 'unknown';
    }

    // macOS Mach-O, thin 64-bit little-endian (0xfeedfacf stored LE):
    // bytes CF FA ED FE.
    if (buf[0] === 0xcf && buf[1] === 0xfa && buf[2] === 0xed && buf[3] === 0xfe) {
        return machoCpuToArch(buf.readUInt32LE(4));
    }

    // macOS Mach-O, fat/universal (0xcafebabe / 0xcafebabf, big-endian):
    // bytes CA FE BA BE / CA FE BA BF. First slice's cputype sits at offset 8.
    if (buf[0] === 0xca && buf[1] === 0xfe && buf[2] === 0xba && (buf[3] === 0xbe || buf[3] === 0xbf)) {
        if (buf.length >= 12) {
            return machoCpuToArch(buf.readUInt32BE(8));
        }
        return 'unknown';
    }

    // Linux ELF — 0x7f 'E' 'L' 'F' magic, e_machine at offset 18.
    if (buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46) {
        if (buf.length < 20) {
            return 'unknown';
        }
        return ELF_MACHINE[buf.readUInt16LE(18)] ?? 'unknown';
    }

    return 'unknown';
}

/**
 * Normalises a Node `process.arch` value to the same vocabulary as
 * {@link BinaryArch} ('ia32' maps to 'x86').
 */
function normalizeHostArch(hostArch: string): BinaryArch {
    if (hostArch === 'ia32') {
        return 'x86';
    }
    if (hostArch === 'x64' || hostArch === 'arm64' || hostArch === 'x86') {
        return hostArch;
    }
    // Other arches (arm, ppc64, s390x, ...) have no shipped binary; treat as
    // 'unknown' so the check is skipped and the spawn attempt reports the real
    // error.
    return 'unknown';
}

/**
 * Whether a binary of `binaryArch` can run on a host of `hostArch`. Returns
 * true for 'unknown' either way so the check degrades gracefully when the
 * binary format cannot be determined.
 *
 * The important false case is an ARM64 binary on an x64 host: x64 machines
 * cannot emulate ARM64, so the backend can never start. x64/x86 binaries are
 * allowed to run under emulation on arm64 hosts (Rosetta 2, Windows x64
 * emulation, WOW64).
 */
export function isCompatibleArch(binaryArch: BinaryArch, hostArch: string): boolean {
    if (binaryArch === 'unknown') {
        return true;
    }
    const host = normalizeHostArch(hostArch);
    if (host === 'unknown') {
        return true;
    }
    if (binaryArch === host) {
        return true;
    }
    if (binaryArch === 'x64' && host === 'arm64') {
        return true;
    }
    if (binaryArch === 'x86' && (host === 'x64' || host === 'arm64')) {
        return true;
    }
    return false;
}
