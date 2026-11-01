// Shared by the booking form and the reverse-geocoding API.
const formerProvinces = {
  'Hà Nội': ['Hà Nội', 'Hanoi'], 'Cao Bằng': ['Cao Bằng'],
  'Tuyên Quang': ['Tuyên Quang', 'Hà Giang'], 'Điện Biên': ['Điện Biên'],
  'Lai Châu': ['Lai Châu'], 'Sơn La': ['Sơn La'], 'Lào Cai': ['Lào Cai', 'Yên Bái'],
  'Thái Nguyên': ['Thái Nguyên', 'Bắc Kạn'], 'Lạng Sơn': ['Lạng Sơn'],
  'Quảng Ninh': ['Quảng Ninh'], 'Bắc Ninh': ['Bắc Ninh', 'Bắc Giang'],
  'Phú Thọ': ['Phú Thọ', 'Vĩnh Phúc', 'Hòa Bình'], 'Hải Phòng': ['Hải Phòng', 'Hải Dương'],
  'Hưng Yên': ['Hưng Yên', 'Thái Bình'], 'Ninh Bình': ['Ninh Bình', 'Hà Nam', 'Nam Định'],
  'Thanh Hóa': ['Thanh Hóa'], 'Nghệ An': ['Nghệ An'], 'Hà Tĩnh': ['Hà Tĩnh'],
  'Quảng Trị': ['Quảng Trị', 'Quảng Bình'], 'Huế': ['Huế', 'Thừa Thiên Huế'],
  'Đà Nẵng': ['Đà Nẵng', 'Quảng Nam'], 'Quảng Ngãi': ['Quảng Ngãi', 'Kon Tum'],
  'Gia Lai': ['Gia Lai', 'Bình Định'], 'Khánh Hòa': ['Khánh Hòa', 'Ninh Thuận'],
  'Đắk Lắk': ['Đắk Lắk', 'Phú Yên'], 'Lâm Đồng': ['Lâm Đồng', 'Đắk Nông', 'Bình Thuận'],
  'Đồng Nai': ['Đồng Nai', 'Bình Phước'],
  'Hồ Chí Minh': ['Hồ Chí Minh', 'Bình Dương', 'Bà Rịa - Vũng Tàu', 'Saigon', 'Sài Gòn'],
  'Tây Ninh': ['Tây Ninh', 'Long An'], 'Đồng Tháp': ['Đồng Tháp', 'Tiền Giang'],
  'Vĩnh Long': ['Vĩnh Long', 'Bến Tre', 'Trà Vinh'], 'An Giang': ['An Giang', 'Kiên Giang'],
  'Cần Thơ': ['Cần Thơ', 'Sóc Trăng', 'Hậu Giang'], 'Cà Mau': ['Cà Mau', 'Bạc Liêu']
};

