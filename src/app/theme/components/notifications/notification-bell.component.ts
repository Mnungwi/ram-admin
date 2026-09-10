import { Component, OnDestroy, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="nb-wrapper d-inline-block">
      <a href="javascript:void(0)" class="nb-toggle pl-2 pr-2" title="Notifications" (click)="toggle()">
        <i class="fa fa-bell-o" aria-hidden="true"></i>
        <span class="nb-badge" *ngIf="svc.unread() > 0">{{ svc.unread() > 99 ? '99+' : svc.unread() }}</span>
      </a>

      <div class="nb-dropdown" *ngIf="open">
        <div class="nb-head">
          <span class="nb-title">Notifications</span>
          <a href="javascript:void(0)" class="nb-mark" *ngIf="svc.unread() > 0" (click)="markAll($event)">
            Mark all read
          </a>
        </div>

        <div class="nb-list">
          <ng-container *ngIf="svc.items().length; else emptyTpl">
            <a href="javascript:void(0)" *ngFor="let n of svc.items()"
               class="nb-item" [class.unread]="!n.isRead" (click)="onClick(n)">
              <div class="nb-dot" [class.on]="!n.isRead"></div>
              <div class="nb-body">
                <div class="nb-item-title">{{ n.title }}</div>
                <div class="nb-item-msg" *ngIf="n.message">{{ n.message }}</div>
                <div class="nb-time">{{ timeAgo(n.createdAt) }}</div>
              </div>
            </a>
          </ng-container>
          <ng-template #emptyTpl>
            <div class="nb-empty">
              <i class="fa fa-check-circle"></i>
              <span>You're all caught up</span>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nb-wrapper { position: relative; }
    .nb-toggle { position: relative; color: inherit; }
    .nb-badge {
      position: absolute; top: -6px; right: -2px; min-width: 16px; height: 16px;
      padding: 0 4px; border-radius: 8px; background: #ef4444; color: #fff;
      font-size: 10px; font-weight: 700; line-height: 16px; text-align: center;
    }
    .nb-dropdown {
      position: absolute; right: 0; top: 34px; width: 340px; max-width: 92vw;
      background: #fff; border: 1px solid #e5e7eb; border-radius: 10px;
      box-shadow: 0 12px 32px rgba(0,0,0,.16); z-index: 1080; overflow: hidden;
    }
    .nb-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px; border-bottom: 1px solid #f3f4f6;
    }
    .nb-title { font-weight: 700; font-size: 13px; color: #111827; }
    .nb-mark { font-size: 12px; color: #2563eb; }
    .nb-list { max-height: 380px; overflow-y: auto; }
    .nb-item {
      display: flex; gap: 10px; padding: 11px 14px; border-bottom: 1px solid #f6f7f8;
      text-decoration: none; transition: background .12s;
    }
    .nb-item:hover { background: #f8fafc; }
    .nb-item.unread { background: #eff6ff; }
    .nb-item.unread:hover { background: #e6f0ff; }
    .nb-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; background: transparent; }
    .nb-dot.on { background: #2563eb; }
    .nb-body { min-width: 0; }
    .nb-item-title { font-size: 13px; font-weight: 600; color: #111827; }
    .nb-item-msg { font-size: 12px; color: #4b5563; margin-top: 2px; }
    .nb-time { font-size: 11px; color: #9ca3af; margin-top: 3px; }
    .nb-empty {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 32px 14px; color: #9ca3af; font-size: 13px;
    }
    .nb-empty i { font-size: 22px; color: #22c55e; }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  open = false;

  constructor(
    public svc: NotificationService,
    private router: Router,
    private host: ElementRef,
  ) {}

  ngOnInit(): void {
    this.svc.startPolling(60000);
  }

  ngOnDestroy(): void {
    this.svc.stopPolling();
  }

  toggle(): void {
    this.open = !this.open;
    if (this.open) this.svc.list().subscribe();
  }

  markAll(ev: Event): void {
    ev.stopPropagation();
    this.svc.markAllRead().subscribe();
  }

  onClick(n: AppNotification): void {
    this.open = false;
    if (!n.isRead) this.svc.markRead(n.id).subscribe();
    if (n.link) this.router.navigateByUrl(n.link);
  }

  timeAgo(iso: string): string {
    const d = new Date(iso).getTime();
    if (!d) return '';
    const s = Math.floor((Date.now() - d) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent): void {
    if (this.open && !this.host.nativeElement.contains(ev.target)) this.open = false;
  }
}
