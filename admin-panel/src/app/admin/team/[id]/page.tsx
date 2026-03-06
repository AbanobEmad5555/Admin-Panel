"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { AxiosError } from "axios";
import { FilePlus2, Pencil, ShieldAlert, UserRoundX } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import ConfirmDeleteModal from "@/components/purchases/ConfirmDeleteModal";
import AuditLogsList from "@/features/team/components/AuditLogsList";
import DocumentsTable from "@/features/team/components/DocumentsTable";
import EditEmployeeDrawer from "@/features/team/components/EditEmployeeDrawer";
import StatusBadge from "@/features/team/components/StatusBadge";
import StatusChangeModal from "@/features/team/components/StatusChangeModal";
import UploadDocumentModal from "@/features/team/components/UploadDocumentModal";
import { teamApi } from "@/features/team/api/team.api";
import {
  useChangeEmployeeStatus,
  useDeleteEmployeeDocument,
  useEmployee,
  useEmployeeAuditLogs,
  useEmployeeDocuments,
  useUpdateEmployee,
  useUploadEmployeeDocument,
} from "@/features/team/hooks/useTeam";
import type { EmployeeDocument, EmploymentType } from "@/features/team/types";
import { formatEGP } from "@/lib/currency";
import {
  getCachedEmploymentType,
  setCachedEmploymentType,
} from "@/features/team/utils/employmentTypeCache";

const getStatus = (error: unknown) => (error as AxiosError)?.response?.status;
const getErrorMessage = (error: unknown) =>
  ((error as AxiosError<{ message?: string }>)?.response?.data?.message ?? "Something went wrong.");

