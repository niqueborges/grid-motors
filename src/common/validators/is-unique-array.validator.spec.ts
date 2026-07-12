import { IsUniqueArrayConstraint } from './is-unique-array.validator';
import { ValidationArguments } from 'class-validator';

describe('IsUniqueArrayConstraint', () => {
  let constraint: IsUniqueArrayConstraint;

  const makeArgs = (propName: string): ValidationArguments => ({
    constraints: [propName],
    property: propName,
    object: {},
    targetName: 'TestClass',
    value: undefined,
  });

  beforeEach(() => {
    constraint = new IsUniqueArrayConstraint();
  });

  describe('validate', () => {
    it('should return false for non-array values', () => {
      expect(constraint.validate('not-an-array', makeArgs('description'))).toBe(
        false,
      );
      expect(constraint.validate(null, makeArgs('description'))).toBe(false);
      expect(constraint.validate(undefined, makeArgs('description'))).toBe(
        false,
      );
      expect(constraint.validate(42, makeArgs('description'))).toBe(false);
    });

    it('should return true for an empty array', () => {
      expect(constraint.validate([], makeArgs('description'))).toBe(true);
    });

    it('should return true for an array with unique object values', () => {
      const value = [
        { description: 'air conditioner' },
        { description: '4x4 traction' },
        { description: '4 ports' },
      ];
      expect(constraint.validate(value, makeArgs('description'))).toBe(true);
    });

    it('should return false for an array with duplicate object values', () => {
      const value = [
        { description: 'air conditioner' },
        { description: 'air conditioner' },
      ];
      expect(constraint.validate(value, makeArgs('description'))).toBe(false);
    });

    it('should return true for an array of unique primitives', () => {
      expect(constraint.validate(['a', 'b', 'c'], makeArgs('description'))).toBe(
        true,
      );
    });

    it('should return false for an array of duplicate primitives', () => {
      expect(constraint.validate(['a', 'a'], makeArgs('description'))).toBe(
        false,
      );
    });
  });

  describe('defaultMessage', () => {
    it('should return a descriptive error message', () => {
      expect(constraint.defaultMessage(makeArgs('description'))).toBe(
        'Array contains duplicate elements',
      );
    });
  });
});
