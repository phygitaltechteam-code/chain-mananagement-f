import toast from 'react-hot-toast';
import {Column} from '@/components/Forms/Table/GenericTable';
import {PackageCheck} from 'lucide-react';
import React from 'react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import {getCurrentAppWeekRange} from '@/utils/weekRangeUtils';
import {
  checkProcessLossAlert,
  getProcessLossColorClass,
  AlertRule,
} from '@/lib/api/alertmanagement';

export interface MeltingRow {
  id: string;
  srNo: number;
  dateTime: string;
  createdAt?: string;
  updatedAt?: string;
  particular: string;
  grossWt: number;
  purity: number;
  expectedFine: number;
  fineWeight: number;
  loss: number;
  scrapCount: number;
  isEditing?: boolean;
  isSaved?: boolean;
  grossWtRaw?: string;
  fineWeightRaw?: string;
  purityRaw?: string;
  isDirty?: boolean;
}

export interface ScrapCardData {
  purity: number;
  totalWeight: number;
  count: number;
}

export const getCurrentWeekRange = () => {
  const {fromDate, toDate} = getCurrentAppWeekRange();
  return {monday: fromDate, sunday: toDate};
};

import {calculateExpectedFine} from '@/utils/calculations';
export {calculateExpectedFine};

export const toNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const formatNumberDisplay = (value: unknown): string => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
    useGrouping: true,
  }).format(toNumber(value));
};

export const formatDate = (dateString: string) => {
  if (!dateString || dateString === '-') return {date: '-', time: '-'};
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    const parts = String(dateString).split(', ');
    return {date: parts[0] || dateString, time: parts[1] || ''};
  }
  return {
    date: date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  };
};

export interface AlertRule {
  grossWt: number | string;
  purity: number | string;
  loss?: number | string;
  lossWt?: number | string;
  adjustment?: number | string;
  adjsutment?: number | string;
}

export interface LossAlertResult {
  isExceeded: boolean;
  actualLoss: number;
  baseLoss: number;
  maxAllowedLoss: number;
  adjustmentPercent: number;
  colorState: 'gray' | 'green' | 'yellow' | 'red';
}

export const checkMeltingLossAlert = (
  grossWt: number,
  purity: number,
  fineWeight: number,
  expectedFine: number,
  alertRules?: AlertRule[],
): ProcessLossAlertResult | null => {
  const actualLoss = Math.max(
    0,
    Math.round((expectedFine - (fineWeight || 0)) * 1000) / 1000,
  );
  return checkProcessLossAlert(
    grossWt,
    purity,
    actualLoss,
    alertRules,
    fineWeight > 0,
  );
};

