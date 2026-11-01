import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const base = 'https://www.tinhthanhpho.com/data/';
const directory = JSON.parse(await readFile('public/data/vietnam-administrative-latest.json', 'utf8'));
async function download(name) {
  const response = await fetch(base + name, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  return response.json();
}
function geometry(value) {
  if (typeof value === 'number') return Math.round(value * 100000) / 100000;
  return value.map(geometry);
}
function compact(data) {
  return {
    type: 'FeatureCollection',
    metadata: { source: 'https://www.tinhthanhpho.com/en/api-docs', license: 'CC BY 4.0', version: data.metadata.data_version, precision: 'coordinates rounded to 5 decimal places; no polygon simplification' },
    features: data.features.map(feature => {
      const coordinates = geometry(feature.geometry.coordinates);
      const bounds = [Infinity, Infinity, -Infinity, -Infinity];
      const visit = values => {
        if (typeof values[0] === 'number') { bounds[0] = Math.min(bounds[0], values[0]); bounds[1] = Math.min(bounds[1], values[1]); bounds[2] = Math.max(bounds[2], values[0]); bounds[3] = Math.max(bounds[3], values[1]); }
        else values.forEach(visit);
      };
      visit(coordinates);
      return { type: 'Feature', properties: { code: Number(feature.properties.code) }, bbox: bounds, geometry: { type: feature.geometry.type, coordinates } };
    })
  };
}
const provinces = compact(await download('provinces.geojson'));
if (provinces.features.length !== directory.length) throw new Error('Province coverage changed; review the source.');
const files = new Map();
for (let offset = 0; offset < directory.length; offset += 3) {
  const batch = await Promise.all(directory.slice(offset, offset + 3).map(async province => {
    const code = String(province.code).padStart(2, '0');
    if (!/^\d{2}$/.test(code)) throw new Error('Invalid province code');
    const data = compact(await download(`wards-${code}.geojson`));
    const expected = new Set(province.wards.map(ward => ward.code));
    if (data.features.length !== expected.size || data.features.some(feature => !expected.has(feature.properties.code))) throw new Error(`Ward coverage changed for ${province.name}; review before updating.`);
    return [`wards-${code}.json`, data];
  }));
  batch.forEach(([name, data]) => files.set(name, data));
}
const [history, legacy] = await Promise.all([download('ward-merge-history.json'), download('wards-legacy.json')]);
const oldTypes = new Map(legacy.data.map(ward => [ward.code, ward.type]));
const aliases = new Map();
for (const row of history.data) {
  const province = directory.find(province => province.code === Number(row.new_province_code));
  const wardCode = Number(row.new_ward_code);
  if (!province?.wards.some(ward => ward.code === wardCode)) throw new Error('Merge target missing from the current directory');
  const key = `${row.new_province_code}:${row.old_ward_code}`;
  let item = aliases.get(key);
  if (!item) {
    item = { provinceCode: province.code, name: `${oldTypes.get(row.old_ward_code) || 'Xã'} ${row.old_ward_name}`, district: row.old_district_name, targets: [], full: true };
    aliases.set(key, item);
  }
  if (!item.targets.includes(wardCode)) item.targets.push(wardCode);
  if (row.scope !== 'full') item.full = false;
}
const output = path.resolve('public/data/administrative-boundaries');
await mkdir(output, { recursive: true });
let bytes = 0;
await writeFile(path.join(output, 'index.json'), JSON.stringify({ metadata: provinces.metadata, provinces: provinces.features.map(feature => ({ code: feature.properties.code, bbox: feature.bbox })) }) + '\n');
for (const [name, data] of files) {
  const text = gzipSync(JSON.stringify(data), { level: 9 });
  bytes += text.length;
  await writeFile(path.join(output, name + '.gz'), text);
}
const previousAliases = JSON.parse(await readFile('public/data/vietnam-ward-aliases.json', 'utf8').catch(() => '{"aliases":[]}'));
const preserved = previousAliases.aliases.filter(item => item.kind === 'reclassification' && directory.some(province => province.code === item.provinceCode && item.targets.every(code => province.wards.some(ward => ward.code === code))));
await writeFile('public/data/vietnam-ward-aliases.json', JSON.stringify({ source: base + 'ward-merge-history.json', license: 'CC BY 4.0', version: history.metadata.data_version, aliases: [...aliases.values(), ...preserved] }) + '\n');
console.log(`Saved ${files.size} boundary files (${Math.round(bytes / 1024)} KiB) covering all ${directory.flatMap(province => province.wards).length} wards, and ${aliases.size} legacy-name records.`);
