'use client';

import { useState } from 'react';
import { Download, FileText, Table } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

interface ExportButtonProps {
  onExportPDF: () => void;
  onExportCSV: () => void;
  label?: string;
}

export default function ExportButton({ onExportPDF, onExportCSV, label }: ExportButtonProps) {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        aria-label="Export data"
        aria-expanded={showMenu}
        aria-haspopup="menu"
      >
        <Download className="w-4 h-4" />
        <span className="text-sm font-medium">{label || t.common.export || 'Export'}</span>
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-20">
            <button
              onClick={() => {
                onExportPDF();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              role="menuitem"
              aria-label="Export as PDF formatted report"
            >
              <FileText className="w-5 h-5 text-red-600" aria-hidden="true" />
              <div>
                <div className="text-sm font-medium text-gray-900">Export as PDF</div>
                <div className="text-xs text-gray-500">Formatted report</div>
              </div>
            </button>

            <div className="border-t border-gray-100" />

            <button
              onClick={() => {
                onExportCSV();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              role="menuitem"
              aria-label="Export as CSV spreadsheet data"
            >
              <Table className="w-5 h-5 text-green-600" aria-hidden="true" />
              <div>
                <div className="text-sm font-medium text-gray-900">Export as CSV</div>
                <div className="text-xs text-gray-500">Spreadsheet data</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
