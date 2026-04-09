// Minimal QR Code generator (byte mode, versions 1-6, ECC level M) that renders to a PNG data URL.
// This avoids external deps (npm installs are blocked in this environment).
//
// Implementation notes:
// - Supports UTF-8 input via TextEncoder.
// - Always uses Byte mode (0100), ECC level M, mask pattern 0.
// - Versions limited to 1-6 to avoid version info blocks.

const EC_LEVEL = "M";
const MASK_PATTERN = 0;

const BYTE_CAPACITY_M = {
  1: 14,
  2: 26,
  3: 42,
  4: 62,
  5: 84,
  6: 106,
};

// RS block parameters for versions 1-6, EC level M.
// Format: [ [count, totalCount, dataCount], ... ]
// totalCount = dataCount + ecCount per block.
const RS_BLOCKS_M = {
  1: [[1, 26, 16]],
  2: [[1, 44, 28]],
  3: [[1, 70, 44]],
  4: [[2, 50, 32]],
  5: [[2, 67, 43]],
  6: [[4, 43, 27]],
};

const ALIGNMENT_POS = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
};

const getModuleCount = (version) => 17 + version * 4;

class BitBuffer {
  constructor() {
    this.bits = [];
  }
  put(value, length) {
    for (let i = length - 1; i >= 0; i--) {
      this.bits.push(((value >>> i) & 1) === 1);
    }
  }
  putBytes(bytes) {
    for (const b of bytes) this.put(b, 8);
  }
  get length() {
    return this.bits.length;
  }
  toBytes() {
    const bytes = [];
    let acc = 0;
    for (let i = 0; i < this.bits.length; i++) {
      acc = (acc << 1) | (this.bits[i] ? 1 : 0);
      if ((i & 7) === 7) {
        bytes.push(acc & 0xff);
        acc = 0;
      }
    }
    const rem = this.bits.length & 7;
    if (rem !== 0) {
      acc <<= 8 - rem;
      bytes.push(acc & 0xff);
    }
    return bytes;
  }
}

const utf8Bytes = (text) => {
  if (typeof TextEncoder !== "undefined") {
    return Array.from(new TextEncoder().encode(String(text ?? "")));
  }
  // Fallback: naive Latin-1.
  const s = String(text ?? "");
  return Array.from(s).map((ch) => ch.charCodeAt(0) & 0xff);
};

// GF(256) with primitive poly 0x11d
const GF_EXP = new Array(512).fill(0);
const GF_LOG = new Array(256).fill(0);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

const gfMul = (a, b) => {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
};

const rsGeneratorPoly = (ecCount) => {
  // Start with [1]
  let poly = [1];
  for (let i = 0; i < ecCount; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], 1);
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
    }
    poly = next;
  }
  return poly; // length ecCount+1
};

const rsRemainder = (data, ecCount) => {
  const gen = rsGeneratorPoly(ecCount);
  const res = new Array(ecCount).fill(0);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ res[0];
    res.shift();
    res.push(0);
    if (factor !== 0) {
      for (let j = 0; j < ecCount; j++) {
        res[j] ^= gfMul(gen[j + 1], factor);
      }
    }
  }
  return res;
};

const chooseVersion = (bytesLen) => {
  for (let v = 1; v <= 6; v++) {
    if (bytesLen <= BYTE_CAPACITY_M[v]) return v;
  }
  return 6;
};

const buildCodewords = (version, bytes) => {
  const rsBlocks = RS_BLOCKS_M[version];
  const totalDataCount = rsBlocks.reduce((sum, [count, _t, dataCount]) => sum + count * dataCount, 0);

  const bb = new BitBuffer();
  // Mode: byte
  bb.put(0b0100, 4);
  // Char count indicator (versions 1-9: 8 bits for byte mode)
  bb.put(bytes.length, 8);
  bb.putBytes(bytes);

  // Terminator up to 4 bits
  const totalBits = totalDataCount * 8;
  if (bb.length + 4 <= totalBits) bb.put(0, 4);
  else if (bb.length < totalBits) bb.put(0, totalBits - bb.length);

  // Pad to byte
  while ((bb.length & 7) !== 0) bb.put(0, 1);

  const dataBytes = bb.toBytes().slice(0, totalDataCount);

  // Pad bytes 0xEC, 0x11
  let pad = 0;
  while (dataBytes.length < totalDataCount) {
    dataBytes.push(pad % 2 === 0 ? 0xec : 0x11);
    pad++;
  }

  // Split into RS blocks and compute ECC
  const blocks = [];
  let offset = 0;
  for (const [count, totalCount, dataCount] of rsBlocks) {
    const ecCount = totalCount - dataCount;
    for (let i = 0; i < count; i++) {
      const dc = dataBytes.slice(offset, offset + dataCount);
      offset += dataCount;
      const ec = rsRemainder(dc, ecCount);
      blocks.push({ dc, ec });
    }
  }

  // Interleave data codewords
  const interleaved = [];
  const maxDcLen = Math.max(...blocks.map((b) => b.dc.length));
  const maxEcLen = Math.max(...blocks.map((b) => b.ec.length));
  for (let i = 0; i < maxDcLen; i++) {
    for (const b of blocks) if (i < b.dc.length) interleaved.push(b.dc[i]);
  }
  for (let i = 0; i < maxEcLen; i++) {
    for (const b of blocks) if (i < b.ec.length) interleaved.push(b.ec[i]);
  }

  return interleaved;
};

