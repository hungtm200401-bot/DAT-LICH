const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

// Retry only the tiles in the current viewport. Successful direct requests keep
// their browser cache; a failed provider connection does not recreate the map.
export function createLocationTiles(L) {
  let preferProxy = false, disposed = false;
  const pending = new Map();
  const cancel = tile => {
    const request = pending.get(tile);
    if (!request) return;
    request.cancelled = true;
    clearTimeout(request.timer);
    tile.onload = tile.onerror = null;
    pending.delete(tile);
  };
  const Tiles = L.TileLayer.extend({
    createTile(coords, done) {
      const tile = document.createElement('img');
      tile.alt = '';
      tile.setAttribute('role', 'presentation');
      const request = { cancelled: false, timer: 0, proxy: preferProxy };
      pending.set(tile, request);
      const finish = error => {
        if (disposed || request.cancelled) return;
        cancel(tile);
        if (error) tile.style.visibility = 'hidden';
        done(error, tile);
      };
      const failed = () => {
        if (disposed || request.cancelled) return;
        if (!request.proxy) {
          preferProxy = true;
          request.proxy = true;
          start();
        } else finish(new Error('Map tile unavailable'));
      };
      const start = () => {
        clearTimeout(request.timer);
        tile.onload = () => tile.naturalWidth ? finish(null) : failed();
        tile.onerror = failed;
        request.timer = setTimeout(failed, request.proxy ? 10000 : 4500);
        tile.src = request.proxy
          ? `/api/map-tiles?z=${coords.z}&x=${coords.x}&y=${coords.y}`
          : this.getTileUrl(coords);
      };
      start();
      return tile;
    }
  });
  const layer = new Tiles(TILE_URL, {
    maxZoom: 19, updateWhenIdle: true, updateWhenZooming: false, keepBuffer: 2,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
  });
  layer.on('tileunload tileabort', event => cancel(event.tile));
  layer.retry = () => {
    if (disposed) return;
    preferProxy = false;
    layer.redraw();
  };
  layer.dispose = () => {
    disposed = true;
    for (const tile of pending.keys()) cancel(tile);
  };
  return layer;
}
