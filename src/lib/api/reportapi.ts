import {api} from '@/utils/axios';
import {useQuery} from '@tanstack/react-query';


export const useGetClientReport = (id: string) => {
  return useQuery({
    queryKey: ['client report', id],
    queryFn: () => getclientreport(id),
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
};

export const getclientreport = async (id: string) => {
  try {
    const response = await api.get(`admin/client/pay/${id}`);
    return response.data;
  } catch (error: any) {

    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch client report',
    );
  }
};

export const useGetStockReport = (id: string) => {
  return useQuery({
    queryKey: ['stock report', id],
    queryFn: () => getstockreport(id),
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
};

const getstockreport = async (id: string) => {
  try {
    const response = await api.get(`admin/stock/history/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch stock report',
    );
  }
};

export const useGetManufacturingData = () => {
  return useQuery({
    queryKey: ['manufacturing report'],
    queryFn: getManufacturingData,
  });
};

const getManufacturingData = async () => {
  try {
    const response = await api.get(`admin/manufacture`);
    const resData = response.data;



    return resData;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch manufacturing data',
    );
  }
};
