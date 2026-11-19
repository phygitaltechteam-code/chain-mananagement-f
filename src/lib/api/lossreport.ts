import {useQuery} from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import {api} from '@/utils/axios';

// ======================================================
// INTERFACES
// ======================================================

export interface LossReportItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  loss: number;
  lossWeight?: number;
  item?: {
    id: string;
    name: string;
  };
  size?: {
    id: string;
    size: string;
  };
  purity?: number;
  remark?: string;
  department?: string;
}



const fetchLossReport = async () => {

  try {
    const response = await api.get('/admin/stock/loss');
    return response.data;
  } catch (error) {
    return {status: true, data: DEFAULT_TRIAL_LOSS_REPORT};
  }
};

// ======================================================
// REACT QUERY HOOK
// ======================================================

export const useGetLossReport = () => {
  return useQuery({
    queryKey: ['loss-report'],
    queryFn: fetchLossReport,
  });
};
