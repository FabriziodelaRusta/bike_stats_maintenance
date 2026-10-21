import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Bike, Ride, RideTypeItem } from '../types';

export interface MonthlyStatItem {
  monthIndex: number;
  monthName: string;
  ridesCount: number;
  totalKm: number;
  totalDplus: number;
  typeBreakdown: { count: number; km: number; typeItem: RideTypeItem }[];
}

export interface PDFExportParams {
  year: number;
  periodLabel: string;
  selectedBikeName: string;
  selectedAeLabel: string;
  filteredRides: Ride[];
  bikes: Bike[];
  rideTypes: RideTypeItem[];
  appTitle: string;
  authorText: string;
  versionText: string;
  viewMode: 'annuelle' | 'mensuelle';
  selectedMonthIndex?: number;
  monthlyStats?: MonthlyStatItem[];
  calendarElement?: HTMLElement | null;
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export async function exportStatsToPdf(params: PDFExportParams): Promise<void> {
  const {
    year,
    periodLabel,
    selectedBikeName,
    selectedAeLabel,
    filteredRides,
    bikes,
    rideTypes,
    appTitle,
    authorText,
    versionText,
    viewMode,
    selectedMonthIndex = 0,
    monthlyStats = [],
    calendarElement,
  } = params;

  // Create document in Landscape mode (297mm x 210mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 12;
  const usableWidth = pageWidth - margin * 2; // 273mm

  const totalRides = filteredRides.length;
  const totalKm = filteredRides.reduce((s, r) => s + (Number(r.distanceKm) || 0), 0);
  const totalDplus = filteredRides.reduce((s, r) => s + (Number(r.elevationGainM) || 0), 0);
  const avgKm = totalRides > 0 ? (totalKm / totalRides).toFixed(1) : '0';

  const exportDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Helper to draw standard header on any page
  const drawPageHeader = (pageTitleSuffix: string = '') => {
    // Slate-900 top banner
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 22, 'F');

    // App Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(appTitle || 'Stats & Maintenance Vélo', margin, 10);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    const subtitle = `Rapport Calendrier Paysage • Année ${year} • ${periodLabel} ${pageTitleSuffix}`;
    doc.text(subtitle, margin, 16);

    // Export date on the right
    doc.text(`Édité le : ${exportDate}`, pageWidth - margin, 16, { align: 'right' });
  };

  // Helper to draw standard footer on any page
  const drawPageFooter = (pageNum: number, totalPagesStr: string = '2') => {
    const footerY = pageHeight - 8;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 2.5, pageWidth - margin, footerY - 2.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Stats et Maintenance Vélo • Format Paysage Officiel', margin, footerY + 1.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(`${authorText} • ${versionText}`, pageWidth / 2, footerY + 1.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${pageNum} / ${totalPagesStr}`, pageWidth - margin, footerY + 1.5, { align: 'right' });
  };

  // ---------------- PAGE 1: HEADER + FILTERS + KPIS + CALENDAR VIEW ----------------
  drawPageHeader(viewMode === 'annuelle' ? '(Vue Annuelle)' : `(Vue Mensuelle - ${MONTH_NAMES[selectedMonthIndex]})`);

  let currentY = 27;