export default function TeamProfilePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const employeeId = params.id;
  const tabParam = searchParams.get("tab");
  const tab = tabParam === "documents" || tabParam === "audit" ? tabParam : "overview";
  const auditPage = Math.max(1, Number(searchParams.get("auditPage") ?? "1"));

  const employeeQuery = useEmployee(employeeId);
  const documentsQuery = useEmployeeDocuments(employeeId);
  const auditLogsQuery = useEmployeeAuditLogs(employeeId, auditPage, 20);

  const updateMutation = useUpdateEmployee(employeeId);
  const profileImageMutation = useUpdateEmployee(employeeId);
  const statusMutation = useChangeEmployeeStatus(employeeId);
  const uploadMutation = useUploadEmployeeDocument(employeeId);
  const deleteDocMutation = useDeleteEmployeeDocument(employeeId);

  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<EmployeeDocument | null>(null);
  const profileImageInputRef = useRef<HTMLInputElement | null>(null);

  const employee = employeeQuery.data ?? null;
  const forbidden = getStatus(employeeQuery.error) === 403;
  const notFound = getStatus(employeeQuery.error) === 404;
  const documentRows = documentsQuery.data ?? [];

  const changeTab = (next: "overview" | "documents" | "audit") => {
    const query = new URLSearchParams(searchParams.toString());
    query.set("tab", next);
    if (next !== "audit") {
      query.delete("auditPage");
    }
    router.replace(`/admin/team/${employeeId}?${query.toString()}`);
  };

  const canShow = !employeeQuery.isLoading && !employeeQuery.isError && employee;
  const profileImage = useMemo(
    () => employee?.profileImageUrl || "https://placehold.co/160x160/e2e8f0/334155?text=EMP",
    [employee?.profileImageUrl]
  );
  const displayedEmploymentType = useMemo<EmploymentType | null>(
    () => employee?.employmentType ?? getCachedEmploymentType(employeeId),
    [employee?.employmentType, employeeId]
  );

  useEffect(() => {
    if (!employee?.id || !employee.employmentType) {
      return;
    }
    setCachedEmploymentType(employee.id, employee.employmentType);
  }, [employee?.employmentType, employee?.id]);

  const handleProfileImageUpload = async (file: File) => {
    try {
      const uploadedUrls = await teamApi.uploadFiles([file]);
      const imageUrl = uploadedUrls[0];
      if (!imageUrl) {
        toast.error("Failed to upload profile image.");
        return;
      }

      await profileImageMutation.mutateAsync({ profileImageUrl: imageUrl });
      toast.success("Profile picture updated.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleProfileImageDelete = () => {
    profileImageMutation.mutate(
      { profileImageUrl: null },
      {
        onSuccess: () => toast.success("Profile picture removed."),
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    );
  };

  return (
    <AdminLayout>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-900">
            <Link href="/admin/team" className="hover:text-slate-900">
              Team
            </Link>{" "}
            / Employee Profile
          </div>
          <Link href="/admin/team" className="text-sm text-slate-900 hover:text-slate-900">
            Back to Team
          </Link>
        </div>

        {employeeQuery.isLoading ? (
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-10 animate-pulse rounded bg-slate-200" />
            <div className="h-8 animate-pulse rounded bg-slate-200" />
          </div>
        ) : null}

        {forbidden ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-800 shadow-sm">
            <div className="flex items-center gap-2 font-medium">
              <ShieldAlert className="h-5 w-5" />
              Forbidden
            </div>
            <p className="mt-2 text-sm">You don&apos;t have permission to view this employee.</p>
          </div>
        ) : null}

        {notFound ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            Employee not found.
          </div>
        ) : null}

        {employeeQuery.isError && !forbidden && !notFound ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 shadow-sm">
            {getErrorMessage(employeeQuery.error)}
          </div>
        ) : null}

        {canShow ? (
          <>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={profileImage}
                    alt={employee.fullName}
                    className="h-[72px] w-[72px] rounded-full object-cover ring-1 ring-slate-200"
                    onError={(event) => {
                      event.currentTarget.src =
                        "https://placehold.co/160x160/e2e8f0/334155?text=EMP";
                    }}
                  />
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">{employee.fullName}</h1>
                    <p className="text-sm text-slate-900">
                      {employee.employeeCode || `AUTO-${employee.id.slice(0, 6)}`} • {employee.role}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={employee.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <input
                        ref={profileImageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const selectedFile = event.target.files?.[0];
                          if (!selectedFile) {
                            return;
                          }
                          void handleProfileImageUpload(selectedFile);
                          event.currentTarget.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-8 px-3 text-xs"
                        disabled={profileImageMutation.isPending}
                        onClick={() => profileImageInputRef.current?.click()}
                      >
                        {employee.profileImageUrl ? "Change Photo" : "Upload Photo"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-8 border-rose-200 px-3 text-xs text-rose-700 hover:bg-rose-50"
                        disabled={!employee.profileImageUrl || profileImageMutation.isPending}
                        onClick={handleProfileImageDelete}
                      >
                        Delete Photo
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="secondary" className="gap-2" onClick={() => setEditOpen(true)}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="secondary" className="gap-2" onClick={() => setStatusOpen(true)}>
                    <UserRoundX className="h-4 w-4" />
                    Change Status
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Employee Details</h2>
              <div className="mt-3 grid gap-3 text-sm text-slate-900 md:grid-cols-2 xl:grid-cols-3">
                <p><span className="font-medium text-slate-900">Employee ID:</span> {employee.id || "Auto assigned"}</p>
                <p><span className="font-medium text-slate-900">Title:</span> {employee.title || "-"}</p>
                <p><span className="font-medium text-slate-900">Employment Type:</span> {displayedEmploymentType ? displayedEmploymentType.replace("_", " ") : "-"}</p>
                <p><span className="font-medium text-slate-900">Department:</span> {employee.department || "-"}</p>
                <p><span className="font-medium text-slate-900">Email:</span> {employee.email || "-"}</p>
                <p><span className="font-medium text-slate-900">Phone:</span> {employee.phone || "-"}</p>
                <p><span className="font-medium text-slate-900">Salary:</span> {formatEGP(employee.salary)}</p>
                <p><span className="font-medium text-slate-900">Shift:</span> {employee.shiftStart || "-"} - {employee.shiftEnd || "-"}</p>
                <p><span className="font-medium text-slate-900">Working Days:</span> {employee.workingDays.join(", ") || "-"}</p>
                <p><span className="font-medium text-slate-900">Rating:</span> {typeof employee.rating === "number" && employee.rating > 0 ? employee.rating.toFixed(1) : "-"}</p>
                <p><span className="font-medium text-slate-900">Hire Date:</span> {employee.hireDate || "-"}</p>
              </div>
              <p className="mt-3 text-sm text-slate-900">
                <span className="font-medium text-slate-900">Notes:</span> {employee.notes || "-"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => changeTab("overview")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    tab === "overview" ? "bg-slate-900 text-white" : "text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => changeTab("documents")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    tab === "documents" ? "bg-slate-900 text-white" : "text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Documents
                </button>
                <button
                  type="button"
                  onClick={() => changeTab("audit")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    tab === "audit" ? "bg-slate-900 text-white" : "text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Audit Logs
                </button>
              </div>
            </div>

            {tab === "overview" ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-900 shadow-sm">
                Select <span className="font-semibold">Documents</span> or{" "}
                <span className="font-semibold">Audit Logs</span> to view employee records.
              </div>
            ) : null}

            {tab === "documents" ? (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button className="gap-2" onClick={() => setUploadOpen(true)}>
                    <FilePlus2 className="h-4 w-4" />
                    Upload Document
                  </Button>
                </div>
                {documentsQuery.isLoading ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-950 shadow-sm">Loading documents...</div>
                ) : documentsQuery.isError ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 shadow-sm">
                    {getErrorMessage(documentsQuery.error)}
                  </div>
                ) : documentRows.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-950 shadow-sm">
                    No documents uploaded yet.
                  </div>
                ) : (
                  <DocumentsTable rows={documentRows} onDelete={(doc) => setDeleteDoc(doc)} />
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogsQuery.isLoading ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">Loading audit logs...</div>
                ) : auditLogsQuery.isError ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 shadow-sm">
                    {getErrorMessage(auditLogsQuery.error)}
                  </div>
                ) : (auditLogsQuery.data?.items?.length ?? 0) === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                    No audit logs available.
                  </div>
                ) : (
                  <>
                    <AuditLogsList rows={auditLogsQuery.data?.items ?? []} />
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={auditPage <= 1}
                        onClick={() => {
                          const query = new URLSearchParams(searchParams.toString());
                          query.set("tab", "audit");
                          query.set("auditPage", String(Math.max(1, auditPage - 1)));
                          router.replace(`/admin/team/${employeeId}?${query.toString()}`);
                        }}
                      >
                        Previous
                      </Button>
                      <p className="text-sm text-slate-900">
                        Page {auditPage} of {auditLogsQuery.data?.totalPages ?? 1}
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={auditPage >= (auditLogsQuery.data?.totalPages ?? 1)}
                        onClick={() => {
                          const query = new URLSearchParams(searchParams.toString());
                          query.set("tab", "audit");
                          query.set("auditPage", String(auditPage + 1));
                          router.replace(`/admin/team/${employeeId}?${query.toString()}`);
                        }}
                      >
                        Next
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        ) : null}
      </section>

      <EditEmployeeDrawer
        open={editOpen}
        employee={employee}
        pending={updateMutation.isPending}
        onClose={() => setEditOpen(false)}
        onSubmit={(values) => {
          updateMutation.mutate(values, {
            onSuccess: () => {
              setCachedEmploymentType(employeeId, values.employmentType);
              toast.success("Employee updated.");
              setEditOpen(false);
            },
            onError: (error) => toast.error(getErrorMessage(error)),
          });
        }}
      />

      <StatusChangeModal
        open={statusOpen}
        currentStatus={employee?.status}
        pending={statusMutation.isPending}
        onClose={() => setStatusOpen(false)}
        onSubmit={(values) => {
          statusMutation.mutate(values, {
            onSuccess: () => {
              toast.success("Employee status updated.");
              setStatusOpen(false);
            },
            onError: (error) => toast.error(getErrorMessage(error)),
          });
        }}
      />

      <UploadDocumentModal
        open={uploadOpen}
        pending={uploadMutation.isPending}
        onClose={() => setUploadOpen(false)}
        onSubmit={async (payload) => {
          try {
            if (payload.sourceMode === "file") {
              const uploadedUrls = await teamApi.uploadFiles(payload.files);
              if (uploadedUrls.length === 0) {
                toast.error("Failed to upload selected files.");
                return;
              }

              const normalizedUrls = payload.files.map((_, index) => uploadedUrls[index] ?? uploadedUrls[0]);
              for (let index = 0; index < payload.values.length; index += 1) {
                const value = payload.values[index];
                await uploadMutation.mutateAsync({
                  type: value.type,
                  title: value.title,
                  expiresAt: value.expiresAt,
                  fileUrl: normalizedUrls[index],
                });
              }
              toast.success(
                payload.values.length > 1
                  ? `${payload.values.length} documents uploaded.`
                  : "Document uploaded."
              );
              setUploadOpen(false);
              return;
            }

            for (const value of payload.values) {
              await uploadMutation.mutateAsync({
                type: value.type,
                title: value.title,
                expiresAt: value.expiresAt,
                fileUrl: value.fileUrl || "",
              });
            }
            toast.success(
              payload.values.length > 1
                ? `${payload.values.length} documents uploaded.`
                : "Document uploaded."
            );
            setUploadOpen(false);
          } catch (error) {
            toast.error(getErrorMessage(error));
          }
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deleteDoc)}
        title="Delete Document"
        description={`Delete "${deleteDoc?.title ?? "document"}"?`}
        onClose={() => setDeleteDoc(null)}
        onConfirm={() => {
          if (!deleteDoc) return;
          deleteDocMutation.mutate(deleteDoc.id, {
            onSuccess: () => {
              toast.success("Document deleted.");
              setDeleteDoc(null);
            },
            onError: (error) => toast.error(getErrorMessage(error)),
          });
        }}
      />
    </AdminLayout>
  );
}
