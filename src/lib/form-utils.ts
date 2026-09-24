import type { FormikErrors, FormikTouched } from 'formik'

export function getFieldError<T extends Record<string, unknown>>(
  touched: FormikTouched<T>,
  errors: FormikErrors<T>,
  fieldName: keyof T,
): string | undefined {
  const touchedValue = touched[fieldName]
  const errorValue = errors[fieldName]
  return touchedValue && typeof errorValue === 'string' ? errorValue : undefined
}
