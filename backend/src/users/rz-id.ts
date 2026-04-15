import { registerDecorator, ValidationOptions } from 'class-validator';

const RZ_ID_REGEX = /^[a-z]{2}\d{3}[a-z]{3}$/;

export const RZ_ID_EXCEPTIONS = ['terb'];

export function IsRzId(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isRzId',
      target: object.constructor,
      propertyName,
      options: { message: 'rzId must match format ab123cde or be a known exception', ...options },
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          return RZ_ID_REGEX.test(value) || RZ_ID_EXCEPTIONS.includes(value);
        },
      },
    });
  };
}
