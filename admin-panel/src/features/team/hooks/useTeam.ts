import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { teamApi } from "@/features/team/api/team.api";
import type {
  ChangeEmployeeStatusInput,
  CreateEmployeeInput,
  EmployeeListParams,
  UpdateEmployeeInput,
  UploadEmployeeDocumentInput,
} from "@/features/team/types";

const keys = {
  employees: (params: EmployeeListParams) => ["team", "employees", params] as const,
  employee: (id: string) => ["team", "employee", id] as const,
  documents: (employeeId: string) => ["team", "documents", employeeId] as const,
  auditLogs: (employeeId: string, page: number, limit: number) =>
    ["team", "auditLogs", employeeId, page, limit] as const,
};

export const useEmployeesList = (params: EmployeeListParams) =>
  useQuery({
    queryKey: keys.employees(params),
    queryFn: () => teamApi.listEmployees(params),
  });

export const useEmployee = (id: string) =>
  useQuery({
    queryKey: keys.employee(id),
    queryFn: () => teamApi.getEmployee(id),
    enabled: Boolean(id),
  });

export const useEmployeesDetails = (ids: string[]) =>
  useQueries({
    queries: ids.map((id) => ({
      queryKey: keys.employee(id),
      queryFn: () => teamApi.getEmployee(id),
      enabled: Boolean(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

export const useEmployeeDocuments = (employeeId: string) =>
  useQuery({
    queryKey: keys.documents(employeeId),
    queryFn: () => teamApi.listEmployeeDocuments(employeeId),
    enabled: Boolean(employeeId),
  });

export const useEmployeeAuditLogs = (employeeId: string, page: number, limit: number) =>
  useQuery({
    queryKey: keys.auditLogs(employeeId, page, limit),
    queryFn: () => teamApi.listEmployeeAuditLogs(employeeId, page, limit),
    enabled: Boolean(employeeId),
  });

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmployeeInput) => teamApi.createEmployee(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["team", "employees"] });
    },
  });
};

export const useUpdateEmployee = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateEmployeeInput) => teamApi.updateEmployee(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["team", "employees"] });
      void queryClient.invalidateQueries({ queryKey: keys.employee(id) });
    },
  });
};

export const useChangeEmployeeStatus = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ChangeEmployeeStatusInput) => teamApi.changeEmployeeStatus(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["team", "employees"] });
      void queryClient.invalidateQueries({ queryKey: keys.employee(id) });
      void queryClient.invalidateQueries({ queryKey: keys.auditLogs(id, 1, 20) });
    },
  });
};

export const useUploadEmployeeDocument = (employeeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UploadEmployeeDocumentInput) =>
      teamApi.uploadEmployeeDocument(employeeId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.documents(employeeId) });
      void queryClient.invalidateQueries({ queryKey: keys.auditLogs(employeeId, 1, 20) });
    },
  });
};

export const useDeleteEmployeeDocument = (employeeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) => teamApi.deleteEmployeeDocument(docId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.documents(employeeId) });
      void queryClient.invalidateQueries({ queryKey: keys.auditLogs(employeeId, 1, 20) });
    },
  });
};
