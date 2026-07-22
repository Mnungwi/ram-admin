import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  OnChanges,
  SimpleChanges,
  HostListener,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

export interface SelectOption {
  value: any;
  label: string;
  sublabel?: string;
  color?: string;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="ss-wrapper" #wrapper>
      <!-- Trigger -->
      <div
        class="ss-trigger"
        [class.ss-open]="isOpen"
        [class.ss-disabled]="disabled"
        (click)="toggle()"
      >
        <span class="ss-value" *ngIf="selectedOption">
          <i
            class="fa {{ selectedOption.icon }} me-1"
            *ngIf="selectedOption.icon"
            [style.color]="selectedOption.color"
          ></i>
          {{ selectedOption.label }}
        </span>
        <span class="ss-placeholder" *ngIf="!selectedOption">{{
          placeholder
        }}</span>
        <div class="ss-actions">
          <span
            class="ss-clear"
            *ngIf="clearable && selectedOption && !disabled"
            (click)="clear($event)"
          >
            <i class="fa fa-times"></i>
          </span>
          <span class="ss-arrow">
            <i class="fa fa-chevron-down"></i>
          </span>
        </div>
      </div>

      <!-- Dropdown — position calculated dynamically -->
      <div
        class="ss-dropdown"
        *ngIf="isOpen"
        [style.top]="dropdownTop"
        [style.bottom]="dropdownBottom"
        [style.left]="dropdownLeft"
        [style.width.px]="triggerWidth"
      >
        <div class="ss-search">
          <i class="fa fa-search"></i>
          <input
            #searchInput
            type="text"
            [placeholder]="searchPlaceholder"
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearch()"
            (click)="$event.stopPropagation()"
          />
        </div>
        <div class="ss-options">
          <div
            class="ss-option ss-none"
            *ngIf="clearable"
            (click)="selectOption(null)"
          >
            — None —
          </div>
          <div
            class="ss-option"
            *ngFor="let opt of filteredOptions"
            [class.ss-selected]="opt.value === value"
            [class.ss-option-disabled]="opt.disabled"
            (click)="selectOption(opt)"
          >
            <i
              class="fa {{ opt.icon }} me-1"
              *ngIf="opt.icon"
              [style.color]="opt.color"
            ></i>
            <div class="ss-opt-content">
              <div class="ss-opt-label">{{ opt.label }}</div>
              <div class="ss-opt-sub" *ngIf="opt.sublabel">
                {{ opt.sublabel }}
              </div>
            </div>
          </div>
          <div class="ss-empty" *ngIf="filteredOptions.length === 0">
            <i class="fa fa-search"></i>
            <span>No results for "{{ searchTerm }}"</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .ss-wrapper {
        position: relative;
        width: 100%;
      }

