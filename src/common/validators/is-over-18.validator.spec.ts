import { IsOver18Constraint } from './is-over-18.validator';

describe('IsOver18Constraint', () => {
  let constraint: IsOver18Constraint;

  beforeEach(() => {
    constraint = new IsOver18Constraint();
  });

  describe('validate', () => {
    it('should return false for non-string values', () => {
      expect(constraint.validate(null)).toBe(false);
      expect(constraint.validate(undefined)).toBe(false);
      expect(constraint.validate(123456)).toBe(false);
      expect(constraint.validate({})).toBe(false);
    });

    it('should return false for strings with missing date parts', () => {
      expect(constraint.validate('01/01')).toBe(false);
      expect(constraint.validate('2000')).toBe(false);
      expect(constraint.validate('')).toBe(false);
    });

    it('should return false for a user under 18', () => {
      const today = new Date();
      const under18Year = today.getFullYear() - 17;
      const birthStr = `01/01/${under18Year}`;
      expect(constraint.validate(birthStr)).toBe(false);
    });

    it('should return true for a user exactly 18 years old', () => {
      const today = new Date();
      const year18 = today.getFullYear() - 18;
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      expect(constraint.validate(`${day}/${month}/${year18}`)).toBe(true);
    });

    it('should return true for a user over 18', () => {
      expect(constraint.validate('03/03/2000')).toBe(true);
      expect(constraint.validate('01/01/1990')).toBe(true);
    });
  });

  describe('defaultMessage', () => {
    it('should return a descriptive error message', () => {
      expect(constraint.defaultMessage()).toBe(
        'User must be at least 18 years old',
      );
    });
  });
});
