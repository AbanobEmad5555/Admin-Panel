"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import {
  uploadDocumentSchema,
  type UploadDocumentValues,
} from "@/features/team/schemas/employee.schema";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

export type UploadDocumentSubmitPayload =
  | { sourceMode: "link"; values: UploadDocumentValues[] }
  | { sourceMode: "file"; values: UploadDocumentValues[]; files: File[] };

type UploadDocumentModalProps = {
  open: boolean;
  pending?: boolean;
  onClose: () => void;
  onSubmit: (payload: UploadDocumentSubmitPayload) => void | Promise<void>;
};

const uploadDocumentInitialValues: UploadDocumentValues = {
  type: "CONTRACT",
  title: "",
  fileUrl: "",
  otherTypeLabel: "",
  expiresAt: "",
};

export default function UploadDocumentModal({
  open,
  pending = false,
  onClose,
  onSubmit,
}: UploadDocumentModalProps) {
  const { language } = useLocalization();
  const form = useForm<UploadDocumentValues>({
    resolver: zodResolver(uploadDocumentSchema),
    defaultValues: uploadDocumentInitialValues,
  });
  const [sourceMode, setSourceMode] = useState<"link" | "file">("link");
  const [fileInputError, setFileInputError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (open) {
      setSelectedFiles([]);
      setFileInputError("");
      setSourceMode("link");
      form.reset(uploadDocumentInitialValues);
    }
  }, [form, open]);

  return (
    <Modal title={language === "ar" ? "رفع مستند" : "Upload Document"} isOpen={open} onClose={onClose}>
      <form
        className="space-y-4 text-slate-950"
        onSubmit={form.handleSubmit(async (values) => {
          setFileInputError("");
          let nextValues = values;
          if (sourceMode === "file") {
            if (selectedFiles.length === 0) {
              setFileInputError(language === "ar" ? "يرجى اختيار ملف واحد على الأقل." : "Please choose at least one file.");
              return;
            }
            const withFiles = selectedFiles.map((file) => {
              const customType = values.type === "OTHER" ? values.otherTypeLabel?.trim() : "";
              const baseTitle = values.title.trim();
              const title = customType
                ? `${customType} - ${baseTitle || file.name}`
                : baseTitle || file.name;
              return { ...values, title, fileUrl: "" };
            });
            await onSubmit({
              sourceMode: "file",
              values: withFiles,
              files: selectedFiles,
            });
            return;
          } else if (!values.fileUrl) {
            form.setError("fileUrl", {
              type: "manual",
              message: language === "ar" ? "رابط الملف مطلوب." : "File URL is required.",
            });
            return;
          }
          const customType = values.type === "OTHER" ? values.otherTypeLabel?.trim() : "";
          const title = customType ? `${customType} - ${values.title}` : values.title;
          nextValues = { ...values, title };
          await onSubmit({
            sourceMode: "link",
            values: [nextValues],
          });
        })}
      >
        <div>
          <label className="text-sm font-medium text-slate-950">{language === "ar" ? "النوع" : "Type"}</label>
          <select
            {...form.register("type")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950"
          >
            <option value="CONTRACT">CONTRACT</option>
            <option value="ID">ID</option>
            <option value="CERTIFICATE">CERTIFICATE</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-950">{language === "ar" ? "العنوان" : "Title"}</label>
          <input
            {...form.register("title")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 placeholder:text-slate-500"
          />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.title?.message}</p>
        </div>
        {form.watch("type") === "OTHER" ? (
          <div>
            <label className="text-sm font-medium text-slate-950">{language === "ar" ? "اسم النوع الآخر" : "Other Type Name"}</label>
            <input
              {...form.register("otherTypeLabel")}
              placeholder={language === "ar" ? "مثل: تأشيرة، تأمين، اتفاقية" : "e.g. NDA, Visa, Insurance"}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 placeholder:text-slate-500"
            />
            <p className="mt-1 text-xs text-rose-600">{form.formState.errors.otherTypeLabel?.message}</p>
          </div>
        ) : null}
        <div>
          <label className="text-sm font-medium text-slate-950">{language === "ar" ? "مصدر المستند" : "Document Source"}</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSourceMode("link")}
              className={`rounded-md border px-3 py-2 text-sm ${sourceMode === "link" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-950"}`}
            >
              {language === "ar" ? "رابط" : "Link"}
            </button>
            <button
              type="button"
              onClick={() => setSourceMode("file")}
              className={`rounded-md border px-3 py-2 text-sm ${sourceMode === "file" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-950"}`}
            >
              {language === "ar" ? "ملف من الجهاز" : "Device File"}
            </button>
          </div>
          {sourceMode === "link" ? (
            <>
              <input
                {...form.register("fileUrl")}
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 placeholder:text-slate-500"
              />
              <p className="mt-1 text-xs text-rose-600">{form.formState.errors.fileUrl?.message}</p>
            </>
          ) : (
            <>
              <input
                type="file"
                multiple
                onChange={(event) => {
                  const incomingFiles = Array.from(event.target.files ?? []);
                  if (incomingFiles.length === 0) {
                    return;
                  }
                  setSelectedFiles((prev) => {
                    const seen = new Set(
                      prev.map(
                        (file) => `${file.name}:${file.size}:${file.lastModified}`
                      )
                    );
                    const appended = incomingFiles.filter((file) => {
                      const key = `${file.name}:${file.size}:${file.lastModified}`;
                      if (seen.has(key)) {
                        return false;
                      }
                      seen.add(key);
                      return true;
                    });
                    return [...prev, ...appended];
                  });
                  event.currentTarget.value = "";
                }}
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-slate-950"
              />
              {selectedFiles.length > 0 ? (
                <p className="mt-1 text-xs text-slate-950">
                  {language === "ar"
                    ? `تم اختيار ${selectedFiles.length} ملف`
                    : `${selectedFiles.length} file(s) selected`}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-rose-600">{fileInputError}</p>
            </>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-950">
            {language === "ar" ? "تاريخ الانتهاء (اختياري)" : "Expires At (optional)"}
          </label>
          <input
            type="datetime-local"
            {...form.register("expiresAt")}
            onClick={(event) => event.currentTarget.showPicker?.()}
            className="mt-1 w-full cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {language === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending
              ? language === "ar"
                ? "جارٍ الرفع..."
                : "Uploading..."
              : language === "ar"
                ? "رفع"
                : "Upload"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
