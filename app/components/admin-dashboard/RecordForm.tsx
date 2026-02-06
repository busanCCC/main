"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import type { FieldConfig, TableMeta } from "@/app/(pages)/admin-dashboard/table-config";

interface RecordFormProps {
  tableMeta: TableMeta;
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onBack: () => void;
  isSubmitting?: boolean;
  mode: "create" | "edit";
}

// --- 필드 타입별 전용 컴포넌트 (Separating Code Paths) ---

function TextFieldInput({
  field,
  register,
  error,
}: {
  field: FieldConfig;
  register: ReturnType<typeof useForm>["register"];
  error?: string;
}) {
  return (
    <Input
      {...register(field.name)}
      type="text"
      placeholder={field.placeholder}
      disabled={field.readOnly}
      className={error ? "border-destructive" : ""}
    />
  );
}

function TextareaFieldInput({
  field,
  register,
  error,
}: {
  field: FieldConfig;
  register: ReturnType<typeof useForm>["register"];
  error?: string;
}) {
  return (
    <textarea
      {...register(field.name)}
      placeholder={field.placeholder}
      disabled={field.readOnly}
      rows={4}
      className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        error ? "border-destructive" : ""
      }`}
    />
  );
}

function NumberFieldInput({
  field,
  register,
  error,
}: {
  field: FieldConfig;
  register: ReturnType<typeof useForm>["register"];
  error?: string;
}) {
  return (
    <Input
      {...register(field.name, { valueAsNumber: true })}
      type="number"
      placeholder={field.placeholder}
      disabled={field.readOnly}
      className={error ? "border-destructive" : ""}
    />
  );
}

function BooleanToggleInput({
  field,
  register,
}: {
  field: FieldConfig;
  register: ReturnType<typeof useForm>["register"];
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        {...register(field.name)}
        type="checkbox"
        disabled={field.readOnly}
        className="h-4 w-4 rounded border-input"
      />
      <span className="text-sm text-muted-foreground">활성화</span>
    </label>
  );
}

function EnumSelectInput({
  field,
  register,
  error,
}: {
  field: FieldConfig;
  register: ReturnType<typeof useForm>["register"];
  error?: string;
}) {
  return (
    <select
      {...register(field.name)}
      disabled={field.readOnly}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        error ? "border-destructive" : ""
      }`}
    >
      <option value="">선택하세요</option>
      {field.enumValues?.map((val) => (
        <option key={val} value={val}>
          {val}
        </option>
      ))}
    </select>
  );
}

function DateFieldInput({
  field,
  register,
  error,
}: {
  field: FieldConfig;
  register: ReturnType<typeof useForm>["register"];
  error?: string;
}) {
  return (
    <Input
      {...register(field.name)}
      type={field.readOnly ? "text" : "date"}
      placeholder={field.placeholder}
      disabled={field.readOnly}
      className={error ? "border-destructive" : ""}
    />
  );
}

function UrlFieldInput({
  field,
  register,
  error,
}: {
  field: FieldConfig;
  register: ReturnType<typeof useForm>["register"];
  error?: string;
}) {
  return (
    <Input
      {...register(field.name)}
      type="url"
      placeholder={field.placeholder ?? "https://"}
      disabled={field.readOnly}
      className={error ? "border-destructive" : ""}
    />
  );
}

