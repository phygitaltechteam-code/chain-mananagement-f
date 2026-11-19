import {confirmAction} from '@/utils/confirmAction';
import {Square, Flame, RotateCcw} from 'lucide-react';
import {Column} from '@/components/Forms/Table/GenericTable';
import toast from 'react-hot-toast';
import {getCurrentAppWeekRange} from '@/utils/weekRangeUtils';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import {
  AlertRule,
  checkProcessLossAlert,
  getProcessLossColorClass,
} from '@/lib/api/alertmanagement';
import {evaluateLossDetails} from '@/utils/lossReportHelper';

// ======================================================
// Interfaces
// ======================================================
export interface KundaEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  purity: number;
  chainGiven: number;
  kundaGiven: number;
  chainReceived: number;
  scrap: number;
  loss: number;
  isEditing?: boolean;
  isSaved?: boolean;
  kundaGivenRaw?: string;
  chainReceivedRaw?: string;
  scrapRaw?: string;
  purityRaw?: string;
  itemId?: string;
  sizeId?: string;
  isCompleted?: boolean;
  isDirty?: boolean;
  status?: string;
  process?: string;
  isMelting?: boolean;
  meltingStatus?: boolean;
}

// ======================================================
// Helper Functions
// ======================================================
export const getItemName = (item: any): string => {
  if (!item) return '-';
  if (typeof item === 'string') return item;
  if (item.name) return item.name;
  return '-';
};

export const getSizeName = (size: any): string => {
  if (!size) return '-';
  if (typeof size === 'string') return size;
  if (size.size) return size.size;
  return '-';
};

export const hasMeltingStatus = (item: any): boolean => {
  const s = String(item?.status || item?.process || '').toUpperCase();
  return (
    s === 'MELTING' || item?.isMelting === true || item?.meltingStatus === true
  );
};

export const getDefaultWeekRange = () => {
  const {fromDate, toDate} = getCurrentAppWeekRange();
  return {monday: fromDate, sunday: toDate};
};

