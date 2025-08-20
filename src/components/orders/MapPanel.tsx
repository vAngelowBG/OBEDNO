import React from 'react';

interface MapPanelProps {
  fullAddress: string;
  lat?: number | null;
  lng?: number | null;
}

export function MapPanel({ fullAddress, lat, lng }: MapPanelProps) {
  const hasCoords = typeof lat === 'number' && typeof lng === 'number';

  const googleUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  const appleUrl = hasCoords
    ? `http://maps.apple.com/?q=${lat},${lng}`
    : `http://maps.apple.com/?q=${encodeURIComponent(fullAddress)}`;

  const wazeUrl = hasCoords
    ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(fullAddress)}&navigate=yes`;

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-sm font-medium text-gray-900">Адрес за доставка</h3>
        <p className="mt-1 text-sm text-gray-600">{fullAddress}</p>
      </div>
      <div className="p-4">
        {!hasCoords ? (
          <div className="text-sm text-gray-600">
            Няма координати към адреса. Използвайте бутоните, за да отворите в карти.
          </div>
        ) : null}
        <div className="mt-4 flex items-center space-x-2">
          <a
            className="px-3 py-2 rounded bg-red-600 text-white text-sm hover:bg-red-700"
            href={googleUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open in Google Maps
          </a>
          <a
            className="px-3 py-2 rounded border text-sm hover:bg-gray-50"
            href={appleUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open in Apple Maps
          </a>
          <a
            className="px-3 py-2 rounded border text-sm hover:bg-gray-50"
            href={wazeUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open in Waze
          </a>
        </div>
      </div>
    </div>
  );
}


