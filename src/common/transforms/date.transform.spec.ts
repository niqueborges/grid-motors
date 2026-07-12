import { plainToInstance } from 'class-transformer';
import { TransformDateDDMMYYYY } from './date.transform';

class TestDto {
  @TransformDateDDMMYYYY()
  date: unknown;
}

describe('TransformDateDDMMYYYY', () => {
  it('should transform a valid DD/MM/YYYY string into a Date object', () => {
    const instance = plainToInstance(TestDto, { date: '03/06/2000' });
    expect(instance.date).toBeInstanceOf(Date);
    const d = instance.date as Date;
    expect(d.getFullYear()).toBe(2000);
    expect(d.getMonth()).toBe(5); // June is index 5
    expect(d.getDate()).toBe(3);
  });

  it('should return the original value when input is not a string', () => {
    const instance = plainToInstance(TestDto, { date: 99999 });
    expect(instance.date).toBe(99999);
  });

  it('should return the original value when string does not have 3 parts', () => {
    const instance = plainToInstance(TestDto, { date: '2000-06-03' });
    expect(instance.date).toBe('2000-06-03');
  });

  it('should return the original value when the parsed date is invalid', () => {
    const instance = plainToInstance(TestDto, { date: 'aa/bb/cccc' });
    // NaN parts produce an invalid Date
    expect(instance.date).toBe('aa/bb/cccc');
  });

  it('should handle first day of year correctly', () => {
    const instance = plainToInstance(TestDto, { date: '01/01/1990' });
    expect(instance.date).toBeInstanceOf(Date);
    const d = instance.date as Date;
    expect(d.getFullYear()).toBe(1990);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });
});
