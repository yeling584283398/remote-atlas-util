const HexChars = '0123456789abcdef'.split('');
const _t = ['', '', '', ''];
const UuidTemplate = _t.concat(_t, '-', _t, '-', _t, '-', _t, '-', _t, _t, _t);
const Indices = UuidTemplate.map((x, i) => (x === '-' ? NaN : i)).filter(isFinite);
const BASE64_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const BASE64_VALUES = new Array(123); // max char code in base64Keys
for (let i = 0; i < 123; ++i) { BASE64_VALUES[i] = 64; } // fill with placeholder('=') index
for (let i = 0; i < 64; ++i) { BASE64_VALUES[BASE64_KEYS.charCodeAt(i)] = i; }

export function decodeUuid (base64: string): string {
    const strs = base64.split('@');
    const uuid = strs[0];
    if (uuid.length !== 22) {
        return base64;
    }
    UuidTemplate[0] = base64[0];
    UuidTemplate[1] = base64[1];
    for (let i = 2, j = 2; i < 22; i += 2) {
        const lhs = BASE64_VALUES[base64.charCodeAt(i)];
        const rhs = BASE64_VALUES[base64.charCodeAt(i + 1)];
        UuidTemplate[Indices[j++]] = HexChars[lhs >> 2];
        UuidTemplate[Indices[j++]] = HexChars[((lhs & 3) << 2) | rhs >> 4];
        UuidTemplate[Indices[j++]] = HexChars[rhs & 0xF];
    }
    return base64.replace(uuid, UuidTemplate.join(''));
}

export function encodeUuid(uuid: string): string {
    const str = uuid.replace(/-/g, '');
    const temp = [];
    for (let i = 0; i < 5; i++) {
        temp[i] = str[i];
    }
    for (let i = 5, j = 5; i < 32; i += 3, j += 2) {
        const s1 = HexChars.indexOf(str[i]);
        const s2 = HexChars.indexOf(str[i + 1]);
        const s3 = HexChars.indexOf(str[i + 2]);
        const lhs = (s1 << 2) | (s2 & 12) >> 2;
        const rhs = s3 | ((s2 & 3) << 4)
        temp[j] = BASE64_KEYS[lhs];
        temp[j + 1] = BASE64_KEYS[rhs];
    }
    return temp.join('');
}

export function consoleError(msg: string): void {
    console.log('\x1B[31m%s\x1B[0m', msg);
  }
