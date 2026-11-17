import { useCallback, useMemo, useState } from 'react';
import type { Validator } from '../utils/validation';

type Errors<T> = Partial<Record<keyof T, string>>;

export function useForm<T extends Record<string, string>>(initialValues: T, validate: Validator<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<Errors<T>>({});
  const [submitting, setSubmitting] = useState(false);

  const validationErrors = useMemo(() => validate(values), [validate, values]);

  const errors: Errors<T> = useMemo(() => {
    const visible: Errors<T> = {};
    (Object.keys(values) as (keyof T)[]).forEach((key) => {
      const message = serverErrors[key] ?? (touched[key] ? validationErrors[key] : undefined);
      if (message) visible[key] = message;
    });
    return visible;
  }, [values, serverErrors, touched, validationErrors]);

  const setField = useCallback((field: keyof T, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setTouched((previous) => ({ ...previous, [field]: true }));
    setServerErrors((previous) => ({ ...previous, [field]: undefined }));
  }, []);

  const touchAll = useCallback(() => {
    const all: Partial<Record<keyof T, boolean>> = {};
    (Object.keys(values) as (keyof T)[]).forEach((key) => {
      all[key] = true;
    });
    setTouched(all);
  }, [values]);

  const isValid = Object.values(validationErrors).every((message) => !message);

  const handleSubmit = useCallback(
    (onValid: (values: T) => Promise<void>) => async () => {
      touchAll();
      if (!isValid || submitting) return;
      setSubmitting(true);
      try {
        await onValid(values);
      } finally {
        setSubmitting(false);
      }
    },
    [touchAll, isValid, submitting, values]
  );

  const reset = useCallback(
    (next: T = initialValues) => {
      setValues(next);
      setTouched({});
      setServerErrors({});
    },
    [initialValues]
  );

  const applyServerErrors = useCallback((fieldErrors: Record<string, string>) => {
    setServerErrors(fieldErrors as Errors<T>);
  }, []);

  return { values, errors, setField, handleSubmit, submitting, isValid, reset, applyServerErrors };
}
