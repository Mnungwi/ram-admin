import {
  Component, Input, Output, EventEmitter, forwardRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR,
  NG_VALIDATORS, Validator, AbstractControl, ValidationErrors
} from '@angular/forms';

export interface DateRange {
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateRangePickerComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DateRangePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="drp-wrapper">
      <!-- Start Date -->
      <div class="drp-field">
        <label class="drp-label">
          {{startLabel}} <span class="text-danger" *ngIf="required">*</span>
        </label>
        <div class="drp-input-wrap"
             [class.drp-error]="touched && required && !startVal">
          <i class="fa fa-calendar drp-icon"></i>
          <input type="date"
                 class="drp-input"
                 [value]="startVal"
                 [max]="endVal || ''"
                 (change)="onStartChange($any($event.target).value)"
                 (blur)="markTouched()">
        </div>
        <div class="drp-err-msg" *ngIf="touched && required && !startVal">
          {{startLabel}} is required.
        </div>
      </div>

      <!-- Arrow -->
      <div class="drp-arrow"><i class="fa fa-arrow-right"></i></div>

      <!-- End Date -->
      <div class="drp-field">
        <label class="drp-label">
          {{endLabel}} <span class="text-danger" *ngIf="required">*</span>
        </label>
        <div class="drp-input-wrap"
             [class.drp-error]="touched && ((!endVal && required) || dateError)">
          <i class="fa fa-calendar drp-icon"></i>
          <input type="date"
                 class="drp-input"
                 [value]="endVal"
                 [min]="startVal || ''"
                 (change)="onEndChange($any($event.target).value)"
                 (blur)="markTouched()">
        </div>
        <div class="drp-err-msg" *ngIf="touched && required && !endVal">
          {{endLabel}} is required.
        </div>
        <div class="drp-err-msg" *ngIf="touched && dateError">
          {{endLabel}} must be after {{startLabel}}.
        </div>
      </div>

      <!-- Duration -->
      <div class="drp-duration" *ngIf="startVal && endVal && !dateError">
        <i class="fa fa-clock"></i> {{getDuration()}} days
      </div>
    </div>
  `,
  styles: [`
    .drp-wrapper { display:flex; align-items:flex-start; gap:12px; flex-wrap:wrap; }
    .drp-field { flex:1; min-width:140px; }
    .drp-label { display:block; font-size:12px; font-weight:600; color:#374151; margin-bottom:6px; }
    .drp-input-wrap {
      display:flex; align-items:center;
      border:1px solid #d1d5db; border-radius:8px;
      background:#fff; overflow:hidden; transition:border-color .15s;
    }
    .drp-input-wrap:focus-within { border-color:#1a56db; box-shadow:0 0 0 3px rgba(26,86,219,.1); }
    .drp-input-wrap.drp-error { border-color:#ef4444; }
    .drp-icon { padding:0 10px; color:#9ca3af; font-size:13px; flex-shrink:0; }
    .drp-input {
      flex:1; border:none; outline:none; padding:8px 10px 8px 0;
      font-size:13px; color:#111827; background:transparent; min-width:0;
    }
    .drp-err-msg { font-size:11px; color:#ef4444; margin-top:4px; }
    .drp-arrow { padding-top:30px; color:#9ca3af; font-size:12px; flex-shrink:0; }
    .drp-duration {
      display:flex; align-items:center; gap:6px;
      padding:6px 12px; background:#eff6ff; color:#1a56db;
      border-radius:20px; font-size:12px; font-weight:600;
      margin-top:26px; white-space:nowrap;
    }
  `]
})
export class DateRangePickerComponent implements ControlValueAccessor, Validator {
  @Input() startLabel = 'Start Date';
  @Input() endLabel   = 'End Date';
  @Input() required   = true;

  // Input/Output for direct binding (non-reactive forms)
  @Input() set startValue(v: string) { this.startVal = v || ''; }
  @Input() set endValue(v: string)   { this.endVal   = v || ''; }
  @Output() startChange = new EventEmitter<string>();
  @Output() endChange   = new EventEmitter<string>();

  startVal = '';
  endVal   = '';
  touched  = false;
  disabled = false;

  private _onChange = (_: any) => {};
  private _onTouched = () => {};

  get dateError(): boolean {
    if (!this.startVal || !this.endVal) return false;
    return new Date(this.startVal) > new Date(this.endVal);
  }

  onStartChange(val: string) {
    this.startVal = val;
    this.startChange.emit(val);
    this._onChange({ startDate: this.startVal, endDate: this.endVal });
  }

  onEndChange(val: string) {
    this.endVal = val;
    this.endChange.emit(val);
    this._onChange({ startDate: this.startVal, endDate: this.endVal });
  }

  markTouched() {
    this.touched = true;
    this._onTouched();
  }

  getDuration(): number {
    if (!this.startVal || !this.endVal) return 0;
    const diff = new Date(this.endVal).getTime() - new Date(this.startVal).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // ControlValueAccessor
  writeValue(val: DateRange | null): void {
    if (val) {
      this.startVal = val.startDate || '';
      this.endVal   = val.endDate   || '';
    } else {
      this.startVal = '';
      this.endVal   = '';
    }
  }

  registerOnChange(fn: any): void    { this._onChange   = fn; }
  registerOnTouched(fn: any): void   { this._onTouched  = fn; }
  setDisabledState(d: boolean): void { this.disabled     = d;  }

  // Validator
  validate(_: AbstractControl): ValidationErrors | null {
    const errors: ValidationErrors = {};
    if (this.required && !this.startVal) errors['startRequired'] = true;
    if (this.required && !this.endVal)   errors['endRequired']   = true;
    if (this.dateError)                  errors['dateRange']      = true;
    return Object.keys(errors).length ? errors : null;
  }
}
