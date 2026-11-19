import { normalizeMapsConfig } from '../../../public/maps-config.js';

export async function GET() {
  return Response.json(normalizeMapsConfig(), { headers: { 'Cache-Control': 'no-store' } });
}
