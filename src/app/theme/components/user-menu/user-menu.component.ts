import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../../core/services/auth.service';
import { resolveAvatarUrl } from '../../../core/utils/avatar.util';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class UserMenuComponent implements OnInit {
  constructor(
    public auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {}

  get user() {
    return this.auth.currentUser();
  }

  get fullName(): string {
    return this.auth.userFullName();
  }

  get initials(): string {
    return this.auth.userInitials();
  }

  get avatarUrl(): string {
    return resolveAvatarUrl(this.user?.avatar);
  }

  logout(): void {
    Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Logout',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
    }).then((result) => {
      if (result.isConfirmed) {
        this.auth.logout();
      }
    });
  }
}
