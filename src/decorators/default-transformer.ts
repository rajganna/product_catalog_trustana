import { Transform, TransformFnParams } from 'class-transformer';

export const Default = <T>(defaultValue: T, transform: (value: any) => T) => {
  return Transform(({ value }: TransformFnParams): T => transform(value) || defaultValue);
};

export const AsNumber = (defaultValue: number) => Default(defaultValue, value => parseInt(value, 10));

export const AsBoolean = (defaultValue: boolean) => Default(defaultValue, value => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  return Boolean(value);
});

export const AsString = (defaultValue: string) => Default(defaultValue, value => String(value || '').trim());
