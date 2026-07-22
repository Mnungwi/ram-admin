export class CurrencyUtil {
  static format(amount: number, currency: string = 'TZS'): string {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(2)}B ${currency}`;
    }

    if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(2)}M ${currency}`;
    }

    if (amount >= 1_000) {
      return `${(amount / 1_000).toFixed(0)}K ${currency}`;
    }

    return `${amount.toLocaleString()} ${currency}`;
  }
}
