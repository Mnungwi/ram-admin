import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyUtil } from '../../core/utils/currency.util';

@Pipe({
  name: 'currencyShort',
  standalone: true,
})
export class CurrencyShortPipe implements PipeTransform {
  transform(value: number, currency: string = 'TZS'): string {
    return CurrencyUtil.format(value, currency);
  }
}
