#!/usr/bin/env node
// Fake CabbageApp backend for integration tests.
//
// The real CabbageApp speaks newline-delimited JSON over stdin/stdout. This
// stand-in reads whatever the extension writes to its stdin and appends each
// line to a log file, so tests can assert on the exact messages the extension
// forwarded. The log path is passed via the CABBAGE_TEST_FAKE_LOG environment
// variable (the extension spawns the binary with no arguments).
'use strict';

const fs = require('fs');

const logPath = process.env.CABBAGE_TEST_FAKE_LOG;
if (!logPath) {
    // Nothing to record into; keep running so the pipe stays open.
} 

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
    buffer += chunk;
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (line && logPath) {
            fs.appendFileSync(logPath, line + '\n');
        }
    }
});

process.stdin.on('end', () => {
    if (buffer.trim() && logPath) {
        fs.appendFileSync(logPath, buffer.trim() + '\n');
    }
});

// Stay alive until the extension terminates us.
