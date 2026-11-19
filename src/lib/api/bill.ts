import { api } from '@/utils/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const useGetQuantity = () => {
  return useMutation({
    mutationFn: getQuantityApi,
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to fetch quantity');
    },
  });
};

export const useBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveBillApi,
    onSuccess: (data: any) => {
      toast.success('Bill added successfully');
      const newBill = data?.data || data;
      if (newBill && (newBill.id || newBill.billNumber)) {
        queryClient.setQueryData(['bill'], (old: any) => {
          if (Array.isArray(old)) {
            if (old.some((b: any) => b.id === newBill.id)) return old;
            return [newBill, ...old];
          }
          return [newBill];
        });
      }
      queryClient.invalidateQueries({ queryKey: ['bill'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['stock-report'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Insufficient stock');
    },
  });
};

const saveBillApi = async (data: any) => {
  const response = await api.post('/admin/billing', data);
  return response.data;
};

const getQuantityApi = async (payload: {
  itemId: string;
  sizeId: string;
  purity: number;
  customerId: string;
}) => {
  const response = await api.put('/admin/billing/check', payload);
  return response.data;
};



export const useGetBill = () => {
  return useQuery({
    queryKey: ['bill'],
    queryFn: getbillAll,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
  });
};

export const getbillAll = async () => {

  try {
    const response = await api.get('/admin/billing');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch bills');
    }
    throw error;
  }
};

export const useGetBillByid = (id: string) => {
  return useQuery({
    queryKey: ['bill', id],
    queryFn: async () => {
      const response = await api.get(`/admin/billing/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
  });
};

const deleteBillApi = async (id: string) => {
  const response = await api.delete(`/admin/billing/${id}`);
  return response.data;
};

export const useDeleteBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBillApi,
    onSuccess: (_data: any, id: string) => {
      queryClient.setQueryData(['bill'], (old: any) => {
        if (Array.isArray(old)) {
          return old.filter((b: any) => b.id !== id);
        }
        return old;
      });
      queryClient.invalidateQueries({ queryKey: ['bill'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['stock-report'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Insufficient stock');
    },
  });
};

export const useBillUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBillApi,
    onSuccess: (data: any, variables: any) => {
      toast.success('Bill updated successfully');
      const updatedBill = data?.data || data;
      const targetId = variables?.id;
      if (targetId) {
        queryClient.setQueryData(['bill'], (old: any) => {
          if (Array.isArray(old)) {
            return old.map((b: any) =>
              b.id === targetId
                ? {
                    ...b,
                    ...(updatedBill && typeof updatedBill === 'object' ? updatedBill : {}),
                    ...variables?.data,
                  }
                : b,
            );
          }
          return old;
        });
      }
      queryClient.invalidateQueries({ queryKey: ['bill'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['stock-report'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Insufficient stock');
    },
  });
};

export const updateBillApi = async ({ id, data }: { id: string; data: any }) => {
  const response = await api.put(`/admin/billing/${id}`, data);
  return response.data;
};
