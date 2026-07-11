import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsCpfConstraint implements ValidatorConstraintInterface {
  validate(cpf: any) {
    if (typeof cpf !== 'string') return false;

    const cleanCpf = cpf.replace(/[^\d]+/g, '');
    if (cleanCpf.length !== 11 || !!cleanCpf.match(/(\d)\1{10}/)) return false;

    const calc = (n: number) => {
      let sum = 0;
      for (let i = 1; i <= n; i++) {
        sum += parseInt(cleanCpf.substring(i - 1, i)) * (n + 2 - i);
      }
      let rem = (sum * 10) % 11;
      if (rem === 10 || rem === 11) rem = 0;
      return rem === parseInt(cleanCpf.substring(n, n + 1));
    };

    return calc(9) && calc(10);
  }

  defaultMessage() {
    return 'Invalid CPF format or digit';
  }
}

export function IsCpf(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCpfConstraint,
    });
  };
}
