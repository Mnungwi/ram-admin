import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../../../../core/services/domain.services'; // rekebisha idadi ya '../'

@Component({
  selector: 'app-taxes-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './taxes-tab.component.html',
  styleUrls: ['./taxes-tab.component.css'],
})
export class TaxesTabComponent implements OnChanges {
  @Input() projectId!: string;

  taxes: any[] = [];
  loading = false;

  constructor(private financeSvc: FinanceService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && this.projectId) {
      this.load();
    }
  }

  load(): void {
    this.loading = true;
    this.financeSvc.getTaxSummary(this.projectId).subscribe({
      next: (res: any) => {
        this.taxes = res?.data?.taxes || [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }
}
