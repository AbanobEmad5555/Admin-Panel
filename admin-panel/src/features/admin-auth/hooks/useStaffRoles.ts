import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminAuthApi } from "@/features/admin-auth/api/adminAuth.api";
import type {
  AssignStaffRoleInput,
  CreateStaffRoleInput,
  UpdateStaffRoleMetadataInput,
  UpdateStaffRolePermissionsInput,
} from "@/features/admin-auth/types";

const keys = {
  staffRoles: ["admin", "staffRoles"] as const,
  staffRole: (roleId: string | number) => ["admin", "staffRoles", roleId] as const,
  staffPermissions: ["admin", "staffPermissions"] as const,
};

export const useStaffRolesList = () =>
  useQuery({
    queryKey: keys.staffRoles,
    queryFn: () => adminAuthApi.listStaffRoles(),
  });

export const useStaffRole = (roleId: string | number) =>
  useQuery({
    queryKey: keys.staffRole(roleId),
    queryFn: () => adminAuthApi.getStaffRole(roleId),
    enabled: Boolean(roleId),
  });

export const useStaffPermissionCatalog = () =>
  useQuery({
    queryKey: keys.staffPermissions,
    queryFn: () => adminAuthApi.listStaffPermissions(),
  });

export const useCreateStaffRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStaffRoleInput) => adminAuthApi.createStaffRole(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.staffRoles });
    },
  });
};

export const useUpdateStaffRoleMetadata = (roleId: string | number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateStaffRoleMetadataInput) =>
      adminAuthApi.updateStaffRoleMetadata(roleId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.staffRoles });
      void queryClient.invalidateQueries({ queryKey: keys.staffRole(roleId) });
    },
  });
};

export const useUpdateStaffRolePermissions = (roleId: string | number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateStaffRolePermissionsInput) =>
      adminAuthApi.updateStaffRolePermissions(roleId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.staffRoles });
      void queryClient.invalidateQueries({ queryKey: keys.staffRole(roleId) });
    },
  });
};

export const useDeleteStaffRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roleId: string | number) => adminAuthApi.deleteStaffRole(roleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.staffRoles });
    },
  });
};

export const useAssignStaffUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string | number; payload: AssignStaffRoleInput }) =>
      adminAuthApi.assignStaffUserRole(userId, payload),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["team", "employees"] });
      void queryClient.invalidateQueries({ queryKey: ["team", "employee", String(variables.userId)] });
      void queryClient.invalidateQueries({ queryKey: keys.staffRoles });
    },
  });
};