export const formatDate = (dateString: string) => {
  if (!dateString) return {date: '-', time: '-'};
  const date = new Date(dateString);
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

// ======================================================
// Print Function
// ======================================================
export const printSKundaHistory = (
  filteredData: any[],
  dateRange: Date[],
  getpdfheaderdata: any,
  alertRules?: AlertRule[],
) => {
  if (!filteredData || filteredData.length === 0) {
    toast.error(
      'No history records available to print for the selected date range',
    );
    return false;
  }

  const printContainer = document.createElement('div');
  printContainer.id = 'print-container-history';
  printContainer.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 210mm;
    background: white;
    padding: 0;
    z-index: 9999;
  `;
  document.body.appendChild(printContainer);

  const rows = filteredData
    .map((item: any, index: number) => {
      const {date, time} = formatDate(item?.createdAt);
      const {date: proceedDate, time: proceedTime} = formatDate(
        item?.updatedAt,
      );
      const isMelting = hasMeltingStatus(item);
      const inputVal =
        toNumber(item?.chainGiven || item?.chainWeight || 0) +
        toNumber(item?.kundaGiven || item?.kunda || 0);
      const details = evaluateLossDetails(
        inputVal,
        item?.purity,
        item?.loss,
        alertRules,
        'skunda',
      );

      return `
      <tr style="${isMelting ? 'opacity:0.6;background-color:#fafafa;' : ''}">
        <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-size:8px;color:#000;">${index + 1}</td>
        <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-size:7.5px;color:#000;white-space:nowrap;">
          ${date} ${time}
        </td>
        <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-size:8px;color:#000;">${getItemName(item?.item)}</td>
        <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-size:8px;color:#000;">${getSizeName(item?.size)}</td>
        ${
          isMelting
            ? `<td colspan="8" style="border:1px solid #000;padding:2px 4px;text-align:center;font-weight:bold;font-size:9px;color:#785600;background-color:#fffbeb;">Melting</td>`
            : `
          <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-family:monospace;font-size:8px;color:#000;">${formatNumberDisplay(item?.chainWeight || item?.chainGiven)}</td>
          <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-family:monospace;font-size:8px;color:#000;">${formatNumberDisplay(item?.kundaGiven || item?.kunda || 0)}</td>
          <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-family:monospace;font-size:8px;color:#000;">${formatNumberDisplay(item?.chainReceived)}</td>
          <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-family:monospace;font-size:8px;color:#000;">${formatNumberDisplay(item?.scrap)}</td>
          <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-family:monospace;font-size:8px;color:#000;">${formatNumberDisplay(details.expectedLoss)}</td>
          <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-family:monospace;font-size:8px;color:#000;">${formatNumberDisplay(details.actualLoss)}</td>
          <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-family:monospace;font-size:8px;color:${details.diffLoss > 0 ? '#dc2626' : details.diffLoss < 0 ? '#16a34a' : '#000'};">${details.diffLoss > 0 ? '+' : ''}${formatNumberDisplay(details.diffLoss)}</td>
          <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-family:monospace;font-size:8px;color:#000;">${formatNumberDisplay(item?.purity)}%</td>
        `
        }
        <td style="border:1px solid #000;padding:2px 4px;text-align:center;font-size:7.5px;color:#000;white-space:nowrap;">
          ${proceedDate} ${proceedTime}
        </td>
      </tr>
    `;
    })
    .join('');

  const formatDateForDisplay = (date: Date | null | undefined) => {
    if (!date) return '';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

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

  printContainer.innerHTML = `
    <div style="width:210mm;min-height:297mm;margin:0 auto;font-family:Arial,sans-serif;padding:6mm 5mm;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;">
      <div>
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

        <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0 4px 0;padding:0;">
          <div style="flex:1;"></div>
          <h2 style="margin:0;font-size:14px;color:#000;padding:0;font-weight:bold;text-align:center;flex:1;">
            S Kunda History Report
          </h2>
          <div style="font-size:9px;color:#000;font-weight:bold;flex:1;text-align:right;">
            From: ${formatDateForDisplay(dateRange[0]) || 'Start'} 
            &nbsp;&nbsp; To: ${formatDateForDisplay(dateRange[1]) || 'End'}
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:10px;margin:0;padding:0;">
         <thead>
          <tr style="background:#785600;color:white;font-weight:600;">
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Sr</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Date & Time</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Item</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Size</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Chain Given</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">S/Kunda Given</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Chain Received</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Scrap</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Expected Loss</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Actual Loss</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Diff Loss</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Purity</th>
            <th style="border:1px solid #785600;padding:3px 4px;text-align:center;font-size:7.5px;">Proceed Date</th>
          </tr>
        </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    @page { size: A4 portrait; margin: 0; }
    @media print {
      html, body { margin: 0; padding: 0; width: 210mm; height: 297mm; }
      body * { visibility: hidden; }
      #print-container-history, #print-container-history * { visibility: visible; }
      #print-container-history {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        width: 210mm !important;
        height: 297mm !important;
        background: white !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: hidden !important;
        z-index: 9999 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #print-container-history > div {
        width: 210mm !important;
        min-height: 297mm !important;
        padding: 6mm 5mm !important;
        box-sizing: border-box !important;
      }
      #print-container-history table { width: 100% !important; }
      #print-container-history tr { page-break-inside: avoid !important; }
      #print-container-history thead tr, #print-container-history thead tr th {
        background: #785600 !important;
        color: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
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

  return true;
};

// ======================================================
// Columns Definition
// ======================================================

export const getHistorySKundaColumns = (
  alertRules?: AlertRule[],
): Column<any>[] => [
  {
    key: 'createdAt',
    header: 'Date & Time',
    render: (item) => {
      const {date, time} = formatDate(item.createdAt);
      return (
        <div className="flex flex-col items-center">
          <span className="text-sm text-[#1a1c1b] dark:text-white">{date}</span>
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {time}
          </span>
        </div>
      );
    },
  },
  {
    key: 'item',
    header: 'Item',
    render: (item) => (
      <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
        {getItemName(item?.item)}
      </span>
    ),
  },
  {
    key: 'size',
    header: 'Size',
    render: (item) => (
      <span className="text-sm text-[#1a1c1b] dark:text-white">
        {getSizeName(item?.size)}
      </span>
    ),
  },
  {
    key: 'purity',
    header: 'Purity (%)',
    colSpan: (item) => (hasMeltingStatus(item) ? 8 : 1),
    render: (item) => {
      if (hasMeltingStatus(item)) {
        return (
          <div className="flex items-center justify-center py-0.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              <Flame className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              Melting
            </span>
          </div>
        );
      }
      return (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.purity)}%
        </span>
      );
    },
  },
  {
    key: 'chainGiven',
    header: 'Chain Given (G)',
    colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
    render: (item) => {
      if (hasMeltingStatus(item)) return null;
      return (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.chainWeight || item.chainGiven)} G
        </span>
      );
    },
  },
  {
    key: 'kundaGiven',
    header: 'S/Kunda Given (G)',
    colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
    render: (item) => {
      if (hasMeltingStatus(item)) return null;
      return (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(
            item.kundaGiven || item.kundaGiven || item.kunda || 0,
          )}{' '}
          G
        </span>
      );
    },
  },
  {
    key: 'chainReceived',
    header: 'Chain Received (G)',
    colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
    render: (item) => {
      if (hasMeltingStatus(item)) return null;
      return (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.chainReceived)} G
        </span>
      );
    },
  },
  {
    key: 'scrap',
    header: 'Scrap (G)',
    colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
    render: (item) => {
      if (hasMeltingStatus(item)) return null;
      return (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.scrap)} G
        </span>
      );
    },
  },
  {
    key: 'expectedLoss',
    header: 'Expected Loss (G)',
    colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
    render: (item) => {
      if (hasMeltingStatus(item)) return null;
      const inputVal =
        toNumber(item?.chainGiven || item?.chainWeight || 0) +
        toNumber(item?.kundaGiven || item?.kunda || 0);
      const details = evaluateLossDetails(
        inputVal,
        item?.purity,
        item?.loss,
        alertRules,
        'skunda',
      );
      return (
        <span className="font-mono text-sm font-semibold text-amber-700 dark:text-amber-300">
          {formatNumberDisplay(details.expectedLoss)} G
        </span>
      );
    },
  },
  {
    key: 'actualLoss',
    header: 'Actual Loss (G)',
    colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
    render: (item) => {
      if (hasMeltingStatus(item)) return null;
      const inputVal =
        toNumber(item?.chainGiven || item?.chainWeight || 0) +
        toNumber(item?.kundaGiven || item?.kunda || 0);
      const details = evaluateLossDetails(
        inputVal,
        item?.purity,
        item?.loss,
        alertRules,
        'skunda',
      );
      return (
        <span
          className={`font-mono text-sm font-semibold ${details.lossColorClass}`}
        >
          {formatNumberDisplay(details.actualLoss)} G
        </span>
      );
    },
  },
  {
    key: 'diffLoss',
    header: 'Diff Loss (G)',
    colSpan: (item) => (hasMeltingStatus(item) ? 0 : 1),
    render: (item) => {
      if (hasMeltingStatus(item)) return null;
      const inputVal =
        toNumber(item?.chainGiven || item?.chainWeight || 0) +
        toNumber(item?.kundaGiven || item?.kunda || 0);
      const details = evaluateLossDetails(
        inputVal,
        item?.purity,
        item?.loss,
        alertRules,
        'skunda',
      );
      const isPositive = details.diffLoss > 0;
      const isNegative = details.diffLoss < 0;

      return (
        <span
          className={`font-mono text-sm font-bold ${
            isPositive
              ? 'text-red-600 dark:text-red-400'
              : isNegative
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {isPositive
            ? `+${formatNumberDisplay(details.diffLoss)}`
            : formatNumberDisplay(details.diffLoss)}{' '}
          G
        </span>
      );
    },
  },
  {
    key: 'timeTaken',
    header: 'Gold Aging',
    render: (item) => (
      <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
        {item?.timeTaken || '-'}
      </span>
    ),
  },
  {
    key: 'updatedAt',
    header: 'Proceed Date & Time',
    render: (item) => {
      const {date, time} = formatDate(item.updatedAt);
      return (
        <div className="flex flex-col items-center">
          <span className="text-sm text-[#1a1c1b] dark:text-white">{date}</span>
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {time}
          </span>
        </div>
      );
    },
  },
];

export const getSKundaColumns = (
  getScaleProps: (index: number, field: any) => any,
  handleInlineChange: (index: number, field: any, value: string) => void,
  handleStockClick: (index: number) => void,
  isLoading: boolean,
  isSubmitting: boolean,
  hasEditableValues: (entry: KundaEntry) => boolean,
  showActionColumn: boolean,
  alertRules?: AlertRule[],
  handleRevert?: (item: KundaEntry) => void,
  revertLoadingIds?: Record<string, boolean>,
): Column<KundaEntry>[] => {
  const baseColumns: Column<KundaEntry>[] = [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (item) => {
        const parts = item.dateTime ? item.dateTime.split(' ') : ['', ''];
        const datePart = parts[0] || '';
        const timePart = parts.slice(1).join(' ') || '';

        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {datePart}
            </span>
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {timePart}
            </span>
          </div>
        );
      },
    },
    {
      key: 'item',
      header: 'Item',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {getItemName(item?.item)}
        </span>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {getSizeName(item?.size)}
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity % (टंच)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="inline-block w-20">
              <GenericInputField
                type="text"
                inputMode="decimal"
                decimalScale={2}
                value={
                  item.purityRaw !== undefined
                    ? item.purityRaw
                    : item.purity === 0 || item.purity === ''
                      ? ''
                      : item.purity
                }
                onChange={(e) =>
                  handleInlineChange(index, 'purity', e.target.value)
                }
                placeholder="0.00"
                suffix="%"
                compact
                className="font-mono text-center"
              />
            </div>
          );
        }
        return (
          <div className="bg-gray-50/50 flex w-20 items-center justify-center gap-1 whitespace-nowrap px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800/50">
            <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
              {formatNumberDisplay(item.purity)}%
            </span>
          </div>
        );
      },
    },
    {
      key: 'chainGiven',
      header: 'Chain Given (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.chainGiven)} G
        </span>
      ),
    },
    {
      key: 'kundaGiven',
      header: 'S/Kunda Given (G)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="inline-block w-24">
              <GenericInputField
                type="text"
                inputMode="decimal"
                decimalScale={3}
                value={
                  item.kundaGivenRaw !== undefined
                    ? item.kundaGivenRaw
                    : item.kundaGiven === 0
                      ? ''
                      : item.kundaGiven
                }
                {...getScaleProps(index, 'kundaGiven')}
                onChange={(e) =>
                  handleInlineChange(index, 'kundaGiven', e.target.value)
                }
                placeholder="0.000"
                suffix="G"
                compact
                className="font-mono text-center"
              />
            </div>
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.kundaGiven)} G
          </span>
        );
      },
    },
    {
      key: 'chainReceived',
      header: 'Chain Received (G)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="inline-block w-24">
              <GenericInputField
                type="text"
                inputMode="decimal"
                decimalScale={3}
                value={
                  item.chainReceivedRaw !== undefined
                    ? item.chainReceivedRaw
                    : item.chainReceived === 0
                      ? ''
                      : item.chainReceived
                }
                {...getScaleProps(index, 'chainReceived')}
                onChange={(e) =>
                  handleInlineChange(index, 'chainReceived', e.target.value)
                }
                placeholder="0.000"
                suffix="G"
                compact
                className="font-mono text-center"
              />
            </div>
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.chainReceived)} G
          </span>
        );
      },
    },
    {
      key: 'scrap',
      header: 'Scrap (G)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="inline-block w-24">
              <GenericInputField
                type="text"
                inputMode="decimal"
                decimalScale={3}
                value={
                  item.scrapRaw !== undefined
                    ? item.scrapRaw
                    : item.scrap === 0
                      ? ''
                      : item.scrap
                }
                {...getScaleProps(index, 'scrap')}
                onChange={(e) =>
                  handleInlineChange(index, 'scrap', e.target.value)
                }
                placeholder="0.000"
                suffix="G"
                compact
                className="font-mono text-center"
              />
            </div>
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.scrap)} G
          </span>
        );
      },
    },
    {
      key: 'loss',
      header: 'Loss (G)',
      render: (item) => {
        const hasValues = Boolean(
          (item.kundaGivenRaw !== undefined && item.kundaGivenRaw !== '') ||
          (item.chainReceivedRaw !== undefined &&
            item.chainReceivedRaw !== '') ||
          (item.scrapRaw !== undefined && item.scrapRaw !== '') ||
          item.kundaGiven > 0 ||
          item.chainReceived > 0 ||
          item.scrap > 0 ||
          item.isSaved,
        );
        const grossVal = item.chainGiven + (item.kundaGiven || 0);
        const alertCheck = checkProcessLossAlert(
          grossVal,
          item.purity,
          item.loss,
          alertRules,
          hasValues,
        );

        const hasAlert = Boolean(alertRules && alertRules.length > 0 && alertCheck);
        if (!hasAlert) {
          return (
            <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
              {formatNumberDisplay(item.loss)} G
            </span>
          );
        }

        const colorClass = getProcessLossColorClass(alertCheck);
        const expectedLoss = alertCheck?.maxAllowedLoss || alertCheck?.baseLoss || 0;
        const diff = alertCheck?.diff || 0;

        return (
          <div className="flex flex-col items-center justify-center">
            <span className={`font-mono text-sm font-semibold ${colorClass}`}>
              Act: {formatNumberDisplay(item.loss)} G
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
  ];

  if (showActionColumn || handleRevert) {
    baseColumns.push({
      key: 'actions',
      header: 'Action',
      render: (item: KundaEntry, index: number) => {
        const canStock =
          showActionColumn &&
          !item.isSaved &&
          item.isEditing &&
          hasEditableValues(item);
        const canRevert = Boolean(handleRevert && item.id);
        const isReverting = Boolean(item.id && revertLoadingIds?.[item.id]);

        if (!canStock && !canRevert) {
          return null;
        }

        return (
          <div className="flex items-center justify-center gap-2">
            {canStock && (
              <button
                type="button"
                onClick={() => handleStockClick(index)}
                disabled={isLoading || isSubmitting || isReverting}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#785600] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-[#5d4200] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                title="Stock Process"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>Stock</span>
              </button>
            )}
            {canRevert && (
              <button
                type="button"
                onClick={async () => {
                  const confirmed = await confirmAction(
                    'Confirm Revert',
                    'Are you sure you want to revert this item?',
                  );
                  if (confirmed) {
                    handleRevert!(item);
                  }
                }}
                disabled={isLoading || isSubmitting || isReverting}
                className={`inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
                  isReverting
                    ? 'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300 cursor-wait'
                    : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/60'
                }`}
                title="Revert S Kunda"
              >
                {isReverting ? (
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <RotateCcw className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                )}
              </button>
            )}
          </div>
        );
      },
    } as Column<KundaEntry>);
  }

  return baseColumns;
};
