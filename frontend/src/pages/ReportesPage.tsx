import { useState, useMemo, useCallback } from 'react';
import { useQuery, useApolloClient } from '@apollo/client/react';
import {
  GET_ALL_CARPETAS_PAGINATED,
  GET_ALL_PRESTAMOS_PAGINATED,
  GET_ALL_DEVOLUCIONES_PAGINATED,
  GET_ALL_INCIDENTES_PAGINATED,
  GET_ALL_TRASPASOS_PAGINATED,
  GET_ALL_PRORROGAS_PAGINATED,
  GET_ALL_PERSONAS_PAGINATED,
  GET_ALL_CARPETAS,
  GET_ALL_PRESTAMOS,
  GET_ALL_DEVOLUCIONES,
  GET_ALL_INCIDENTES,
  GET_ALL_TRASPASOS,
  GET_ALL_PERSONAS,
} from '../lib/queries';
import { BarChart3, FileSpreadsheet, FileText, Search, Calendar, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportType = 'carpetas' | 'prestamos' | 'devoluciones' | 'incidentes' | 'traspasos' | 'prorrogas' | 'personas' | '';

const PAGE_SIZE = 50;

const REPORT_OPTIONS: { value: ReportType; label: string }[] = [
  { value: '', label: 'Seleccione un reporte...' },
  { value: 'carpetas', label: 'Carpetas' },
  { value: 'prestamos', label: 'Préstamos' },
  { value: 'devoluciones', label: 'Devoluciones' },
  { value: 'incidentes', label: 'Incidentes' },
  { value: 'traspasos', label: 'Traspasos' },
  { value: 'prorrogas', label: 'Prórrogas' },
  { value: 'personas', label: 'Personas' },
];

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function parseDateFilter(val: string): Date | null {
  if (!val) return null;
  const d = new Date(val + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

export default function ReportesPage() {
  const client = useApolloClient();
  const [reportType, setReportType] = useState<ReportType>('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const pagVars = { page: currentPage, pageSize: PAGE_SIZE };

  const { data: carpetasData, loading: loadingCarpetas } = useQuery(GET_ALL_CARPETAS_PAGINATED, {
    skip: reportType !== 'carpetas',
    variables: { ...pagVars, ambienteId: undefined, search: undefined },
  });
  const { data: prestamosData, loading: loadingPrestamos } = useQuery(GET_ALL_PRESTAMOS_PAGINATED, {
    skip: reportType !== 'prestamos',
    variables: pagVars,
  });
  const { data: devolucionesData, loading: loadingDevoluciones } = useQuery(GET_ALL_DEVOLUCIONES_PAGINATED, {
    skip: reportType !== 'devoluciones',
    variables: pagVars,
  });
  const { data: incidentesData, loading: loadingIncidentes } = useQuery(GET_ALL_INCIDENTES_PAGINATED, {
    skip: reportType !== 'incidentes',
    variables: pagVars,
  });
  const { data: traspasosData, loading: loadingTraspasos } = useQuery(GET_ALL_TRASPASOS_PAGINATED, {
    skip: reportType !== 'traspasos',
    variables: pagVars,
  });
  const { data: prorrogasData, loading: loadingProrrogas } = useQuery(GET_ALL_PRORROGAS_PAGINATED, {
    skip: reportType !== 'prorrogas',
    variables: pagVars,
  });
  const { data: personasData, loading: loadingPersonas } = useQuery(GET_ALL_PERSONAS_PAGINATED, {
    skip: reportType !== 'personas',
    variables: { ...pagVars, search: undefined },
  });

  const isLoading = loadingCarpetas || loadingPrestamos || loadingDevoluciones || loadingIncidentes || loadingTraspasos || loadingProrrogas || loadingPersonas;

  const paginatedResult = useMemo(() => {
    switch (reportType) {
      case 'carpetas': return carpetasData?.allCarpetasPaginated;
      case 'prestamos': return prestamosData?.allPrestamosPaginated;
      case 'devoluciones': return devolucionesData?.allDevolucionesPaginated;
      case 'incidentes': return incidentesData?.allIncidentesPaginated;
      case 'traspasos': return traspasosData?.allTraspasosPaginated;
      case 'prorrogas': return prorrogasData?.allProrrogasPaginated;
      case 'personas': return personasData?.allPersonasPaginated;
      default: return null;
    }
  }, [reportType, carpetasData, prestamosData, devolucionesData, incidentesData, traspasosData, prorrogasData, personasData]);

  const items = paginatedResult?.items ?? [];
  const totalCount = paginatedResult?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const filteredItems = useMemo(() => {
    let result = items;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((item: any) => JSON.stringify(item).toLowerCase().includes(q));
    }
    if (dateFrom || dateTo) {
      const from = parseDateFilter(dateFrom);
      const to = parseDateFilter(dateTo);
      result = result.filter((item: any) => {
        let dateField = '';
        switch (reportType) {
          case 'carpetas': dateField = item.fechaCrea; break;
          case 'prestamos': dateField = item.fechaPrest; break;
          case 'devoluciones': dateField = item.fechaDevol; break;
          case 'incidentes': dateField = item.fechaReporte; break;
          case 'traspasos': dateField = item.fecha; break;
          case 'prorrogas': dateField = item.fechaRegistro; break;
        }
        if (!dateField) return true;
        const d = new Date(dateField);
        if (from && d < from) return false;
        if (to) {
          const toEnd = new Date(to);
          toEnd.setHours(23, 59, 59, 999);
          if (d > toEnd) return false;
        }
        return true;
      });
    }
    return result;
  }, [items, search, dateFrom, dateTo, reportType]);

  const columns = useMemo(() => {
    switch (reportType) {
      case 'carpetas':
        return ['Descripción', 'Fecha Creación', 'Estado', 'Ambiente', 'Estante', 'Piso'];
      case 'prestamos':
        return ['Persona CI', 'Persona Nombre', 'Fecha Préstamo', 'Fecha Límite', 'Usuario', 'Carpetas', 'Estado'];
      case 'devoluciones':
        return ['Fecha Devolución', 'Carpeta', 'Usuario', 'Estado', 'Observaciones'];
      case 'incidentes':
        return ['Tipo', 'Fecha Reporte', 'Estado', 'Usuario', 'Descripción', 'Carpeta'];
      case 'traspasos':
        return ['Fecha', 'Origen', 'Destino', 'Usuario', 'Carpetas'];
      case 'prorrogas':
        return ['Fecha Registro', 'Días', 'Motivo', 'Persona'];
      case 'personas':
        return ['CI', 'Nombre', 'Apellido', 'Teléfono', 'Email', 'Cargo'];
      default:
        return [];
    }
  }, [reportType]);

  const rows = useMemo(() => {
    return filteredItems.map((item: any) => {
      switch (reportType) {
        case 'carpetas': {
          const piso = item.piso;
          const estante = piso?.estante;
          const ambiente = estante?.ambiente;
          return [
            item.descripcion ?? '-',
            formatDate(item.fechaCrea),
            item.estado ?? '-',
            ambiente?.nombre ?? '-',
            estante?.codigo ?? '-',
            `Fila ${piso?.nroFila ?? '-'}`,
          ];
        }
        case 'prestamos': {
          const persona = item.persona;
          const carpetas = (item.carpetas ?? []).map((c: any) => c.descripcion).join(', ');
          const estados = (item.prestamoCarpetas ?? []).map((pc: any) => pc.estado).join(', ');
          return [
            persona?.ci ?? '-',
            `${persona?.nombre ?? ''} ${persona?.apellido ?? ''}`.trim() || '-',
            formatDate(item.fechaPrest),
            formatDate(item.fechaLimite),
            item.usuario?.username ?? '-',
            carpetas || '-',
            estados || 'Pendiente',
          ];
        }
        case 'devoluciones': {
          const pc = item.prestamoCarpeta;
          return [
            formatDate(item.fechaDevol),
            pc?.carpeta?.descripcion ?? '-',
            item.usuario?.username ?? '-',
            item.estadoDevolucion ?? '-',
            item.observaciones ?? '-',
          ];
        }
        case 'incidentes': {
          const descs = (item.detalles ?? []).map((d: any) => d.descripcion).join('; ');
          const carpets = (item.detalles ?? []).map((d: any) => d.carpeta?.descripcion).filter(Boolean).join(', ');
          return [
            item.tipoInci ?? '-',
            formatDate(item.fechaReporte),
            item.estado ?? '-',
            item.usuario?.username ?? '-',
            descs || '-',
            carpets || '-',
          ];
        }
        case 'traspasos': {
          const itemsStr = (item.items ?? []).map((i: any) => i.carpeta?.descripcion).filter(Boolean).join(', ');
          return [
            formatDate(item.fecha),
            item.ambienteOrigen?.nombre ?? '-',
            item.ambienteDestino?.nombre ?? '-',
            item.usuario?.username ?? '-',
            itemsStr || '-',
          ];
        }
        case 'prorrogas': {
          const prestamo = item.prestamo;
          const persona = prestamo?.persona;
          return [
            formatDate(item.fechaRegistro),
            item.diasOtorgados ?? '-',
            item.motivo ?? '-',
            persona ? `${persona.nombre ?? ''} ${persona.apellido ?? ''}`.trim() : '-',
          ];
        }
        case 'personas':
          return [
            item.ci ?? '-',
            item.nombre ?? '-',
            item.apellido ?? '-',
            item.telefono ?? '-',
            item.email ?? '-',
            item.cargo ?? '-',
          ];
        default:
          return [];
      }
    });
  }, [filteredItems, reportType]);

  const reportTitle = REPORT_OPTIONS.find(o => o.value === reportType)?.label ?? '';

  const fetchAllForExport = useCallback(async (): Promise<{ items: any[]; total: number } | null> => {
    setExporting(true);
    try {
      let allData: any[];
      switch (reportType) {
        case 'carpetas': {
          const r = await client.query({ query: GET_ALL_CARPETAS, fetchPolicy: 'network-only' });
          allData = r.data?.allCarpetas ?? [];
          break;
        }
        case 'prestamos': {
          const r = await client.query({ query: GET_ALL_PRESTAMOS, fetchPolicy: 'network-only' });
          allData = r.data?.allPrestamos ?? [];
          break;
        }
        case 'devoluciones': {
          const r = await client.query({ query: GET_ALL_DEVOLUCIONES, fetchPolicy: 'network-only' });
          allData = r.data?.allDevoluciones ?? [];
          break;
        }
        case 'incidentes': {
          const r = await client.query({ query: GET_ALL_INCIDENTES, fetchPolicy: 'network-only' });
          allData = r.data?.allIncidentes ?? [];
          break;
        }
        case 'traspasos': {
          const r = await client.query({ query: GET_ALL_TRASPASOS, fetchPolicy: 'network-only' });
          allData = r.data?.allTraspasos ?? [];
          break;
        }
        case 'prorrogas': {
          const r = await client.query({ query: GET_ALL_PRORROGAS_PAGINATED, variables: { page: 1, pageSize: 9999 }, fetchPolicy: 'network-only' });
          allData = r.data?.allProrrogasPaginated?.items ?? [];
          break;
        }
        case 'personas': {
          const r = await client.query({ query: GET_ALL_PERSONAS, fetchPolicy: 'network-only' });
          allData = r.data?.allPersonas ?? [];
          break;
        }
        default:
          return null;
      }
      return { items: allData, total: allData.length };
    } catch (err) {
      console.error('Error fetching export data:', err);
      return null;
    }
  }, [reportType, client]);

  const buildExportRows = useCallback((allItems: any[]) => {
    return allItems.map((item: any) => {
      switch (reportType) {
        case 'carpetas': {
          const piso = item.piso;
          const estante = piso?.estante;
          const ambiente = estante?.ambiente;
          return [item.descripcion ?? '-', formatDate(item.fechaCrea), item.estado ?? '-', ambiente?.nombre ?? '-', estante?.codigo ?? '-', `Fila ${piso?.nroFila ?? '-'}`];
        }
        case 'prestamos': {
          const persona = item.persona;
          const carpetas = (item.carpetas ?? []).map((c: any) => c.descripcion).join(', ');
          const estados = (item.prestamoCarpetas ?? []).map((pc: any) => pc.estado).join(', ');
          return [persona?.ci ?? '-', `${persona?.nombre ?? ''} ${persona?.apellido ?? ''}`.trim() || '-', formatDate(item.fechaPrest), formatDate(item.fechaLimite), item.usuario?.username ?? '-', carpetas || '-', estados || 'Pendiente'];
        }
        case 'devoluciones': {
          const pc = item.prestamoCarpeta;
          return [formatDate(item.fechaDevol), pc?.carpeta?.descripcion ?? '-', item.usuario?.username ?? '-', item.estadoDevolucion ?? '-', item.observaciones ?? '-'];
        }
        case 'incidentes': {
          const descs = (item.detalles ?? []).map((d: any) => d.descripcion).join('; ');
          const carpets = (item.detalles ?? []).map((d: any) => d.carpeta?.descripcion).filter(Boolean).join(', ');
          return [item.tipoInci ?? '-', formatDate(item.fechaReporte), item.estado ?? '-', item.usuario?.username ?? '-', descs || '-', carpets || '-'];
        }
        case 'traspasos': {
          const itemsStr = (item.items ?? []).map((i: any) => i.carpeta?.descripcion).filter(Boolean).join(', ');
          return [formatDate(item.fecha), item.ambienteOrigen?.nombre ?? '-', item.ambienteDestino?.nombre ?? '-', item.usuario?.username ?? '-', itemsStr || '-'];
        }
        case 'prorrogas': {
          const prestamo = item.prestamo;
          const persona = prestamo?.persona;
          return [formatDate(item.fechaRegistro), item.diasOtorgados ?? '-', item.motivo ?? '-', persona ? `${persona.nombre ?? ''} ${persona.apellido ?? ''}`.trim() : '-'];
        }
        case 'personas':
          return [item.ci ?? '-', item.nombre ?? '-', item.apellido ?? '-', item.telefono ?? '-', item.email ?? '-', item.cargo ?? '-'];
        default:
          return [];
      }
    });
  }, [reportType]);

  const exportExcel = async () => {
    const result = await fetchAllForExport();
    if (!result || !result.items.length) return;
    const dataRows = buildExportRows(result.items);
    const data = dataRows.map((row) => {
      const obj: Record<string, string> = {};
      columns.forEach((col, i) => { obj[col] = row[i] ?? ''; });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, reportTitle);
    XLSX.writeFile(wb, `Reporte_${reportTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setExporting(false);
  };

  const exportPdf = async () => {
    const result = await fetchAllForExport();
    if (!result || !result.items.length) {
      setExporting(false);
      return;
    }
    const dataRows = buildExportRows(result.items);
    try {
      const doc = new jsPDF('landscape');
      let y = 22;
      doc.setFontSize(16);
      doc.text(`Reporte: ${reportTitle}`, 14, y); y += 8;
      doc.setFontSize(10);
      doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} — Total: ${result.total} registros`, 14, y);
      autoTable(doc, {
        head: [columns],
        body: dataRows,
        startY: y + 8,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [79, 70, 229] },
      });
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
    setExporting(false);
  };

  const exportCsv = async () => {
    const result = await fetchAllForExport();
    if (!result || !result.items.length) {
      setExporting(false);
      return;
    }
    const dataRows = buildExportRows(result.items);
    const csv = [columns.join(','), ...dataRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_${reportTitle}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const handleTypeChange = (val: string) => {
    setReportType(val as ReportType);
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-800 dark:text-sepia-200">Reportes</h1>
          <p className="text-surface-500 dark:text-sepia-400 text-sm mt-1">
            Genere y exporte reportes del sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-dark-600/20 flex items-center justify-center text-brand-600 dark:text-brand-dark-400">
            <BarChart3 size={24} />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-600 dark:text-sepia-400 mb-1">
              Tipo de Reporte
            </label>
            <select
              value={reportType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/50 dark:bg-sepia-800/50 border border-white/40 dark:border-sepia-700/40 focus:outline-none focus:ring-2 focus:ring-brand-400/50 text-surface-800 dark:text-sepia-200"
            >
              {REPORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {reportType && reportType !== 'personas' && (
            <>
              <div>
                <label className="block text-sm font-medium text-surface-600 dark:text-sepia-400 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  Desde
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/50 dark:bg-sepia-800/50 border border-white/40 dark:border-sepia-700/40 focus:outline-none focus:ring-2 focus:ring-brand-400/50 text-surface-800 dark:text-sepia-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 dark:text-sepia-400 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  Hasta
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/50 dark:bg-sepia-800/50 border border-white/40 dark:border-sepia-700/40 focus:outline-none focus:ring-2 focus:ring-brand-400/50 text-surface-800 dark:text-sepia-200"
                />
              </div>
            </>
          )}

          {reportType && (
            <div>
              <label className="block text-sm font-medium text-surface-600 dark:text-sepia-400 mb-1">
                <Search size={14} className="inline mr-1" />
                Buscar
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar en página actual..."
                className="w-full px-3 py-2.5 rounded-xl bg-white/50 dark:bg-sepia-800/50 border border-white/40 dark:border-sepia-700/40 focus:outline-none focus:ring-2 focus:ring-brand-400/50 text-surface-800 dark:text-sepia-200"
              />
            </div>
          )}
        </div>
      </div>

      {!reportType && (
        <div className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center text-surface-400 dark:text-sepia-500">
          <BarChart3 size={64} className="mb-4 opacity-40" />
          <p className="text-lg font-medium">Seleccione un tipo de reporte</p>
          <p className="text-sm">Elija una opción arriba para visualizar y exportar datos</p>
        </div>
      )}

      {reportType && (
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-800 dark:text-sepia-200">
              {reportTitle}
              <span className="ml-2 text-sm font-normal text-surface-500 dark:text-sepia-400">
                {isLoading
                  ? ' (cargando...)'
                  : ` (pág. ${currentPage} de ${totalPages} — ${totalCount} registros)`}
              </span>
            </h2>
            <div className="flex gap-2">
              <button
                onClick={exportExcel}
                disabled={!totalCount || exporting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                <FileSpreadsheet size={16} />
                {exporting ? 'Procesando...' : 'Excel'}
              </button>
              <button
                onClick={exportPdf}
                disabled={!totalCount || exporting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                <FileText size={16} />
                {exporting ? 'Procesando...' : 'PDF'}
              </button>
              <button
                onClick={exportCsv}
                disabled={!totalCount || exporting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-500 hover:bg-surface-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                <Download size={16} />
                {exporting ? 'Procesando...' : 'CSV'}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-surface-400 dark:text-sepia-500">
              No se encontraron registros para este reporte.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/30 dark:border-sepia-700/30">
                      {columns.map((col) => (
                        <th
                          key={col}
                          className="text-left px-3 py-3 font-semibold text-surface-600 dark:text-sepia-400 whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-white/20 dark:border-sepia-700/20 hover:bg-white/30 dark:hover:bg-sepia-800/30 transition-colors"
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="px-3 py-2.5 text-surface-700 dark:text-sepia-300 whitespace-nowrap max-w-xs truncate"
                            title={cell}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/30 dark:border-sepia-700/30">
                <span className="text-sm text-surface-500 dark:text-sepia-500">
                  Mostrando página {currentPage} de {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/50 dark:bg-sepia-800/50 border border-white/40 dark:border-sepia-700/40 disabled:opacity-30 disabled:cursor-not-allowed text-surface-600 dark:text-sepia-400 hover:bg-white dark:hover:bg-sepia-800 transition-colors text-sm"
                  >
                    <ChevronLeft size={16} />
                    Anterior
                  </button>

                  {totalPages <= 7
                    ? Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                        <button
                          key={pg}
                          onClick={() => setCurrentPage(pg)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            pg === currentPage
                              ? 'bg-brand-600 text-white'
                              : 'bg-white/50 dark:bg-sepia-800/50 text-surface-600 dark:text-sepia-400 hover:bg-white dark:hover:bg-sepia-800'
                          }`}
                        >
                          {pg}
                        </button>
                      ))
                    : (() => {
                        const pages: (number | '...')[] = [];
                        pages.push(1);
                        if (currentPage > 3) pages.push('...');
                        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                          pages.push(i);
                        }
                        if (currentPage < totalPages - 2) pages.push('...');
                        pages.push(totalPages);
                        return pages.map((pg, i) =>
                          pg === '...' ? (
                            <span key={`e${i}`} className="text-surface-400 dark:text-sepia-500 px-1">...</span>
                          ) : (
                            <button
                              key={pg}
                              onClick={() => setCurrentPage(pg)}
                              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                pg === currentPage
                                  ? 'bg-brand-600 text-white'
                                  : 'bg-white/50 dark:bg-sepia-800/50 text-surface-600 dark:text-sepia-400 hover:bg-white dark:hover:bg-sepia-800'
                              }`}
                            >
                              {pg}
                            </button>
                          )
                        );
                      })()}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/50 dark:bg-sepia-800/50 border border-white/40 dark:border-sepia-700/40 disabled:opacity-30 disabled:cursor-not-allowed text-surface-600 dark:text-sepia-400 hover:bg-white dark:hover:bg-sepia-800 transition-colors text-sm"
                  >
                    Siguiente
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
