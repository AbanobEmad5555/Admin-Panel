import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { loyaltyApi } from "@/features/loyalty/api/loyalty.api";
import { loyaltyQueryKeys } from "@/features/loyalty/hooks/queryKeys";
import type {
  LoyaltyHistoryQueryParams,
  LoyaltySummaryFilters,
  LoyaltyUsersQueryParams,
} from "@/features/loyalty/types";

export const useLoyaltySettings = () =>
  useQuery({
    queryKey: loyaltyQueryKeys.settings(),
    queryFn: loyaltyApi.getSettings,
  });

export const useLoyaltySummary = (filters: LoyaltySummaryFilters) =>
  useQuery({
    queryKey: loyaltyQueryKeys.summary(filters),
    queryFn: () => loyaltyApi.getSummary(filters),
    enabled: Boolean(filters.dateFrom && filters.dateTo),
    placeholderData: keepPreviousData,
  });

export const useLoyaltyUsers = (params: LoyaltyUsersQueryParams) =>
  useQuery({
    queryKey: loyaltyQueryKeys.users(params),
    queryFn: () => loyaltyApi.getUsers(params),
    placeholderData: keepPreviousData,
  });

export const useLoyaltyOverview = (filters: LoyaltySummaryFilters) =>
  useQuery({
    queryKey: loyaltyQueryKeys.overview(filters),
    queryFn: () => loyaltyApi.getOverview(filters),
    enabled: Boolean(filters.dateFrom && filters.dateTo),
    placeholderData: keepPreviousData,
  });

export const useLoyaltyUserSummary = (userId: number) =>
  useQuery({
    queryKey: loyaltyQueryKeys.userSummary(userId),
    queryFn: () => loyaltyApi.getUserSummary(userId),
    enabled: Number.isFinite(userId) && userId > 0,
  });

export const useLoyaltyUserHistory = (userId: number, params: LoyaltyHistoryQueryParams) =>
  useQuery({
    queryKey: loyaltyQueryKeys.userHistory(userId, params),
    queryFn: () => loyaltyApi.getUserHistory(userId, params),
    enabled: Number.isFinite(userId) && userId > 0,
    placeholderData: keepPreviousData,
  });