const bch15_5 = (value) => {
  // value is 5 bits. Return 15-bit format info with BCH (poly 0x537) and XOR mask 0x5412.
  let v = value << 10;
  const poly = 0x537;
  while (bitLength(v) - bitLength(poly) >= 0) {
    v ^= poly << (bitLength(v) - bitLength(poly));
  }
  const format = ((value << 10) | v) ^ 0x5412;
  return format & 0x7fff;
};

const bitLength = (n) => {
  let l = 0;
  while (n > 0) {
    l++;
    n >>>= 1;
  }
  return l;
};

const maskBit = (mask, r, c) => {
  // Only mask pattern 0 supported: (r + c) % 2 == 0
  if (mask === 0) return ((r + c) & 1) === 0;
  return false;
};

const makeMatrix = (version) => {
  const size = getModuleCount(version);
  const m = Array.from({ length: size }, () => Array.from({ length: size }, () => null));

  const set = (r, c, v) => {
    if (r < 0 || c < 0 || r >= size || c >= size) return;
    m[r][c] = v;
  };

  const reserve = (r, c) => set(r, c, false);

  const drawFinder = (r, c) => {
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const rr = r + y;
        const cc = c + x;
        if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
        const inOuter = y >= 0 && y <= 6 && x >= 0 && x <= 6;
        const inInner = y >= 2 && y <= 4 && x >= 2 && x <= 4;
        const val = inOuter && (y === 0 || y === 6 || x === 0 || x === 6 || inInner);
        m[rr][cc] = !!val;
      }
    }
  };

  const drawTiming = () => {
    for (let i = 8; i < size - 8; i++) {
      if (m[i][6] === null) m[i][6] = (i & 1) === 0;
      if (m[6][i] === null) m[6][i] = (i & 1) === 0;
    }
  };

  const drawAlignment = () => {
    const pos = ALIGNMENT_POS[version];
    for (let i = 0; i < pos.length; i++) {
      for (let j = 0; j < pos.length; j++) {
        const r = pos[i];
        const c = pos[j];
        // Skip over finder areas
        if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6)) continue;
        if (m[r][c] !== null) continue;
        for (let y = -2; y <= 2; y++) {
          for (let x = -2; x <= 2; x++) {
            const rr = r + y;
            const cc = c + x;
            const d = Math.max(Math.abs(x), Math.abs(y));
            m[rr][cc] = d === 2 || d === 0;
          }
        }
      }
    }
  };

  const reserveFormat = () => {
    for (let i = 0; i < 9; i++) {
      if (i !== 6) reserve(8, i);
      if (i !== 6) reserve(i, 8);
    }
    for (let i = size - 8; i < size; i++) {
      reserve(8, i);
      reserve(i, 8);
    }
    reserve(8, size - 8);
  };

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);
  drawTiming();
  drawAlignment();
  reserveFormat();

  // Dark module
  m[version * 4 + 9][8] = true;

  return m;
};

const placeFormatInfo = (matrix, version, ecLevel, mask) => {
  const size = matrix.length;
  // EC bits: L=01, M=00, Q=11, H=10
  const ecBits = ecLevel === "M" ? 0b00 : 0b00;
  const format = bch15_5((ecBits << 3) | (mask & 7));

  const bit = (i) => ((format >>> i) & 1) === 1; // i=0 is LSB

  // Standard placement (matches common implementations like qrcode-generator):
  for (let i = 0; i < 15; i++) {
    const b = bit(i);

    // Vertical: top-left (skip timing at row 6) then bottom-left
    if (i < 6) matrix[i][8] = b;
    else if (i < 8) matrix[i + 1][8] = b;
    else matrix[size - 15 + i][8] = b;

    // Horizontal: top-right then top-left (skip timing at col 6)
    if (i < 8) matrix[8][size - 1 - i] = b;
    else if (i < 9) matrix[8][7] = b;
    else matrix[8][14 - i] = b;
  }

  // Fixed dark module (also equals (4*version+9, 8))
  matrix[size - 8][8] = true;
};

const placeData = (matrix, codewords, version) => {
  const size = matrix.length;
  const bits = [];
  for (const cw of codewords) {
    for (let i = 7; i >= 0; i--) bits.push(((cw >>> i) & 1) === 1);
  }

  let bitIndex = 0;
  let dirUp = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // Skip timing column
    for (let rOff = 0; rOff < size; rOff++) {
      const row = dirUp ? size - 1 - rOff : rOff;
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        if (matrix[row][cc] !== null) continue;
        const b = bitIndex < bits.length ? bits[bitIndex++] : false;
        const masked = maskBit(MASK_PATTERN, row, cc) ? !b : b;
        matrix[row][cc] = masked;
      }
    }
    dirUp = !dirUp;
  }
};

const matrixToDataUrl = (matrix, sizePx = 220, marginModules = 2) => {
  if (typeof document === "undefined") return null;
  const n = matrix.length;
  const totalModules = n + marginModules * 2;
  const scale = Math.floor(sizePx / totalModules) || 1;
  const canvasSize = totalModules * scale;

  const canvas = document.createElement("canvas");
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  ctx.fillStyle = "#111827";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c]) {
        ctx.fillRect((c + marginModules) * scale, (r + marginModules) * scale, scale, scale);
      }
    }
  }

  return canvas.toDataURL("image/png");
};

export async function generateQrPngDataUrl(text, { sizePx = 220 } = {}) {
  const bytes = utf8Bytes(text);
  const version = chooseVersion(bytes.length);
  const matrix = makeMatrix(version);
  const codewords = buildCodewords(version, bytes);
  placeFormatInfo(matrix, version, EC_LEVEL, MASK_PATTERN);
  placeData(matrix, codewords, version);
  return matrixToDataUrl(matrix, sizePx, 2);
}
