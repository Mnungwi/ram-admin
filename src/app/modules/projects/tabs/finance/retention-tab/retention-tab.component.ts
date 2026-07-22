import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-retention-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './retention-tab.component.html',
  styleUrls: ['./retention-tab.component.css'],
})
export class RetentionTabComponent {
  @Input() projectId!: string;
  @Input() overview: any = {};

  // TODO: haya bado hayana backend endpoint maalum — yametolewa kwenye
  // `overview` (getOverview) endapo unayo, vinginevyo yanaonyesha 0.
  formatCurrency(amount: number): string {
    return (+amount || 0).toLocaleString();
  }
}
