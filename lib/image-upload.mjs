const MAX_DIMENSION = 12000, MAX_PIXELS = 40000000;
const dimensions = (width, height) => Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0 && width <= MAX_DIMENSION && height <= MAX_DIMENSION && width * height <= MAX_PIXELS;
const fail = () => { throw new Error('Nội dung ảnh không hợp lệ. Chọn ảnh PNG, JPG hoặc WebP thật, tối đa 40 triệu điểm ảnh và 12.000 px mỗi chiều.'); };
export function inspectUploadedImage(buffer, declaredType) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (!bytes.length || bytes.length > 5 * 1024 * 1024) fail();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (offset, count) => String.fromCharCode(...bytes.subarray(offset, offset + count));
  let type, width, height;
  if (bytes.length >= 45 && [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)) {
    type = 'image/png'; let offset = 8, idat = false, ended = false;
    if (view.getUint32(offset) !== 13 || ascii(12,4) !== 'IHDR') fail();
    width = view.getUint32(16); height = view.getUint32(20);
    if (bytes[26] !== 0 || bytes[27] !== 0 || bytes[28] > 1) fail();
    const depth = bytes[24], color = bytes[25];
    if (!({0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16]}[color] || []).includes(depth)) fail();
    while (offset + 12 <= bytes.length) {
      const length = view.getUint32(offset), chunk = ascii(offset + 4,4);
      if (length > bytes.length - offset - 12) fail();
      if (chunk === 'IDAT' && length) idat = true;
      offset += length + 12;
      if (chunk === 'IEND') { if (length !== 0 || offset !== bytes.length) fail(); ended = true; break; }
    }
    if (!idat || !ended) fail();
  } else if (bytes.length >= 20 && bytes[0] === 255 && bytes[1] === 216) {
    type = 'image/jpeg'; let offset = 2, scan = false;
    if (bytes.at(-2) !== 255 || bytes.at(-1) !== 217) fail();
    while (offset + 4 <= bytes.length) {
      if (bytes[offset++] !== 255) fail();
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 217) break;
      if (marker === 216 || marker === 0 || marker >= 208 && marker <= 215) fail();
      if (offset + 2 > bytes.length) fail();
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) fail();
      if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)) {
        if (length < 8) fail(); height = view.getUint16(offset+3); width = view.getUint16(offset+5);
      }
      if (marker === 218) { scan = offset + length < bytes.length - 2; break; }
      offset += length;
    }
    if (!scan) fail();
  } else if (bytes.length >= 30 && ascii(0,4) === 'RIFF' && ascii(8,4) === 'WEBP') {
    type = 'image/webp'; if (view.getUint32(4,true) + 8 !== bytes.length) fail();
    let offset = 12, image = false;
    while (offset + 8 <= bytes.length) {
      const chunk = ascii(offset,4), length = view.getUint32(offset+4,true), data = offset+8;
      if (length > bytes.length-data) fail();
      if (chunk === 'VP8 ' && length >= 10 && bytes[data+3] === 157 && bytes[data+4] === 1 && bytes[data+5] === 42) {
        width = view.getUint16(data+6,true)&16383; height = view.getUint16(data+8,true)&16383; image = true;
      } else if (chunk === 'VP8L' && length >= 5 && bytes[data] === 47) {
        const bits = view.getUint32(data+1,true); width = (bits&16383)+1; height = ((bits>>>14)&16383)+1; image = true;
      } else if (chunk === 'VP8X' && length >= 10) {
        // Animated images need a full animation decoder; do not accept a canvas alone.
        if (bytes[data]&2) fail();
        const canvasWidth = 1 + bytes[data+4] + bytes[data+5]*256 + bytes[data+6]*65536;
        const canvasHeight = 1 + bytes[data+7] + bytes[data+8]*256 + bytes[data+9]*65536;
        if (!dimensions(canvasWidth, canvasHeight)) fail();
      }
      offset = data + length + (length%2);
    }
    if (!image || offset !== bytes.length) fail();
  } else fail();
  if (type !== declaredType || !dimensions(width,height)) fail();
  return { type, width, height };
}
