import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileDown, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { exportDashboardToPDF, type PDFExportData } from '../../services/exportService';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';

interface ChartRef {
  /** Display title in the PDF section header */
  title: string;
  /** React ref pointing to a chart wrapper DOM node */
  ref: React.RefObject<HTMLDivElement | null>;
}

interface TableData {
  headers: string[];
  rows: any[][];
}

interface ExportPDFButtonProps {
  /** Title shown at the top of the generated PDF */
  reportTitle: string;
  /** Role-specific KPIs to include in the summary section */
  kpis: Record<string, string | number>;
  /** List of chart sections to capture as images */
  chartRefs?: ChartRef[];
  /** Tables to embed in the PDF */
  tables?: Record<string, TableData>;
  /** Optional additional CSS class for the button */
  className?: string;
}

/**
 * ExportPDFButton — visible ONLY to fleet_manager and financial_analyst.
 *
 * In mock mode: generates a client-side PDF using jsPDF.
 * In live mode:  posts to POST /reports/export-pdf which validates role server-side.
 */
export default function ExportPDFButton({
  reportTitle,
  kpis,
  chartRefs = [],
  tables = {},
  className = '',
}: ExportPDFButtonProps) {
  const { user, token } = useAuthStore();
  const [isExporting, setIsExporting] = useState(false);

  // Only render for authorised roles — dual enforcement layer
  if (user?.role !== 'fleet_manager' && user?.role !== 'financial_analyst') {
    return null;
  }

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Capture each chart as a hi-res PNG base64 string
      const chartImages: string[] = [];
      for (const { ref } of chartRefs) {
        if (ref.current) {
          const canvas = await html2canvas(ref.current, {
            scale: 2,           // 2× for retina-quality
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
          });
          chartImages.push(canvas.toDataURL('image/png'));
        }
      }

      const payload: PDFExportData = {
        title: reportTitle,
        kpis,
        charts: chartImages,
        tables,
      };

      await exportDashboardToPDF(payload, token);
      toast.success('PDF exported', 'Your report has been downloaded.');
    } catch (err: any) {
      console.error('[ExportPDF] Error:', err);
      const message =
        err?.message?.includes('403') ? 'You are not authorized to export reports.' :
        err?.message ?? 'Failed to generate PDF. Please try again.';
      toast.error('Export failed', message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.button
      onClick={handleExport}
      disabled={isExporting}
      whileHover={{ scale: isExporting ? 1 : 1.02 }}
      whileTap={{ scale: isExporting ? 1 : 0.97 }}
      className={[
        'flex items-center gap-2 px-4 py-2 rounded-xl',
        'bg-accent text-black font-black text-xs',
        'shadow-lg shadow-accent/25',
        'hover:bg-accent/90 transition-all duration-200',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        className,
      ].join(' ')}
      title="Export PDF report"
      aria-label="Export PDF report"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Generating…
        </>
      ) : (
        <>
          <FileDown className="w-3.5 h-3.5" />
          Export PDF
        </>
      )}
    </motion.button>
  );
}
