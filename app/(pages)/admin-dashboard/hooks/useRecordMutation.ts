"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import {
  createRecord as createRecordAction,
  updateRecord as updateRecordAction,
  deleteRecord as deleteRecordAction,
} from "../actions";
import type { ActionResult } from "../table-config";
import { TOAST_DURATION_MS } from "../table-config";

interface UseRecordMutationReturn {
  createRecord: (
    tableName: string,
    data: Record<string, unknown>
  ) => Promise<ActionResult<Record<string, unknown>>>;
  updateRecord: (
    tableName: string,
    id: number | string,
    data: Record<string, unknown>
  ) => Promise<ActionResult<Record<string, unknown>>>;
  deleteRecord: (
    tableName: string,
    id: number | string
  ) => Promise<ActionResult<null>>;
}

export function useRecordMutation(): UseRecordMutationReturn {
  const createRecord = useCallback(
    async (tableName: string, data: Record<string, unknown>) => {
      const result = await createRecordAction(tableName, data);
      if (result.ok) {
        toast.success("레코드가 생성되었습니다.", {
          duration: TOAST_DURATION_MS,
        });
      } else {
        toast.error(`생성 실패: ${result.reason}`, {
          duration: TOAST_DURATION_MS,
        });
      }
      return result;
    },
    []
  );

  const updateRecord = useCallback(
    async (
      tableName: string,
      id: number | string,
      data: Record<string, unknown>
    ) => {
      const result = await updateRecordAction(tableName, id, data);
      if (result.ok) {
        toast.success("레코드가 수정되었습니다.", {
          duration: TOAST_DURATION_MS,
        });
      } else {
        toast.error(`수정 실패: ${result.reason}`, {
          duration: TOAST_DURATION_MS,
        });
      }
      return result;
    },
    []
  );

  const deleteRecord = useCallback(
    async (tableName: string, id: number | string) => {
      const result = await deleteRecordAction(tableName, id);
      if (result.ok) {
        toast.success("레코드가 삭제되었습니다.", {
          duration: TOAST_DURATION_MS,
        });
      } else {
        toast.error(`삭제 실패: ${result.reason}`, {
          duration: TOAST_DURATION_MS,
        });
      }
      return result;
    },
    []
  );

  return { createRecord, updateRecord, deleteRecord };
}
