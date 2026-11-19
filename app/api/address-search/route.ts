import { addressSearch } from '../../../lib/address-search.mjs';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  return addressSearch(request);
}