      .ss-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 38px;
        padding: 6px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: #fff;
        cursor: pointer;
        transition:
          border-color 0.15s,
          box-shadow 0.15s;
        user-select: none;
      }
      .ss-trigger:hover {
        border-color: #9ca3af;
      }
      .ss-trigger.ss-open {
        border-color: #1a56db;
        box-shadow: 0 0 0 3px rgba(26, 86, 219, 0.1);
      }
      .ss-trigger.ss-disabled {
        background: #f9fafb;
        cursor: not-allowed;
        opacity: 0.7;
      }

      .ss-value {
        font-size: 13px;
        color: #111827;
        flex: 1;
      }
      .ss-placeholder {
        font-size: 13px;
        color: #9ca3af;
        flex: 1;
      }

      .ss-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .ss-clear {
        color: #9ca3af;
        font-size: 11px;
        cursor: pointer;
      }
      .ss-clear:hover {
        color: #ef4444;
      }
      .ss-arrow {
        color: #9ca3af;
        font-size: 11px;
        transition: transform 0.2s;
      }
      .ss-open .ss-arrow {
        transform: rotate(180deg);
      }

      /* ── DROPDOWN ── */
      .ss-dropdown {
        position: absolute;
        z-index: 99999;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        overflow: hidden;
        max-height: 280px;
        display: flex;
        flex-direction: column;
      }

      .ss-search {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-bottom: 1px solid #f3f4f6;
        flex-shrink: 0;
      }
      .ss-search i {
        color: #9ca3af;
        font-size: 12px;
      }
      .ss-search input {
        border: none;
        outline: none;
        font-size: 13px;
        width: 100%;
        background: transparent;
        color: #111827;
      }

      .ss-options {
        overflow-y: auto;
        flex: 1;
      }
      .ss-options::-webkit-scrollbar {
        width: 4px;
      }
      .ss-options::-webkit-scrollbar-thumb {
        background: #e5e7eb;
        border-radius: 4px;
      }

      .ss-option {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        cursor: pointer;
        transition: background 0.1s;
        font-size: 13px;
      }
      .ss-option:hover {
        background: #f8fafc;
      }
      .ss-option.ss-selected {
        background: #eff6ff;
        color: #1a56db;
      }
      .ss-option.ss-option-disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }
      .ss-option.ss-none {
        color: #9ca3af;
        font-style: italic;
      }

      .ss-opt-content {
        flex: 1;
        min-width: 0;
      }
      .ss-opt-label {
        font-weight: 500;
        color: #111827;
      }
      .ss-selected .ss-opt-label {
        color: #1a56db;
      }
      .ss-opt-sub {
        font-size: 11px;
        color: #9ca3af;
        margin-top: 1px;
      }

      .ss-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        color: #9ca3af;
        gap: 8px;
        font-size: 13px;
      }
      .ss-empty i {
        font-size: 20px;
      }
    `,
  ],
})
export class SearchableSelectComponent
  implements ControlValueAccessor, OnChanges
{
  @Input() options: SelectOption[] = [];
  @Input() placeholder = 'Select...';
  @Input() searchPlaceholder = 'Search...';
  @Input() clearable = false;
  @Input() disabled = false;

  @Output() valueChange = new EventEmitter<any>();
  @ViewChild('wrapper') wrapperRef!: ElementRef;
  @ViewChild('searchInput') searchInputRef!: ElementRef;

  value: any = null;
  isOpen = false;
  searchTerm = '';
  filteredOptions: SelectOption[] = [];
  dropdownTop = 'auto';
  dropdownBottom = 'auto';
  dropdownLeft = '0px';
  triggerWidth = 200;

  private onChange = (_: any) => {};
  private onTouched = () => {};

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['options']) {
      this.filteredOptions = [...(this.options || [])];
      this.syncSelected();
    }
  }

  get selectedOption(): SelectOption | null {
    if (this.value === null || this.value === undefined || this.value === '')
      return null;
    return this.options?.find((o) => o.value === this.value) || null;
  }

  toggle() {
    if (this.disabled) return;
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.searchTerm = '';
    this.filteredOptions = [...(this.options || [])];
    this.calculatePosition();
    setTimeout(() => this.searchInputRef?.nativeElement?.focus(), 50);
  }

  close() {
    this.isOpen = false;
    this.searchTerm = '';
    this.filteredOptions = [...(this.options || [])];
  }

  calculatePosition() {
    setTimeout(() => {
      if (!this.wrapperRef) return;
      const rect = this.wrapperRef.nativeElement.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 280;
      this.triggerWidth = rect.width;
      this.dropdownLeft = '0px'; // relative to wrapper

      if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
        // Open below trigger
        this.dropdownTop = `${rect.height + 4}px`;
        this.dropdownBottom = 'auto';
      } else {
        // Open above trigger
        this.dropdownTop = 'auto';
        this.dropdownBottom = `${rect.height + 4}px`;
      }
      this.cdr.detectChanges();
    }, 0);
  }

  onSearch() {
    const term = this.searchTerm.toLowerCase();
    this.filteredOptions = (this.options || []).filter(
      (o) =>
        o.label.toLowerCase().includes(term) ||
        (o.sublabel || '').toLowerCase().includes(term),
    );
  }

  selectOption(opt: SelectOption | null) {
    this.value = opt?.value ?? null;
    this.onChange(this.value);
    this.onTouched();
    this.valueChange.emit(this.value);
    this.close();
  }

  clear(event: Event) {
    event.stopPropagation();
    this.selectOption(null);
  }

  syncSelected() {
    // no-op, getter handles it
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.wrapperRef?.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    if (this.isOpen) this.calculatePosition();
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (this.isOpen) this.calculatePosition();
  }

  // ControlValueAccessor
  writeValue(val: any): void {
    this.value = val ?? null;
    this.cdr.markForCheck();
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(d: boolean): void {
    this.disabled = d;
  }
}
