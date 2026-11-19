import React, {useMemo} from 'react';
import {GenericTable} from '@/components/Forms/Table/GenericTable';
import {
  getHistorySolderingColumns,
  hasMeltingStatus,
  formatNumberDisplay,
  toNumber,
} from './solderingUtils';
import {AlertRule} from '@/lib/api/alertmanagement';
import {evaluateLossDetails} from '@/utils/lossReportHelper';

interface HistorySolderingProps {
  filteredData: any[];
  historyLoading: boolean;
  fromDate: Date | null;
  toDate: Date | null;
  alertRules?: AlertRule[];
}

const HistorySoldering: React.FC<HistorySolderingProps> = ({
  filteredData,
  historyLoading,
  fromDate,
  toDate,
  alertRules,
}) => {
  const historyColumns = useMemo(
    () => getHistorySolderingColumns(alertRules),
    [alertRules],
  );

  const {
    totalChainWeight,
    totalChainReceived,
    totalPowder,
    totalScrap,
    totalExpected,
    totalActual,
    totalDiff,
  } = useMemo(() => {
    let chainWt = 0;
    let chainRec = 0;
    let powder = 0;
    let scrap = 0;
    let exp = 0;
    let act = 0;
    let diff = 0;

    filteredData.forEach((item: any) => {
      if (!hasMeltingStatus(item)) {
        chainWt += toNumber(item?.chainWeight);
        chainRec += toNumber(item?.chainReceived);
        powder += toNumber(item?.powder);
        scrap += toNumber(item?.scrap);

        const details = evaluateLossDetails(
          item,
          item?.purity,
          item?.loss,
          alertRules,
          'soldering',
        );
        exp += details.expectedLoss;
        act += details.actualLoss;
        diff += details.diffLoss;
      }
    });

    return {
      totalChainWeight: Math.round(chainWt * 1000) / 1000,
      totalChainReceived: Math.round(chainRec * 1000) / 1000,
      totalPowder: Math.round(powder * 1000) / 1000,
      totalScrap: Math.round(scrap * 1000) / 1000,
      totalExpected: Math.round(exp * 1000) / 1000,
      totalActual: Math.round(act * 1000) / 1000,
      totalDiff: Math.round(diff * 1000) / 1000,
    };
  }, [filteredData, alertRules]);

  return (
    <div>
      {/* History Summary Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Chain Given
            </span>
            <span className="text-lg font-bold text-black dark:text-amber-400">
              {formatNumberDisplay(totalChainWeight)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Chain Rec
            </span>
            <span className="text-lg font-bold text-black dark:text-blue-400">
              {formatNumberDisplay(totalChainReceived)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Powder
            </span>
            <span className="text-lg font-bold text-black dark:text-purple-400">
              {formatNumberDisplay(totalPowder)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Scrap
            </span>
            <span className="text-lg font-bold text-black dark:text-green-400">
              {formatNumberDisplay(totalScrap)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Expected Loss
            </span>
            <span className="text-lg font-bold text-black dark:text-amber-400">
              {formatNumberDisplay(totalExpected)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Actual Loss
            </span>
            <span className="text-lg font-bold text-black dark:text-red-400">
              {formatNumberDisplay(totalActual)} G
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-[#d3c4af]/20 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
              Total Diff Loss
            </span>
            <span
              className={`text-lg font-bold ${
                totalDiff > 0
                  ? 'text-red-600 dark:text-red-400'
                  : totalDiff < 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-black dark:text-slate-300'
              }`}
            >
              {totalDiff > 0
                ? `+${formatNumberDisplay(totalDiff)}`
                : formatNumberDisplay(totalDiff)}{' '}
              G
            </span>
          </div>
        </div>
      </div>

      <GenericTable
        data={filteredData}
        columns={historyColumns}
        emptyMessage={
          fromDate && toDate
            ? `No history records found for the selected date range (${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()})`
            : 'No history records found. Complete a soldering process to see history.'
        }
        isLoading={historyLoading}
        showSrNo={true}
        srNoLabel="Sr No."
        className="shadow-sm"
        rowClassName={(item) =>
          hasMeltingStatus(item)
            ? 'opacity-60 bg-gray-50/70 text-gray-500 hover:bg-gray-100/70 dark:bg-slate-900/40 dark:text-slate-400'
            : ''
        }
      />
    </div>
  );
};

export default HistorySoldering;
