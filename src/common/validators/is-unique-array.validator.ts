import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsUniqueArrayConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (!Array.isArray(value)) return false;

    // We assume array of objects with a 'description' property based on args.property or a fixed logic.
    // To make it generic, we can take the property name to check from args.constraints.
    const propName = args.constraints[0] as string;

    const values = value.map((item: unknown) =>
      typeof item === 'object' && item !== null
        ? (item as Record<string, unknown>)[propName]
        : item,
    );
    const uniqueValues = new Set(values);

    return uniqueValues.size === values.length;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(args: ValidationArguments) {
    return 'Array contains duplicate elements';
  }
}

export function IsUniqueArray(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsUniqueArrayConstraint,
    });
  };
}