export function locationSearchKey(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function shortKey(value) {
  return locationSearchKey(value)
    .replace(/^(tinh|thanh pho|tp|phuong|xa|dac khu)\s+/, '')
    .replace(/\s+(province|city|municipality)$/, '').trim();
}

export function findProvince(directory, value) {
  const key = shortKey(value);
  if (!key || /^(quan|huyen|thi xa|phuong|xa|dac khu)\s/.test(locationSearchKey(value))) return null;
  const direct = directory.find(province => shortKey(province.name) === key);
  if (direct) return direct;
  const current = Object.entries(formerProvinces).find(([, names]) => names.some(name => shortKey(name) === key));
  return current ? directory.find(province => shortKey(province.name) === shortKey(current[0])) || null : null;
}

export function findWard(province, value, aliases = []) {
  if (!province || !value || /^(quan|huyen|thi xa)\s/.test(locationSearchKey(value))) return null;
  const exactName = String(value).normalize('NFC').trim().toLocaleLowerCase('vi');
  const named = province.wards.find(ward => ward.name.normalize('NFC').toLocaleLowerCase('vi') === exactName);
  if (named) return named;
  const key = locationSearchKey(value);
  const exact = province.wards.filter(ward => locationSearchKey(ward.name) === key);
  if (exact.length === 1) return exact[0];
  const type = key.match(/^(phuong|xa|dac khu)\s/)?.[1];
  const matches = province.wards.filter(ward => (!type || locationSearchKey(ward.name).startsWith(type + ' ')) && shortKey(ward.name) === shortKey(value));
  if (matches.length === 1) return matches[0];
  const legacy = aliases.filter(item => item.provinceCode === province.code && item.full && item.targets.length === 1 && (locationSearchKey(item.name) === key || shortKey(item.name) === shortKey(value)));
  const targets = [...new Set(legacy.flatMap(item => item.targets))];
  return targets.length === 1 ? province.wards.find(ward => ward.code === targets[0]) || null : null;
}

const addressText = value => typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
const addressPartNames = ['houseNumber', 'road', 'hamlet', 'neighbourhood', 'residential', 'suburb', 'building', 'postcode', 'ward', 'province', 'country'];
const cleanAddressParts = value => Object.fromEntries(addressPartNames.map(name => [name, addressText(value?.[name])]));

// Only detailed address components belong in the editable address field.
// Administrative names are appended separately from the current directory.
export function formatAddressDetails(value = {}) {
  const parts = cleanAddressParts(value);
  const seen = new Set([parts.ward, parts.province, parts.country].filter(Boolean).map(shortKey));
  const unique = text => {
    const key = shortKey(text);
    if (!key || seen.has(key)) return '';
    seen.add(key);
    return text;
  };
  const places = [parts.hamlet, parts.neighbourhood, parts.residential, parts.suburb]
    .filter(text => !/^(phuong|xa|dac khu|quan|huyen|thi xa|thanh pho|tinh)\s/.test(locationSearchKey(text)))
    .map(unique).filter(Boolean);
  const building = unique(parts.building);
  const street = unique(parts.road);
  const primary = street ? [parts.houseNumber, street].filter(Boolean).join(' ')
    : parts.houseNumber && (building || places.length) ? [parts.houseNumber, places.shift() || building].join(' ') : '';
  return [building && !(!street && primary.endsWith(building)) ? building : '', primary, ...places].filter(Boolean).join(', ');
}

export function normalizeReverseAddress(directory, data = {}) {
  const country = addressText(data.countryCode).toLowerCase();
  const addressParts = cleanAddressParts(data.addressParts);
  const foreign = Boolean(country && country !== 'vn');
  const displayParts = addressText(data.fullAddress).split(',').map(part => part.trim()).filter(Boolean);
  // A country or a raw ward token in display_name cannot become a province.
  const wardCandidates = [...(data.wardCandidates || []), data.ward, addressParts.ward];
  const excludedDisplay = new Set([addressParts.country, ...wardCandidates].filter(Boolean).map(locationSearchKey));
  const provinceCandidates = [...(data.provinceCandidates || []), data.city, addressParts.province,
    ...displayParts.slice().reverse().filter(part => !excludedDisplay.has(locationSearchKey(part)))];
  const province = !foreign && provinceCandidates.map(value => findProvince(directory, value)).find(Boolean);
  const ward = province && data.precision !== 'locality' ? [...wardCandidates, ...displayParts].map(value => findWard(province, value)).find(Boolean) : null;
  addressParts.ward = ward?.name || '';
  addressParts.province = province?.name || '';
  // The API always supplies this field, including null for unknown distance.
  // Keep raw-parser compatibility for consumers that have not requested a fix.
  const hasDistance = Object.hasOwn(data, 'featureDistanceMeters') || Object.hasOwn(data, 'addressDistance');
  const rawDistance = Object.hasOwn(data, 'featureDistanceMeters') ? data.featureDistanceMeters : data.addressDistance;
  const featureDistanceMeters = typeof rawDistance === 'number' && Number.isFinite(rawDistance) && rawDistance >= 0 ? rawDistance : null;
  const nearby = featureDistanceMeters !== null && featureDistanceMeters <= 150;
  if (hasDistance && (featureDistanceMeters === null || featureDistanceMeters > 25)) { addressParts.houseNumber = ''; addressParts.building = ''; }
  if (hasDistance && !nearby) {
    addressParts.road = '';
    addressParts.building = '';
  }
  if (foreign) for (const key of addressPartNames) if (key !== 'country') addressParts[key] = '';
  const hasStructuredParts = Boolean(data.addressParts && typeof data.addressParts === 'object');
  const address = foreign || (hasDistance && !nearby) ? ''
    : hasStructuredParts ? formatAddressDetails(addressParts) : addressText(data.address);
  const hasPlace = Boolean(formatAddressDetails({ ...addressParts, houseNumber: '' }));
  const addressPrecision = foreign ? 'missing'
    : addressParts.houseNumber && hasPlace && (!hasDistance || nearby) ? 'house'
    : addressParts.road && (!hasDistance || nearby) ? 'street'
    : addressParts.hamlet || addressParts.neighbourhood || addressParts.residential || addressParts.suburb || ward || province ? 'locality' : 'missing';
  const missingParts = [!addressParts.houseNumber && 'houseNumber', !hasPlace && 'road', !ward && 'ward', !province && 'province'].filter(Boolean);
  return {
    address, city: province?.name || '', provinceCode: province?.code || null,
    ward: ward?.name || '', wardCode: ward?.code || null,
    countryCode: country || 'vn', source: data.source || '', addressParts, addressPrecision, missingParts,
    partial: missingParts.length > 0, fullAddress: [address, ward?.name, province?.name].filter(Boolean).join(', '),
    ...(hasDistance ? { featureDistanceMeters, addressDistance: featureDistanceMeters } : {})
  };
}

export function parseNominatimAddress(data) {
  const address = data?.address || {};
  const addressParts = cleanAddressParts({
    houseNumber: address.house_number, road: address.road || address.street || address.pedestrian,
    hamlet: address.hamlet, neighbourhood: address.neighbourhood || address.neighborhood,
    residential: address.residential, suburb: address.suburb, building: address.building || address.building_name,
    postcode: address.postcode, country: address.country
  });
  const coordinate = (value, limit) => value != null && addressText(value) !== '' && Number.isFinite(Number(value)) && Math.abs(Number(value)) <= limit ? Number(value) : null;
  const lat = coordinate(data?.lat, 90), lon = coordinate(data?.lon, 180);
  // OSM's `city` can be a town or a former district. State/province has priority.
  return {
    address: formatAddressDetails(addressParts), addressParts,
    provinceCandidates: [address.state, address.province, address.city, address.region],
    wardCandidates: [address.quarter, address.suburb, address.village, address.town, address.municipality, address.city_district, address.city],
    countryCode: address.country_code || '', fullAddress: data?.display_name || '', source: 'openstreetmap',
    featureLocation: lat !== null && lon !== null ? { lat, lon } : null
  };
}

export function parseBigDataCloudAddress(data) {
  return {
    address: '', provinceCandidates: [data?.principalSubdivision, data?.city],
    wardCandidates: [], precision: 'locality',
    countryCode: data?.countryCode || '', source: 'bigdatacloud'
  };
}

export function distanceMeters(first, second) {
  const radians = value => value * Math.PI / 180;
  const a = Math.sin(radians(second.lat - first.lat) / 2) ** 2 + Math.cos(radians(first.lat)) * Math.cos(radians(second.lat)) * Math.sin(radians(second.lon - first.lon) / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}

export function cleanLocationCoordinates(value) {
  if (!value || typeof value !== 'object' || typeof value.lat !== 'number' || typeof value.lon !== 'number' || !Number.isFinite(value.lat) || !Number.isFinite(value.lon) || Math.abs(value.lat) > 90 || Math.abs(value.lon) > 180) return null;
  return { lat: value.lat, lon: value.lon, accuracy: Number.isFinite(value.accuracy) && value.accuracy > 0 ? value.accuracy : null, mode: value.mode === 'pin' ? 'pin' : 'gps' };
}

export function canConfirmLocationPoint(value) {
  const point = cleanLocationCoordinates(value);
  return Boolean(point && (point.mode === 'pin' || (point.accuracy && point.accuracy <= 150)));
}

export function cleanBookingLocation(value, now = Date.now()) {
  const timestamp = raw => { const date = typeof raw === 'string' ? Date.parse(raw) : NaN; return Number.isFinite(date) && date <= now + 300000 ? new Date(date).toISOString() : ''; };
  const point = cleanLocationCoordinates(value.locationCoordinates);
  const devicePoint = cleanLocationCoordinates(value.locationDeviceCoordinates);
  const confirmedAt = timestamp(value.locationConfirmedAt);
  const region = value.locationRegion;
  const matches = region && Number.isSafeInteger(value.provinceCode) && value.provinceCode > 0 && Number.isSafeInteger(value.wardCode) && value.wardCode > 0 && region.provinceCode === value.provinceCode && region.wardCode === value.wardCode;
  const confirmed = Boolean(canConfirmLocationPoint(point) && confirmedAt && matches);
  return { locationCoordinates: confirmed ? point : null, locationDeviceCoordinates: devicePoint?.mode === 'gps' ? devicePoint : null, locationCapturedAt: devicePoint?.mode === 'gps' ? timestamp(value.locationCapturedAt) : '', locationConfirmedAt: confirmed ? confirmedAt : '' };
}
