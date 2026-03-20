"use client";

import type { DataProvider } from "@refinedev/core";
import { apiClient } from "@providers/axios";

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters }) => {
    const params: Record<string, any> = {};

    const paginationAny = pagination as
      | { current?: number; pageSize?: number }
      | undefined;
    if (paginationAny?.current) params.page = paginationAny.current;
    if (paginationAny?.pageSize) params.limit = paginationAny.pageSize;

    if (filters) {
      for (const filter of filters) {
        if (
          "field" in filter &&
          filter.value !== undefined &&
          filter.value !== null &&
          filter.value !== ""
        ) {
          params[filter.field] = filter.value;
        }
      }
    }

    const { data: response } = await apiClient.get(`/admin/${resource}`, {
      params,
    });

    return {
      data: response.data,
      total: response.total,
    };
  },

  getOne: async ({ resource, id }) => {
    const { data } = await apiClient.get(`/admin/${resource}/${id}`);
    return { data };
  },

  create: async ({ resource, variables }) => {
    const { data } = await apiClient.post(`/admin/${resource}`, variables);
    return { data };
  },

  update: async ({ resource, id, variables }) => {
    const { data } = await apiClient.patch(
      `/admin/${resource}/${id}`,
      variables,
    );
    return { data };
  },

  deleteOne: async ({ resource, id }) => {
    const { data } = await apiClient.delete(`/admin/${resource}/${id}`);
    return { data };
  },

  custom: async ({ url, method, payload, query }) => {
    let response;

    if (method === "get") {
      response = await apiClient.get(url, { params: query });
    } else if (method === "post") {
      response = await apiClient.post(url, payload);
    } else if (method === "put") {
      response = await apiClient.put(url, payload);
    } else if (method === "patch") {
      response = await apiClient.patch(url, payload);
    } else if (method === "delete") {
      response = await apiClient.delete(url, { data: payload });
    } else {
      response = await apiClient.get(url);
    }

    return { data: response.data };
  },

  getApiUrl: () =>
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/v1",
};