function JsonFieldInput({
  field,
  register,
  error,
}: {
  field: FieldConfig;
  register: ReturnType<typeof useForm>["register"];
  error?: string;
}) {
  return (
    <textarea
      {...register(field.name)}
      placeholder={field.placeholder ?? "JSON 형식으로 입력"}
      disabled={field.readOnly}
      rows={3}
      className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        error ? "border-destructive" : ""
      }`}
    />
  );
}

function NumberArrayFieldInput({
  field,
  register,
  error,
}: {
  field: FieldConfig;
  register: ReturnType<typeof useForm>["register"];
  error?: string;
}) {
  return (
    <Input
      {...register(field.name)}
      type="text"
      placeholder={field.placeholder ?? "쉼표로 구분 (예: 1, 2, 3)"}
      disabled={field.readOnly}
      className={error ? "border-destructive" : ""}
    />
  );
}

// --- FieldRenderer: 필드 타입에 따라 전용 컴포넌트 분기 ---
function FieldRenderer({
  field,
  register,
  error,
}: {
  field: FieldConfig;
  register: ReturnType<typeof useForm>["register"];
  error?: string;
}) {
  switch (field.type) {
    case "text":
      return <TextFieldInput field={field} register={register} error={error} />;
    case "textarea":
      return <TextareaFieldInput field={field} register={register} error={error} />;
    case "number":
      return <NumberFieldInput field={field} register={register} error={error} />;
    case "boolean":
      return <BooleanToggleInput field={field} register={register} />;
    case "enum":
      return <EnumSelectInput field={field} register={register} error={error} />;
    case "date":
      return <DateFieldInput field={field} register={register} error={error} />;
    case "url":
      return <UrlFieldInput field={field} register={register} error={error} />;
    case "json":
      return <JsonFieldInput field={field} register={register} error={error} />;
    case "number_array":
      return <NumberArrayFieldInput field={field} register={register} error={error} />;
    default:
      return <TextFieldInput field={field} register={register} error={error} />;
  }
}

// --- 메인 RecordForm 컴포넌트 ---
export function RecordForm({
  tableMeta,
  defaultValues,
  onSubmit,
  onBack,
  isSubmitting = false,
  mode,
}: RecordFormProps) {
  const visibleFields = tableMeta.fields.filter((f) => !f.hidden);
  const editableFields =
    mode === "create"
      ? visibleFields.filter((f) => !f.readOnly)
      : visibleFields;

  // 기본값 변환
  const formDefaults: Record<string, unknown> = {};
  for (const field of editableFields) {
    const raw = defaultValues?.[field.name];

    if (field.type === "boolean") {
      formDefaults[field.name] = raw === true;
    } else if (field.type === "number_array") {
      formDefaults[field.name] = Array.isArray(raw)
        ? (raw as number[]).join(", ")
        : "";
    } else if (field.type === "json") {
      formDefaults[field.name] =
        raw != null ? JSON.stringify(raw, null, 2) : "";
    } else {
      formDefaults[field.name] = raw != null ? String(raw) : "";
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(tableMeta.zodSchema),
    defaultValues: formDefaults,
  });

  const processFormData = (data: Record<string, unknown>) => {
    const processed: Record<string, unknown> = {};

    for (const field of editableFields) {
      if (field.readOnly) continue;

      const value = data[field.name];

      if (field.type === "number_array") {
        const str = String(value ?? "").trim();
        processed[field.name] =
          str === ""
            ? null
            : str.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
      } else if (field.type === "json") {
        const str = String(value ?? "").trim();
        try {
          processed[field.name] = str === "" ? null : JSON.parse(str);
        } catch {
          processed[field.name] = null;
        }
      } else if (field.type === "number") {
        const num = Number(value);
        processed[field.name] = isNaN(num) ? null : num;
      } else if (field.type === "boolean") {
        processed[field.name] = value === true || value === "true";
      } else {
        const str = String(value ?? "").trim();
        processed[field.name] = str === "" ? null : str;
      }
    }

    return processed;
  };

  const onFormSubmit = handleSubmit(async (data) => {
    const processed = processFormData(data);
    await onSubmit(processed);
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">
            {mode === "create"
              ? `${tableMeta.label} 생성`
              : `${tableMeta.label} 수정`}
          </h2>
          <p className="text-sm text-muted-foreground">{tableMeta.description}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onFormSubmit} className="space-y-6 max-w-2xl">
        {editableFields.map((field) => {
          const errorMessage = errors[field.name]?.message as string | undefined;
          return (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
                {field.readOnly && (
                  <span className="text-muted-foreground ml-1 text-xs">
                    (읽기 전용)
                  </span>
                )}
              </Label>
              <FieldRenderer
                field={field}
                register={register}
                error={errorMessage}
              />
              {errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}
            </div>
          );
        })}

        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {mode === "create" ? "생성" : "저장"}
          </Button>
          <Button type="button" variant="outline" onClick={onBack}>
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
