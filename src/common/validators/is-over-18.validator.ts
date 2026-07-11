import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsOver18Constraint implements ValidatorConstraintInterface {
  validate(birthStr: unknown) {
    if (typeof birthStr !== 'string') return false;

    const [day, month, year] = birthStr.split('/');
    if (!day || !month || !year) return false;

    const birthDate = new Date(Number(year), Number(month) - 1, Number(day));
    if (isNaN(birthDate.getTime())) return false;

    const diff = Date.now() - birthDate.getTime();
    const ageDate = new Date(diff);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);

    return age >= 18;
  }

  defaultMessage() {
    return 'User must be at least 18 years old';
  }
}

export function IsOver18(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsOver18Constraint,
    });
  };
}
