import { IsCpfConstraint } from './is-cpf.validator';

describe('IsCpfConstraint', () => {
  let constraint: IsCpfConstraint;

  beforeEach(() => {
    constraint = new IsCpfConstraint();
  });

  describe('validate', () => {
    it('should return false for non-string values', () => {
      expect(constraint.validate(null)).toBe(false);
      expect(constraint.validate(undefined)).toBe(false);
      expect(constraint.validate(12345678909)).toBe(false);
      expect(constraint.validate({})).toBe(false);
    });

    it('should return false for CPF with incorrect length', () => {
      expect(constraint.validate('123.456.789')).toBe(false);
      expect(constraint.validate('123.456.789-000')).toBe(false);
    });

    it('should return false for CPF with all repeated digits', () => {
      expect(constraint.validate('111.111.111-11')).toBe(false);
      expect(constraint.validate('000.000.000-00')).toBe(false);
      expect(constraint.validate('999.999.999-99')).toBe(false);
    });

    it('should return false for CPF with invalid check digits', () => {
      expect(constraint.validate('123.456.789-00')).toBe(false);
      expect(constraint.validate('529.982.247-99')).toBe(false);
    });

    it('should return true for a valid CPF with mask', () => {
      expect(constraint.validate('131.147.860-49')).toBe(true);
      expect(constraint.validate('529.982.247-25')).toBe(true);
    });

    it('should return true for a valid CPF without mask', () => {
      expect(constraint.validate('13114786049')).toBe(true);
      expect(constraint.validate('52998224725')).toBe(true);
    });
  });

  describe('defaultMessage', () => {
    it('should return a descriptive error message', () => {
      expect(constraint.defaultMessage()).toBe('Invalid CPF format or digit');
    });
  });
});