export const getMeltingColumns = (
  getScaleProps: (index: number, field: any) => any,
  handleInlineChange: (index: number, field: any, value: string) => void,
  handleStockClick: (index: number) => void,
  alertRules?: AlertRule[],
): Column<MeltingRow>[] => {
  return [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (item) => {
        const {date, time} = formatDate(item.createdAt || item.dateTime);
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {date}
            </span>
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {time}
            </span>
          </div>
        );
      },
    },
    {
      key: 'particular',
      header: 'Particular',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item.particular}
        </span>
      ),
    },
    {
      key: 'grossWt',
      header: 'Gross Wt (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.grossWt)} G
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity % (टंच)',
      render: (item) => (
        <div className="bg-gray-50/50 flex w-24 items-center justify-center gap-1 whitespace-nowrap px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800/50">
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.purity)}%
          </span>
        </div>
      ),
    },
    {
      key: 'expectedFine',
      header: 'Expected (लगड)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.expectedFine)} G
        </span>
      ),
    },
    {
      key: 'fineWeight',
      header: 'Fine Wt (G)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="inline-block w-28">
              <GenericInputField
                type="text"
                inputMode="decimal"
                decimalScale={3}
                value={
                  item.fineWeightRaw !== undefined
                    ? item.fineWeightRaw
                    : item.fineWeight === 0
                      ? ''
                      : item.fineWeight
                }
                {...getScaleProps(index, 'fineWeight')}
                onChange={(e) =>
                  handleInlineChange(index, 'fineWeight', e.target.value)
                }
                placeholder="0.000"
                suffix="G"
                compact
                className="font-mono text-right"
              />
            </div>
          );
        }
        return (
          <span className="font-mono text-sm font-semibold text-green-700 dark:text-green-400">
            {formatNumberDisplay(item.fineWeight)} G
          </span>
        );
      },
    },

    {
      key: 'loss',
      header: 'Loss (G)',
      render: (item) => {
        const hasEnteredFine = Boolean(
          (item.fineWeightRaw !== undefined &&
            item.fineWeightRaw.trim() !== '') ||
          (item.fineWeight !== undefined && item.fineWeight > 0),
        );

        const loss = hasEnteredFine
          ? Math.max(
              0,
              Math.round((item.expectedFine - (item.fineWeight || 0)) * 1000) /
                1000,
            )
          : item.isSaved && item.loss !== undefined && item.loss !== null
            ? Number(item.loss)
            : 0;
        const alertCheck = checkProcessLossAlert(
          item.grossWt,
          item.purity,
          loss,
          alertRules,
          hasEnteredFine || Boolean(item.isSaved),
        );

        const hasAlert = Boolean(alertRules && alertRules.length > 0 && alertCheck);
        if (!hasAlert) {
          return (
            <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
              {formatNumberDisplay(loss)} G
            </span>
          );
        }

        const expectedLoss =
          alertCheck?.maxAllowedLoss || alertCheck?.baseLoss || 0;

        if (!hasEnteredFine && !item.isSaved) {
          return (
            <div className="flex flex-col items-center justify-center">
              <span className="font-mono text-sm font-semibold text-[#785600] dark:text-amber-300">
                {formatNumberDisplay(expectedLoss)} G
              </span>
              <span className="text-[10px] text-gray-400 italic">
                (Expected)
              </span>
            </div>
          );
        }

        const colorClass = getProcessLossColorClass(alertCheck);
        const diff = alertCheck?.diff || 0;

        return (
          <div className="flex flex-col items-center justify-center">
            <span className={`font-mono text-sm font-semibold ${colorClass}`}>
              Act: {formatNumberDisplay(loss)} G
            </span>
            <div className="mt-0.5 flex flex-col items-center text-[10px] leading-tight text-gray-500 dark:text-slate-400">
              <span>Exp: {formatNumberDisplay(expectedLoss)} G</span>
              <span
                className={
                  diff > 0
                    ? 'font-semibold text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-slate-400'
                }
              >
                Diff: {diff > 0 ? `+${formatNumberDisplay(diff)}` : formatNumberDisplay(diff)} G
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Action',
      render: (item: MeltingRow, index: number) => {
        if (item.isSaved) {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Stocked
            </span>
          );
        }

        return (
          <div className="flex items-center justify-center gap-1.5">
            {/* Refine Button - Send to Stock */}
            <GenericButton
              type="button"
              onClick={() => handleStockClick(index)}
              variant="primary"
              className="flex items-center gap-1 px-3 py-1.5 text-xs"
              title="Send Fine Gold to Stock"
            >
              <PackageCheck className="h-3.5 w-3.5" />
              <span>Refine</span>
            </GenericButton>
          </div>
        );
      },
    },
  ];
};

