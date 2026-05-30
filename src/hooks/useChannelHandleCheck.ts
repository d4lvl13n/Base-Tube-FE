import { useState, useEffect, useCallback } from 'react';
import { checkHandleAvailability } from '../api/channel';
import { handleValidation, isValidHandle } from '../types/channel';
import { stripHandleSuffix } from '../utils/handleUtils';

export interface UseChannelHandleCheckOptions {
  /** Debounce delay in ms (default 500) */
  debounceMs?: number;
  enabled?: boolean;
}

export const useChannelHandleCheck = (
  rawHandle: string,
  options: UseChannelHandleCheckOptions = {}
) => {
  const { debounceMs = 500, enabled = true } = options;

  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [formattedHandle, setFormattedHandle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const reset = useCallback(() => {
    setIsAvailable(null);
    setFormattedHandle(null);
    setError(null);
    setIsChecking(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      reset();
      return;
    }

    const trimmed = rawHandle?.trim();
    if (!trimmed) {
      reset();
      return;
    }

    const strippedHandle = stripHandleSuffix(trimmed);

    if (handleValidation.reservedHandles.includes(strippedHandle.toLowerCase())) {
      setIsAvailable(false);
      setFormattedHandle(null);
      setError('This handle is reserved. Please choose another one.');
      setIsChecking(false);
      return;
    }

    if (!isValidHandle(strippedHandle)) {
      setIsAvailable(false);
      setFormattedHandle(null);
      setError('Handle can only contain letters, numbers, and underscores.');
      setIsChecking(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsChecking(true);
      setError(null);

      try {
        const result = await checkHandleAvailability(strippedHandle);
        if (cancelled) return;

        setFormattedHandle(result.formattedHandle || null);
        setIsAvailable(result.isAvailable);

        if (!result.validation?.isValid && result.validation?.errors?.length) {
          setError(result.validation.errors[0]);
          setIsAvailable(false);
          return;
        }

        if (!result.isAvailable) {
          setError('This handle is taken or reserved.');
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Handle validation failed:', err);
        setError('Unable to verify handle availability.');
        setFormattedHandle(null);
        setIsAvailable(null);
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [rawHandle, debounceMs, enabled, reset]);

  const resolveHandleForSubmit = useCallback(
    (fallbackRaw: string) => {
      if (formattedHandle) {
        return stripHandleSuffix(formattedHandle);
      }
      return stripHandleSuffix(fallbackRaw.trim());
    },
    [formattedHandle]
  );

  return {
    isAvailable,
    formattedHandle,
    error,
    isChecking,
    reset,
    resolveHandleForSubmit,
  };
};
