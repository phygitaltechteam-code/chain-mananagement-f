import {api} from '@/utils/axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const useGetBox = () => {
  return useQuery({
    queryKey: ['box'],
    queryFn: getBoxApi,
  });
};

export const useGetBoxweight = () => {
  return useQuery({
    queryKey: ['boxweight'],
    queryFn: getBoxweightApi,
  });
};

const getBoxweightApi = async () => {
  try {
    const response = await api.get('/admin/box/stock');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch boxweight entries');
    }
    throw error;
  }
};

export const useGetTarweight = () => {
  return useQuery({
    queryKey: ['tarweight'],
    queryFn: getTarweightApi,
  });
};

const getTarweightApi = async () => {
  try {
    const response = await api.get('/admin/tar/stock');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch tarweight entries');
    }
    throw error;
  }
};

export const useGetBoxHistory = () => {
  return useQuery({
    queryKey: ['boxHistory'],
    queryFn: getBoxHistory,
  });
};



export const getBoxHistory = async () => {

  try {
    const response = await api.get('/admin/box/history');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch box history');
    }
    throw error;
  }
};

export const getBoxApi = async () => {

  try {
    const response = await api.get('/admin/box');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch box entries');
    }
    throw error;
  }
};

export const useSubmitBox = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitBoxApi,
    onSuccess: () => {
      toast.success('Box submitted successfully');
      queryClient.invalidateQueries({queryKey: ['box']});
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit box');
    },
  });
};

export const createBoxApi = async (data: any) => {
  try {
    const payload = {
      ...data,
      ...(data?.purity !== undefined && {purity: Number(data.purity || 0)}),
    };
    const response = await api.post('/admin/box', payload);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to create box entry');
    }
    throw error;
  }
};

export const useCreateBox = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBoxApi,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['box']});
    },
  });
};

export const submitBoxApi = async ({id, data}: {id: string; data: any}) => {
  try {
    const payload = {
      ...data,
      ...(data?.purity !== undefined && {purity: Number(data.purity || 0)}),
    };
    const response = await api.put(`/admin/box/${id}`, payload);
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to submit box');
    }
    throw error;
  }
};

export const revertBoxApi = async (id: string) => {

  try {
    const response = await api.put(`/admin/box/revert/${id}`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      const response = await api.post(`/admin/box/revert/${id}`);
      return response.data;
    }
    throw error;
  }
};

export const revertBoxCardApi = async (id: string) => {

  try {
    const response = await api.put(`/admin/box/history/revert/${id}`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      try {
        const fallback = await api.put(`/admin/box/revert/${id}`);
        return fallback.data;
      } catch (err: any) {
        if (err?.response?.status === 404 || err?.response?.status === 405) {
          const postFallback = await api.post(`/admin/box/revert/${id}`);
          return postFallback.data;
        }
        throw err;
      }
    }
    throw error;
  }
};

export const useRevertBox = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revertBoxApi,
    onSuccess: (data: any) => {
      const msg = data?.message || 'Box entry reverted successfully';
      toast.success(msg);
      queryClient.invalidateQueries({queryKey: ['box']});
      queryClient.invalidateQueries({queryKey: ['boxHistory']});
      queryClient.invalidateQueries({queryKey: ['boxweight']});
      queryClient.invalidateQueries({queryKey: ['tar']});
      queryClient.invalidateQueries({queryKey: ['tarweight']});
      queryClient.invalidateQueries({queryKey: ['soldering']});
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to revert box entry';
      toast.error(msg);
    },
  });
};

export const useRevertBoxCard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revertBoxCardApi,
    onSuccess: (data: any) => {
      const msg = data?.message || 'Box entry reverted successfully';
      toast.success(msg);
      queryClient.invalidateQueries({queryKey: ['box']});
      queryClient.invalidateQueries({queryKey: ['boxHistory']});
      queryClient.invalidateQueries({queryKey: ['boxweight']});
      queryClient.invalidateQueries({queryKey: ['tar']});
      queryClient.invalidateQueries({queryKey: ['tarweight']});
      queryClient.invalidateQueries({queryKey: ['soldering']});
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to revert box entry';
      toast.error(msg);
    },
  });
};