export const printMeltingHistory = (
  data: any[],
  fromDate: Date | null,
  toDate: Date | null,
  getpdfheaderdata: any,
) => {
  if (!data || data.length === 0) {
    toast.error('No history data to print');
    return;
  }

  const printContainer = document.createElement('div');
  printContainer.id = 'print-container';

  const rows = data
    .map((item: any, idx: number) => {
      const {date: createDate, time: createTime} = formatDate(item.createdAt);

      // Better handling for updatedAt - show "Pending" if not available
      let updateDisplay = 'Pending';
      let updateStyle = 'color:#999;font-style:italic;';
      if (item.updatedAt) {
        const formatted = formatDate(item.updatedAt);
        if (formatted.date && formatted.time) {
          updateDisplay = `${formatted.date} ${formatted.time}`;
          updateStyle = 'color:#000;font-style:normal;';
        }
      }

      const gross = Number(
        item.grossWeight ?? item.grossWt ?? item.weight ?? 0,
      );
      const purity = Number(item.purity ?? 0);
      const expected = Number(
        item.expected ??
          item.expectedFine ??
          calculateExpectedFine(gross, purity),
      );
      const fine = Number(item.fineWeight ?? item.fineWt ?? 0);
      const loss =
        fine > 0
          ? Math.max(0, Math.round((expected - fine) * 1000) / 1000)
          : item.loss !== undefined && item.loss !== null
            ? Number(item.loss)
            : 0;

      const lossDetails = evaluateLossDetails(
        gross,
        purity,
        loss,
        'melting',
        (item as any).expectedLoss,
      );
      const expectedLoss = lossDetails.expectedLoss;
      const diffLoss = lossDetails.diffLoss;

      return `
        <tr>
          <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;color:#000;">${idx + 1}</td>
          <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;white-space:nowrap;color:#000;">${createDate} ${createTime}</td>
          <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;color:#000;">${item.particular || 'Scrap Melting'}</td>
          <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-family:monospace;color:#000;">${formatNumberDisplay(gross)}</td>
          <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;font-family:monospace;color:#000;">${formatNumberDisplay(purity)}%</td>
          <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;font-family:monospace;color:#000;">${formatNumberDisplay(expected)}</td>
          <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;font-family:monospace;font-weight:bold;color:#000;">${formatNumberDisplay(fine)}</td>
          <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;font-family:monospace;color:#000;">${formatNumberDisplay(expectedLoss)}</td>
          <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;font-family:monospace;font-weight:bold;color:#b91c1c;">${formatNumberDisplay(loss)}</td>
          <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;font-family:monospace;color:#c2410c;">${formatNumberDisplay(diffLoss)}</td>
          <td style="border:1px solid #000;padding:2px 3px;text-align:center;font-size:10px;white-space:nowrap;${updateStyle}">${updateDisplay}</td>
        </tr>
      `;
    })
    .join('');

  const headerInfo =
    getpdfheaderdata?.data?.data ||
    (getpdfheaderdata?.data?.factoryName ? getpdfheaderdata.data : {});
  const leftInvocation =
    headerInfo.leftInvocation ||
    headerInfo.leftInovation ||
    '॥ श्री गणेश प्रसन्न ॥';
  const rightInvocation =
    headerInfo.rightInvocation ||
    headerInfo.rightInovation ||
    '॥ श्री साई प्रसन्न ॥';
  const factoryName = headerInfo.factoryName || 'मातोश्री चेन फॅक्टरी, मिरज';
  const description =
    headerInfo.description ||
    'आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.';
  const proprietorName = headerInfo.proprietorName || 'प्रो. नितीन खरात';
  const phoneNumbers = headerInfo.phoneNumbers || 'मो. ९३७०२४७०३५ / ७३८७२३५१८४';
  const invocationColor = headerInfo.invocationColor || '#a84b20';
  const factoryNameColor = headerInfo.factoryNameColor || '#c43d5c';
  const descriptionColor = headerInfo.descriptionColor || '#8b451f';
  const proprietorColor = headerInfo.proprietorColor || '#a84b20';
  const phoneColor = headerInfo.phoneColor || '#a84b20';
  const factoryFontSize = headerInfo.factoryFontSize
    ? `${headerInfo.factoryFontSize}px`
    : '20px';
  const descriptionFontSize = headerInfo.descriptionFontSize
    ? `${headerInfo.descriptionFontSize}px`
    : '9px';
  const proprietorFontSize = headerInfo.proprietorFontSize
    ? `${headerInfo.proprietorFontSize}px`
    : '9px';
  const phoneFontSize = headerInfo.phoneFontSize
    ? `${headerInfo.phoneFontSize}px`
    : '9px';

  printContainer.style.cssText =
    'position:fixed;left:-9999px;top:0;width:100%;background:white;padding:4px;z-index:9999;';
  document.body.appendChild(printContainer);

  printContainer.innerHTML = `
    <div style="width:210mm;min-height:297mm;margin:0 auto;font-family:Arial,sans-serif;padding:6mm 5mm;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;">
      <!-- Header Section -->
      <div>
        <!-- PDF Header -->
        <div style="width:100%;text-align:center;margin:0;padding:1px 0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 2px 0;padding:0;">
            <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${leftInvocation}</span>
            <span style="font-size:${factoryFontSize};font-weight:bold;color:${factoryNameColor};">${factoryName}</span>
            <span style="font-size:11px;font-weight:bold;color:${invocationColor};">${rightInvocation}</span>
          </div>
          <div style="margin:1px 0 0 0;padding:0;font-size:${descriptionFontSize};font-weight:bold;color:${descriptionColor};line-height:1.2;">
            ${description}
          </div>
          <div style="margin:1px 0 0 0;padding:0;font-size:${proprietorFontSize};font-weight:bold;color:${proprietorColor};line-height:1.2;">
            ${proprietorName}&nbsp;&nbsp; <span style="color:${phoneColor};font-size:${phoneFontSize};">${phoneNumbers}</span>
          </div>
          <div style="border-bottom:2px solid ${factoryNameColor};margin:2px 0 4px 0;"></div>
        </div>

      <!-- Title and Date Range in one line -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 4px 0;padding:0;">
        <div style="flex:1;"></div>
        <h2 style="margin:0;font-size:16px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;">
          Melting History Report
        </h2>
        ${
          fromDate && toDate
            ? `
          <div style="font-size:10px;color:#000;font-weight:bold;flex:1;text-align:right;">
            From: ${fromDate.toLocaleDateString('en-IN')} &nbsp; To: ${toDate.toLocaleDateString('en-IN')}
          </div>
        `
            : `
          <div style="flex:1;"></div>
        `
        }
      </div>

      <!-- Table -->
      <table style="width:100%;border-collapse:collapse;font-size:11px;margin:0;padding:0;">
        <thead>
          <tr style="background:#785600;color:white;font-weight:600;">
            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;color:white;">Sr</th>
            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;color:white;">Date & Time</th>
            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;color:white;">Particular</th>
            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;color:white;">Gross Wt (G)</th>
            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;color:white;">Purity %</th>
            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;color:white;">Expected Fine (G)</th>
            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;color:white;">Fine Wt (G)</th>
            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;color:white;">Loss (G)</th>
            <th style="border:1px solid #785600;padding:2px 3px;text-align:center;font-size:10px;color:white;">Processed Date & Time</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      </div>
    </div>
  `;

  // Add print styles
  const style = document.createElement('style');
  style.textContent = `
    @page {
      margin: 3mm;
    }
    @media print {
      body * {
        visibility: hidden;
      }
      #print-container, #print-container * {
        visibility: visible;
      }
      #print-container {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: white !important;
        padding: 4px !important;
        overflow: hidden !important;
        z-index: 9999 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #print-container table {
        width: 100% !important;
      }
      #print-container tr {
        page-break-inside: avoid !important;
      }
      #print-container thead tr {
        background: #785600 !important;
        color: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #print-container thead tr th {
        background: #785600 !important;
        color: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #print-container tbody td {
        color: #000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #print-container tfoot tr {
        background: #f0f0f0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      /* Remove scrollbar */
      ::-webkit-scrollbar {
        display: none !important;
      }
      * {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
    }
  `;
  document.head.appendChild(style);

  setTimeout(() => {
    window.print();
    setTimeout(() => {
      if (document.body.contains(printContainer)) {
        document.body.removeChild(printContainer);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    }, 1000);
  }, 500);
};
