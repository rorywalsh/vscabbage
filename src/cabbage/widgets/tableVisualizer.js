class TableVisualizer {
    constructor(props) {
        this.props = { ...props };
        this.canvas = null;
        this.ctx = null;
        this.tables = [];
        this.tablesToDisplay = [3, 4, 5, 6, 5, 3]; // Default morph sequence
        this.waveformTables = [];
        this.currentHighlightPosition = -1;
        this.highlightStartTime = 0;
        this.highlightFadeDuration = 3000;
        this.fadeAnimationId = null;

        // Set up reactive props
        this.props = new Proxy(this.props, {
            set: (target, property, value) => {
                target[property] = value;
                this.render();
                return true;
            }
        });
    }

    // Normalize waveform samples to -1 to 1 range
    normalizeWaveform(samples) {
        const maxValue = Math.max(...samples.map(Math.abs));
        if (maxValue === 0) return samples; // Avoid division by zero
        return samples.map(sample => sample / maxValue);
    }

    // Interpolate between two waveform arrays
    interpolateWaveforms(samples1, samples2, factor) {
        if (!samples1 || !samples2 || samples1.length !== samples2.length) {
            return samples1 || samples2 || [];
        }

        const result = [];
        for (let i = 0; i < samples1.length; i++) {
            result[i] = samples1[i] * (1 - factor) + samples2[i] * factor;
        }
        return result;
    }

    // Get interpolated waveform for a specific position (0.0-1.0)
    getInterpolatedWaveform(position, sourceTableNumbers) {
        if (sourceTableNumbers.length === 0) return [];
        if (sourceTableNumbers.length === 1) {
            const table = this.tables.find(t => t.tableNumber === sourceTableNumbers[0]);
            return table ? table.samples : [];
        }

        // Calculate which segment we're in and the interpolation factor
        const segmentCount = sourceTableNumbers.length - 1;
        const scaledPosition = position * segmentCount;
        const segmentIndex = Math.floor(scaledPosition);
        const segmentFactor = scaledPosition - segmentIndex;

        // Get the two tables to interpolate between
        const startIndex = Math.min(segmentIndex, sourceTableNumbers.length - 1);
        const endIndex = Math.min(segmentIndex + 1, sourceTableNumbers.length - 1);

        const startTable = this.tables.find(t => t.tableNumber === sourceTableNumbers[startIndex]);
        const endTable = this.tables.find(t => t.tableNumber === sourceTableNumbers[endIndex]);

        if (!startTable || !endTable) return [];

        return this.interpolateWaveforms(startTable.samples, endTable.samples, segmentFactor);
    }

    // Highlight a specific table position (0.0 = front, 1.0 = back)
    highlightTablePosition(position) {
        this.currentHighlightPosition = Math.max(0, Math.min(1, position));
        this.highlightStartTime = performance.now(); // Record when highlight started
        this.render();
    }

    // Table class for 3D stacked display
    Table = class {
        constructor(x, y, w, h, index, samples, isHighlighted = false) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.index = index;
            this.samples = samples;
            this.cycles = 8; // Number of waveform cycles to draw
            this.isHighlighted = isHighlighted;

            // Calculate color and alpha with fade effect
            if (isHighlighted && this.highlightStartTime > 0) {
                const currentTime = performance.now();
                const elapsedTime = currentTime - this.highlightStartTime;
                const fadeProgress = Math.min(elapsedTime / this.highlightFadeDuration, 1.0);

                // Start at full brightness, fade to normal
                const maxAlpha = 50; // Full brightness
                const minAlpha = 20; // Normal brightness
                this.alpha = maxAlpha - (fadeProgress * (maxAlpha - minAlpha));
                this.color = '#00ABD1'; // Cyan when highlighted
            } else if (isHighlighted) {
                this.alpha = 50; // Full brightness if no fade time set
                this.color = '#00ABD1';
            } else {
                this.alpha = 20; // Normal brightness
                this.color = '#ffffff';
            }
        }

        display(canvas, ctx) {
            const sampleCount = this.samples.length;

            ctx.strokeStyle = this.color;
            ctx.globalAlpha = this.alpha / 50; // Convert to 0-1 range
            ctx.lineWidth = this.isHighlighted ? 2 : 1; // Thicker line if highlighted
            ctx.beginPath();

            let previousX = this.x;
            let previousY = this.y + this.h / 2; // Start at center of waveform area

            // Draw waveform similar to p5.js sketch
            for (let i = 0; i < sampleCount; i++) {
                const x = this.x + (i / (sampleCount - 1)) * this.w;
                const y = this.y + this.h / 2 - (this.samples[i] * this.h / 2); // Map sample to y position

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                previousX = x;
                previousY = y;
            }

            ctx.stroke();
            ctx.globalAlpha = 1.0; // Reset alpha
        }
    }

    // Draw grid background
    drawGrid(ctx, width, height) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;

        // Horizontal grid lines
        for (let y = 0; y <= height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Vertical grid lines
        for (let x = 0; x <= width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
    }

    // Main drawing function
    drawTableWaveform(tableNumber = null) {
        if (!this.canvas || !this.ctx) return;

        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background grid
        this.drawGrid(this.ctx, this.canvas.width, this.canvas.height);

        // If specific table number is provided, just draw that one
        if (tableNumber !== null) {
            const tableObj = this.tables.find(t => t.tableNumber === tableNumber);
            if (tableObj && tableObj.samples && tableObj.samples.length > 0) {
                // Create a single table instance and display it
                const singleTable = new this.Table(50, 50, this.canvas.width - 100, 80, 0, tableObj.samples);
                singleTable.color = '#ffffff';
                singleTable.alpha = 40;
                singleTable.display(this.canvas, this.ctx);
            }
            return;
        }

        // Create 60 interpolated tables for 3D display
        const numDisplayTables = 60;
        if (this.tablesToDisplay.length === 0) return;

        this.waveformTables = []; // Clear existing tables

        // Calculate which table should be highlighted (if any)
        let highlightedTableIndex = -1;
        if (this.currentHighlightPosition >= 0) {
            highlightedTableIndex = Math.floor(this.currentHighlightPosition * (numDisplayTables - 1));
        }

        // Create 60 table instances with interpolated waveforms
        for (let i = 0; i < numDisplayTables; i++) {
            // Calculate interpolation position (0.0 to 1.0)
            const interpolationPosition = i / (numDisplayTables - 1);

            // Get interpolated waveform samples
            const interpolatedSamples = this.getInterpolatedWaveform(interpolationPosition, this.tablesToDisplay);

            if (interpolatedSamples && interpolatedSamples.length > 0) {
                // p5.js-style positioning calculation
                const x = 50 + (Math.pow(3, 2 + (i / 50)));
                const y = (this.canvas.height * 0.35) - i * 0.8;
                const w = this.canvas.width - 100 - (i * 2);
                const h = 110 - (i * 0.5);

                // Check if this table should be highlighted
                const isHighlighted = (i === highlightedTableIndex);

                this.waveformTables.push(new this.Table(x, y, w, h, i, interpolatedSamples, isHighlighted));
            }
        }

        // Draw tables from back to front for proper layering
        for (let i = this.waveformTables.length - 1; i >= 0; i--) {
            this.waveformTables[i].display(this.canvas, this.ctx);
        }
    }

    // Update table data (called via cabbageSet)
    updateTable(tableNumber, samples) {
        const normalizedSamples = this.normalizeWaveform(samples);
        const existingTable = this.tables.find(t => t.tableNumber === tableNumber);

        if (existingTable) {
            existingTable.samples = normalizedSamples;
        } else {
            this.tables.push({
                type: "tableUpdate",
                tableNumber: tableNumber,
                samples: normalizedSamples
            });
        }

        this.render();
    }

    // Set morph sequence
    setMorphSequence(sequence) {
        this.tablesToDisplay = sequence;
        this.render();
    }

    // Set morph index (0.0 to 1.0)
    setMorphIndex(index) {
        this.props.morphIndex = Math.max(0, Math.min(1, index));
        this.highlightTablePosition(this.props.morphIndex);
    }

    getInnerHTML() {
        const { bounds, visible, backgroundColor } = this.props;

        if (!visible) return '';

        return `
            <div class="table-visualizer" style="
                position: absolute;
                left: ${bounds.left}px;
                top: ${bounds.top}px;
                width: ${bounds.width}px;
                height: ${bounds.height}px;
                background-color: ${backgroundColor || '#1a1a1a'};
                border: 1px solid #333;
                overflow: hidden;
            ">
                <canvas id="tableCanvas_${this.props.channel || 'default'}"
                        width="${bounds.width}"
                        height="${bounds.height}"
                        style="display: block;">
                </canvas>
            </div>
        `;
    }

    addEventListeners() {
        // Find the canvas element
        const canvasId = `tableCanvas_${this.props.channel || 'default'}`;
        this.canvas = document.getElementById(canvasId);

        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.render();
        }
    }

    render() {
        if (this.canvas && this.ctx) {
            this.drawTableWaveform();
        }
    }
}