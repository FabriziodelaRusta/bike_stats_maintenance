import { Bike, BikeComponentLink, MaintenanceLog, Ride } from '../types';

export interface ComponentMaintenanceStatus {
  componentLink: BikeComponentLink;
  categoryName: string;
  displayName: string;
  lastMaintenanceDate: string | null;
  lastMaintenanceOp: string | null;
  kmSinceLastMaintenance: number;
  ridesSinceLastMaintenance: number;
  targetLifespanKm: number;
  wearPercentage: number;
  statusLevel: 'good' | 'warning' | 'critical' | 'unknown';
}

export function computeBikeStats(bikeId: string, rides: Ride[]) {
  const bikeRides = rides.filter((r) => r.bikeId === bikeId);
  const totalRides = bikeRides.length;
  const totalKm = bikeRides.reduce((sum, r) => sum + (Number(r.distanceKm) || 0), 0);
  const totalDplus = bikeRides.reduce((sum, r) => sum + (Number(r.elevationGainM) || 0), 0);
  return {
    totalRides,
    totalKm: Math.round(totalKm * 10) / 10,
    totalDplus: Math.round(totalDplus),
  };
}

export function computeBikeComponentStatuses(
  bikeId: string,
  componentLinks: BikeComponentLink[],
  categories: { id: string; name: string; defaultLifespanKm: number }[],
  maintenanceLogs: MaintenanceLog[],
  rides: Ride[]
): ComponentMaintenanceStatus[] {
  const linksForBike = componentLinks.filter((link) => link.bikeId === bikeId);
  const bikeRides = rides.filter((r) => r.bikeId === bikeId);

  return linksForBike.map((link) => {
    const category = categories.find((c) => c.id === link.componentCategoryId);
    const categoryName = category?.name || 'Composant';
    const displayName = link.customName || categoryName;

    // Find maintenance logs for this component on this bike
    const relatedLogs = maintenanceLogs
      .filter((log) => {
        if (log.bikeId !== bikeId) return false;
        if (log.bikeComponentLinkId === link.id) return true;
        // match by name
        return (
          log.componentName.toLowerCase().trim() === categoryName.toLowerCase().trim() ||
          log.componentName.toLowerCase().trim() === displayName.toLowerCase().trim()
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const latestLog = relatedLogs[0];
    const baselineDate = latestLog?.date || link.installedDate;
    const baselineOp = latestLog?.operationType || 'Installation initiale';

    // Calculate km and rides strictly since that date
    let kmSince = 0;
    let ridesSince = 0;

    bikeRides.forEach((r) => {
      // If ride date >= baseline date
      if (r.date >= baselineDate) {
        kmSince += Number(r.distanceKm) || 0;
        ridesSince += 1;
      }
    });

    const targetLifespanKm = link.lifespanKmTarget || category?.defaultLifespanKm || 5000;
    const wearPercentage = Math.min(150, Math.round((kmSince / targetLifespanKm) * 100));

    let statusLevel: 'good' | 'warning' | 'critical' | 'unknown' = 'good';
    if (wearPercentage >= 100) {
      statusLevel = 'critical';
    } else if (wearPercentage >= 75) {
      statusLevel = 'warning';
    }

    return {
      componentLink: link,
      categoryName,
      displayName,
      lastMaintenanceDate: latestLog ? latestLog.date : link.installedDate,
      lastMaintenanceOp: baselineOp,
      kmSinceLastMaintenance: Math.round(kmSince * 10) / 10,
      ridesSinceLastMaintenance: ridesSince,
      targetLifespanKm,
      wearPercentage,
      statusLevel,
    };
  });
}
