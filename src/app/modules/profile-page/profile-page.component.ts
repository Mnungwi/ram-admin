import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { resolveAvatarUrl } from '../../core/utils/avatar.util';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.css'],
})
export class ProfilePageComponent implements OnInit {
  activeTab: 'info' | 'password' = 'info';

  infoForm: FormGroup;
  passwordForm: FormGroup;

  savingInfo = false;
  savingPassword = false;
  uploadingAvatar = false;
  avatarPreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public auth: AuthService,
  ) {
    const user = this.auth.currentUser();
    this.infoForm = this.fb.group({
      firstName: [user?.firstName || '', Validators.required],
      lastName: [user?.lastName || '', Validators.required],
      phone: [user?.phone || ''],
      jobTitle: [user?.jobTitle || ''],
      department: [user?.department || ''],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['tab'] === 'password') this.activeTab = 'password';
    });
  }

  get user() {
    return this.auth.currentUser();
  }

  get avatarUrl(): string {
    return this.avatarPreview || resolveAvatarUrl(this.user?.avatar);
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      Swal.fire('Invalid File', 'Only JPEG, PNG or WEBP images are allowed.', 'error');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      Swal.fire('File Too Large', 'Please choose an image under 3MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => (this.avatarPreview = reader.result as string);
    reader.readAsDataURL(file);

    this.uploadingAvatar = true;
    this.auth.uploadAvatar(file).subscribe({
      next: () => {
        this.uploadingAvatar = false;
        this.avatarPreview = null;
        Swal.fire({ icon: 'success', title: 'Profile picture updated!', timer: 1200, showConfirmButton: false });
      },
      error: (err) => {
        this.uploadingAvatar = false;
        this.avatarPreview = null;
        Swal.fire('Error', err?.error?.message || 'Failed to upload profile picture.', 'error');
      },
    });
    input.value = '';
  }

  saveInfo(): void {
    if (this.infoForm.invalid) {
      this.infoForm.markAllAsTouched();
      return;
    }
    this.savingInfo = true;
    this.auth.updateProfile(this.infoForm.value).subscribe({
      next: () => {
        this.savingInfo = false;
        Swal.fire({ icon: 'success', title: 'Profile updated!', timer: 1200, showConfirmButton: false });
      },
      error: (err) => {
        this.savingInfo = false;
        Swal.fire('Error', err?.error?.message || 'Failed to update profile.', 'error');
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      Swal.fire('Error', 'New password and confirmation do not match.', 'error');
      return;
    }

    this.savingPassword = true;
    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.savingPassword = false;
        this.passwordForm.reset();
        Swal.fire({ icon: 'success', title: 'Password changed successfully!', timer: 1500, showConfirmButton: false });
      },
      error: (err) => {
        this.savingPassword = false;
        Swal.fire('Error', err?.error?.message || 'Failed to change password.', 'error');
      },
    });
  }
}
