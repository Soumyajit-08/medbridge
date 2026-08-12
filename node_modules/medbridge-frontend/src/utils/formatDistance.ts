export function formatDistance(km: number | undefined): string {
  if (km === undefined || km === null) return 'Distance unavailable';
  if (km < 1) return 'Less than 1 km away';
  return `Approximately ${Math.round(km)} km away`;
}
