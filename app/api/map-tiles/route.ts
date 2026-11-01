import { mapTile } from '../../../lib/map-tiles.mjs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return mapTile(request);
}
