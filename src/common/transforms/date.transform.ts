import { Transform } from 'class-transformer';

export const TransformDateDDMMYYYY = () =>
  Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const parts = value.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // months are 0-indexed in JS
      const year = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return value;
  });
