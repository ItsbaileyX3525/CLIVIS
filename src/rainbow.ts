export class Rainbow {
    private seed: number = 0;
    private state: number = 0;

    setSeed(seed: number) {
        this.seed = seed >>> 0;
        this.state = this.seed;
    }

    private rng(): number {
        this.state = (this.state * 1664525 + 1013904223) >>> 0;
        return this.state / 4294967296;
    }

    private hslToRgb(h: number, s: number, l: number) {
        h = ((h % 360) + 360) % 360;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
    }

    private rgbToAnsi256(r: number, g: number, b: number) {
        const to6 = (v: number) => Math.max(0, Math.min(5, Math.floor((v / 255) * 6)));
        const ri = to6(r), gi = to6(g), bi = to6(b);
        return 16 + 36 * ri + 6 * gi + bi;
    }

    private maybeLolifyWord(word: string): string {
        const lower = word.toLowerCase();
        const repls: [RegExp, string, number][] = [
            [/\bthe\b/i, 'teh', 0.6],
            [/\bhas\b/i, 'haz', 0.9],
            [/\bhave\b/i, 'haz', 0.6],
            [/\byou\b/i, 'u', 0.5],
            [/\byour\b/i, 'ur', 0.6],
            [/\bcat\b/i, 'kitteh', 0.9],
            [/\blove\b/i, 'luv', 0.6],
        ];
        for (const [rx, rep, prob] of repls) {
            if (rx.test(lower) && this.rng() < prob) {
                return word.replace(rx, (m) => {
                    const out = rep;
                    if (m[0] === m[0].toUpperCase()) return out[0].toUpperCase() + out.slice(1);
                    return out;
                });
            }
        }
        return word;
    }

    private randomCase(token: string) {
        let out = '';
        for (let i = 0; i < token.length; i++) {
            const ch = token[i];
            if (/[a-zA-Z]/.test(ch)) {
                out += this.rng() < 0.35 ? ch.toUpperCase() : ch.toLowerCase();
            } else out += ch;
        }
        return out;
    }

    rainbowOnly(text: string): string {
        const lines = text.split('\n');
        const baseSeedHue = (this.seed % 360);
        return lines.map((line, lineIndex) => {
            let charIndex = 0;
            return line.split('').map((ch) => {
                if (ch === ' ' || ch === '\t') {
                    return ch; // Keep whitespace as-is without coloring
                }
                const hue = (baseSeedHue + lineIndex * 30 + charIndex * 10) % 360;
                const [r, g, b] = this.hslToRgb(hue, 0.9, 0.6);
                const colorIndex = this.rgbToAnsi256(r, g, b);
                charIndex++;
                return `\x1b[38;5;${colorIndex}m${ch}\x1b[0m`;
            }).join('');
        }).join('\n');
    }

    fromString(text: string): string {
        const lines = text.split('\n');
        const baseSeedHue = (this.seed % 360);
        return lines.map((line, lineIndex) => {
            const tokens = line.match(/(\s+|[^\s]+)/g) || [];
            const maybePrefix = this.rng() < 0.08 ? (this.rng() < 0.5 ? 'hai ' : 'OMGWTF ') : '';
            let charGlobalIndex = 0;
            const processed = tokens.map(token => {
                if (/^\s+$/.test(token)) {
                    charGlobalIndex += token.length;
                    return token;
                }
                token = this.maybeLolifyWord(token);
                token = this.randomCase(token);
                if (this.rng() < 0.06) token += ' :3';
                const coloredChars = token.split('').map((ch, i) => {
                    const offset = charGlobalIndex + i;
                    const hue = (baseSeedHue + lineIndex * 30 + offset * 10 + Math.floor(this.rng() * 20)) % 360;
                    const [r, g, b] = this.hslToRgb(hue, 0.9, 0.6);
                    const colorIndex = this.rgbToAnsi256(r, g, b);
                    return `\x1b[38;5;${colorIndex}m${ch}\x1b[0m`;
                }).join('');
                charGlobalIndex += token.length;
                return coloredChars;
            }).join('');
            const maybeSuffix = this.rng() < 0.12 ? (this.rng() < 0.5 ? ' ~nya' : ' kthx') : '';
            return maybePrefix + processed + maybeSuffix;
        }).join('\n');
    }
}

export const rainbow = new Rainbow();