  // Filter Bar
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, usableWidth, 9, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('FILTRES :', margin + 3, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Vélo : ${selectedBikeName}   |   Assistance : ${selectedAeLabel}   |   Période : ${periodLabel}   |   Affichage : ${viewMode === 'annuelle' ? 'Calendrier Annuel (12 Mois)' : `Mois de ${MONTH_NAMES[selectedMonthIndex]}`}`,
    margin + 20,
    currentY + 5.5
  );

  currentY += 12;

  // KPI Summary Cards (4 cards in landscape)
  const cardWidth = (usableWidth - 9) / 4;
  const kpis = [
    { label: 'KILOMÈTRES TOTAUX', val: `${Math.round(totalKm).toLocaleString('fr-FR')} km`, color: [16, 185, 129] },
    { label: 'RANDOS EFFECTUÉES', val: `${totalRides} sorties`, color: [37, 99, 235] },
    { label: 'DÉNIVELÉ POSITIF (D+)', val: `${totalDplus.toLocaleString('fr-FR')} m`, color: [217, 119, 6] },
    { label: 'DISTANCE MOYENNE', val: `${avgKm} km / rando`, color: [124, 58, 237] },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, currentY, cardWidth, 14, 1.5, 1.5, 'FD');

    // Colored left border
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.rect(cardX, currentY, 2.5, 14, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cardX + 5, currentY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.val, cardX + 5, currentY + 11);
  });

  currentY += 18;

  // Section Title for Calendar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  const calendarSectionTitle =
    viewMode === 'annuelle'
      ? `Calendrier Annuel ${year} : Synthèse par Mois et Sous-détails par Type de Rando`
      : `Calendrier Mensuel : ${MONTH_NAMES[selectedMonthIndex]} ${year}`;
  doc.text(calendarSectionTitle, margin, currentY);

  currentY += 4;

  // Let's render the Calendar exactly as shown on the HTML page:
  let imageCaptured = false;

  if (calendarElement) {
    try {
      const canvas = await html2canvas(calendarElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const availableHeightOnPage1 = pageHeight - currentY - 14;

      if (imgHeight <= availableHeightOnPage1) {
        // Fits entirely on Page 1
        doc.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
        imageCaptured = true;
      } else {
        // If it fits well or slightly exceeds, scale proportionally to fit page 1
        const maxScaleHeight = availableHeightOnPage1;
        const scaledWidth = (imgWidth * maxScaleHeight) / imgHeight;
        const centeredX = margin + (usableWidth - scaledWidth) / 2;
        doc.addImage(imgData, 'PNG', centeredX, currentY, scaledWidth, maxScaleHeight);
        imageCaptured = true;
      }
    } catch (e) {
      console.warn('html2canvas capture fallback to vector rendering', e);
      imageCaptured = false;
    }
  }

  // High-precision vector fallback that mirrors the HTML layout perfectly in landscape
  if (!imageCaptured) {
    if (viewMode === 'annuelle' && monthlyStats.length === 12) {
      // 12 month cards in a 4 columns x 3 rows grid
      const cols = 4;
      const rows = 3;
      const cellWidth = (usableWidth - (cols - 1) * 3) / cols;
      const cellHeight = 44;

      monthlyStats.forEach((m, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const cellX = margin + col * (cellWidth + 3);
        const cellY = currentY + row * (cellHeight + 2.5);

        // Card container
        doc.setFillColor(m.ridesCount > 0 ? 255 : 248, m.ridesCount > 0 ? 255 : 250, m.ridesCount > 0 ? 255 : 252);
        doc.setDrawColor(m.ridesCount > 0 ? 203 : 226, m.ridesCount > 0 ? 213 : 232, m.ridesCount > 0 ? 225 : 240);
        doc.roundedRect(cellX, cellY, cellWidth, cellHeight, 1.5, 1.5, 'FD');

        // Month Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(m.monthName, cellX + 3, cellY + 5.5);

        // Pill with ride count
        if (m.ridesCount > 0) {
          doc.setFillColor(209, 250, 229); // emerald-100
          doc.roundedRect(cellX + cellWidth - 22, cellY + 2, 19, 4.5, 1, 1, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6);
          doc.setTextColor(6, 95, 70); // emerald-800
          doc.text(`${m.ridesCount} rando${m.ridesCount > 1 ? 's' : ''}`, cellX + cellWidth - 12.5, cellY + 5.2, { align: 'center' });
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6);
          doc.setTextColor(148, 163, 184);
          doc.text('0 rando', cellX + cellWidth - 4, cellY + 5.2, { align: 'right' });
        }

        // Total km & D+
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(`${m.totalKm} km`, cellX + 3, cellY + 12);

        if (m.totalDplus > 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(217, 119, 6);
          doc.text(`+${m.totalDplus} m D+`, cellX + cellWidth - 3, cellY + 12, { align: 'right' });
        }

        // Divider
        doc.setDrawColor(241, 245, 249);
        doc.line(cellX + 2, cellY + 14.5, cellX + cellWidth - 2, cellY + 14.5);

        // Sub-details per ride type
        let subY = cellY + 18.5;
        if (m.typeBreakdown.length > 0) {
          m.typeBreakdown.slice(0, 3).forEach((tb) => {
            // Little circle
            doc.setFillColor(37, 99, 235);
            doc.circle(cellX + 4, subY - 1, 0.9, 'F');

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.setTextColor(51, 65, 85);
            const nameStr = tb.typeItem.name.length > 18 ? tb.typeItem.name.substring(0, 16) + '..' : tb.typeItem.name;
            doc.text(nameStr, cellX + 7, subY);

            doc.setFont('helvetica', 'bold');
            doc.text(`${Math.round(tb.km)} km (${tb.count})`, cellX + cellWidth - 3, subY, { align: 'right' });

            subY += 4.5;
          });
        } else {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(6);
          doc.setTextColor(148, 163, 184);
          doc.text('Aucune sortie', cellX + 3, subY);
        }
      });
    }
  }

  // Draw Page 1 Footer
  drawPageFooter(1, '2');

  // ---------------- PAGE 2: DETAILED TABLES & CHRONOLOGY ----------------
  doc.addPage('a4', 'landscape');
  drawPageHeader('• Détails Analytiques des Sorties & Vélos');

  let p2Y = 28;

  // Two-column layout in Landscape: Left = Breakdown by Type, Right = Breakdown by Bike
  const colW = (usableWidth - 6) / 2;

  // Left Column: Breakdown by Ride Type
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Répartition par Type de Randonnée', margin, p2Y);

  p2Y += 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, p2Y, colW, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('TYPE DE RANDO', margin + 3, p2Y + 4.2);
  doc.text('SORTIES', margin + 65, p2Y + 4.2);
  doc.text('KM CUMULÉS', margin + 95, p2Y + 4.2);
  doc.text('% TOTAL', margin + colW - 4, p2Y + 4.2, { align: 'right' });
  p2Y += 6;

  // Group by type
  const typeMap = new Map<string, { count: number; km: number; typeItem: RideTypeItem }>();
  rideTypes.forEach((rt) => typeMap.set(rt.id, { count: 0, km: 0, typeItem: rt }));
  filteredRides.forEach((r) => {
    const entry = typeMap.get(r.rideTypeId);
    if (entry) {
      entry.count += 1;
      entry.km += Number(r.distanceKm) || 0;
    }
  });

  const activeTypes = Array.from(typeMap.values())
    .filter((t) => t.count > 0)
    .sort((a, b) => b.km - a.km);

  activeTypes.forEach((t, i) => {
    const bg = i % 2 === 0 ? 255 : 248;
    doc.setFillColor(bg, bg, bg);
    doc.rect(margin, p2Y, colW, 5.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(t.typeItem.name, margin + 3, p2Y + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.text(`${t.count}`, margin + 65, p2Y + 3.8);
    doc.text(`${Math.round(t.km * 10) / 10} km`, margin + 95, p2Y + 3.8);

    const pct = totalKm > 0 ? ((t.km / totalKm) * 100).toFixed(1) : '0';
    doc.text(`${pct} %`, margin + colW - 4, p2Y + 3.8, { align: 'right' });

    p2Y += 5.5;
  });

  // Right Column: Breakdown by Bike
  const rightX = margin + colW + 6;
  let p2RightY = 28;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Kilométrage par Vélo & Assistance (AE)', rightX, p2RightY);

  p2RightY += 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(rightX, p2RightY, colW, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('VÉLO & MODÈLE', rightX + 3, p2RightY + 4.2);
  doc.text('TYPE', rightX + 60, p2RightY + 4.2);
  doc.text('AE', rightX + 90, p2RightY + 4.2);
  doc.text('KM & RANDOS', rightX + colW - 4, p2RightY + 4.2, { align: 'right' });
  p2RightY += 6;

  bikes.forEach((bike, i) => {
    const bRides = filteredRides.filter((r) => r.bikeId === bike.id);
    const bKm = bRides.reduce((s, r) => s + (Number(r.distanceKm) || 0), 0);

    const bg = i % 2 === 0 ? 255 : 248;
    doc.setFillColor(bg, bg, bg);
    doc.rect(rightX, p2RightY, colW, 5.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(`${bike.name} (${bike.brand})`, rightX + 3, p2RightY + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.text(bike.type, rightX + 60, p2RightY + 3.8);
    doc.text(bike.isElectric ? '⚡ AE' : 'Musculaire', rightX + 90, p2RightY + 3.8);
    doc.text(`${Math.round(bKm)} km (${bRides.length})`, rightX + colW - 4, p2RightY + 3.8, { align: 'right' });

    p2RightY += 5.5;
  });

  // Lower Section: Sample of Rides
  const nextSectionY = Math.max(p2Y, p2RightY) + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Liste Chronologique des Sorties Récentes', margin, nextSectionY);

  let listY = nextSectionY + 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, listY, usableWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('DATE', margin + 3, listY + 4.2);
  doc.text('VÉLO', margin + 30, listY + 4.2);
  doc.text('TYPE DE RANDO', margin + 80, listY + 4.2);
  doc.text('COMMENTAIRE SPÉCIFIQUE DU TYPE', margin + 125, listY + 4.2);
  doc.text('DISTANCE', margin + 215, listY + 4.2);
  doc.text('D+ (M)', margin + 245, listY + 4.2);
  doc.text('DURÉE', margin + usableWidth - 3, listY + 4.2, { align: 'right' });
  listY += 6;

  const displayRides = filteredRides.slice(0, 14);

  displayRides.forEach((ride, i) => {
    const bike = bikes.find((b) => b.id === ride.bikeId);
    const rType = rideTypes.find((t) => t.id === ride.rideTypeId);

    const bg = i % 2 === 0 ? 255 : 248;
    doc.setFillColor(bg, bg, bg);
    doc.rect(margin, listY, usableWidth, 5.2, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 41, 59);
    doc.text(ride.date, margin + 3, listY + 3.6);

    doc.setFont('helvetica', 'bold');
    doc.text(bike?.name || 'Vélo', margin + 30, listY + 3.6);

    doc.setFont('helvetica', 'normal');
    doc.text(rType?.name || 'Autre', margin + 80, listY + 3.6);

    doc.setTextColor(15, 118, 110); // emerald-700
    doc.text(ride.commentForType || '—', margin + 125, listY + 3.6);

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(`${ride.distanceKm} km`, margin + 215, listY + 3.6);

    doc.setFont('helvetica', 'normal');
    doc.text(ride.elevationGainM ? `+${ride.elevationGainM} m` : '—', margin + 245, listY + 3.6);

    const dur = ride.durationMinutes
      ? `${Math.floor(ride.durationMinutes / 60)}h${String(ride.durationMinutes % 60).padStart(2, '0')}`
      : '—';
    doc.text(dur, margin + usableWidth - 3, listY + 3.6, { align: 'right' });

    listY += 5.2;
  });

  // Page 2 Footer
  drawPageFooter(2, '2');

  // Save the PDF file
  const filename = `stats_velo_calendrier_${year}_paysage.pdf`;
  doc.save(filename);
}
