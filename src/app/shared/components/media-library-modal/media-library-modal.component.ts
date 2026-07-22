import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MediaService } from '../../../core/services/domain.services';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-media-library-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './media-library-modal.component.html',
  styleUrls: ['./media-library-modal.component.css']
})
export class MediaLibraryModalComponent implements OnInit {
  @Input() multiSelect: boolean = true;
  @Input() allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  @Output() close = new EventEmitter<void>();
  @Output() select = new EventEmitter<any[]>(); // Returns array of selected Media items

  activeTab: 'upload' | 'library' = 'library';
  mediaItems: any[] = [];
  selectedItems: any[] = [];
  selectedItemForDetails: any = null;
  
  // Filtering & Pagination
  searchTerm: string = '';
  loading: boolean = false;
  uploading: boolean = false;
  page: number = 1;
  limit: number = 40;
  totalCount: number = 0;
  hasMore: boolean = false;

  dragOver: boolean = false;

  constructor(public mediaSvc: MediaService) {}

  ngOnInit(): void {
    this.loadMedia();
  }

  loadMedia(append: boolean = false): void {
    if (this.loading) return;
    this.loading = true;

    const params = {
      page: this.page,
      limit: this.limit,
      search: this.searchTerm
    };

    this.mediaSvc.list(params).subscribe({
      next: (res: any) => {
        const items = res?.data?.rows || res?.data || [];
        this.totalCount = res?.data?.count || items.length;
        
        if (append) {
          this.mediaItems = [...this.mediaItems, ...items];
        } else {
          this.mediaItems = items;
        }

        this.hasMore = this.mediaItems.length < this.totalCount;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Failed to load media', err);
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.page = 1;
    this.loadMedia(false);
  }

  loadMore(): void {
    if (this.hasMore && !this.loading) {
      this.page++;
      this.loadMedia(true);
    }
  }

  // Selection Logic
  toggleSelection(item: any, event: MouseEvent): void {
    const isSelected = this.isSelected(item);
    
    if (this.multiSelect) {
      if (isSelected) {
        this.selectedItems = this.selectedItems.filter(i => i.id !== item.id);
      } else {
        this.selectedItems.push(item);
      }
    } else {
      this.selectedItems = isSelected ? [] : [item];
    }

    // Always highlight the last clicked item for details sidebar
    this.selectedItemForDetails = isSelected ? null : item;
  }

  isSelected(item: any): boolean {
    return this.selectedItems.some(i => i.id === item.id);
  }

  // Upload Logic
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length) {
      this.uploadFiles(files);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length) {
      this.uploadFiles(files);
    }
  }

  uploadFiles(files: FileList): void {
    this.uploading = true;
    let pendingUploads = files.length;
    let duplicatesNotified = false;

    Array.from(files).forEach(file => {
      if (!this.allowedTypes.includes(file.type)) {
        Swal.fire('Error', `File type ${file.name} is not allowed. Only images are allowed.`, 'error');
        pendingUploads--;
        if (pendingUploads === 0) {
          this.uploading = false;
          this.activeTab = 'library';
          this.onSearch();
        }
        return;
      }

      const fd = new FormData();
      fd.append('file', file);

      this.mediaSvc.uploadMedia(fd).subscribe({
        next: (res: any) => {
          pendingUploads--;
          const isDuplicate = res?.data?.isDuplicate;
          const media = res?.data?.media;

          if (isDuplicate && !duplicatesNotified) {
            duplicatesNotified = true;
            // Silent notify or toast
            const Toast = Swal.mixin({
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true
            });
            Toast.fire({
              icon: 'info',
              title: 'Duplicate file automatically reused'
            });
          }

          // Pre-select the uploaded/reused media item
          if (media) {
            if (this.multiSelect) {
              if (!this.isSelected(media)) this.selectedItems.push(media);
            } else {
              this.selectedItems = [media];
            }
            this.selectedItemForDetails = media;
          }

          if (pendingUploads === 0) {
            this.uploading = false;
            this.activeTab = 'library';
            this.onSearch();
          }
        },
        error: (err: any) => {
          pendingUploads--;
          console.error('Upload failed', err);
          Swal.fire('Upload Error', err?.error?.message || 'Failed to upload image.', 'error');
          if (pendingUploads === 0) {
            this.uploading = false;
            this.activeTab = 'library';
            this.onSearch();
          }
        }
      });
    });
  }

  // Sidebar updates
  saveDetails(): void {
    if (!this.selectedItemForDetails) return;
    const item = this.selectedItemForDetails;
    
    this.mediaSvc.updateDetails(item.id, {
      title: item.title,
      altText: item.altText
    }).subscribe({
      next: (res: any) => {
        // Update in place in lists
        const idx = this.mediaItems.findIndex(i => i.id === item.id);
        if (idx !== -1) {
          this.mediaItems[idx] = res.data.media;
        }
        const selIdx = this.selectedItems.findIndex(i => i.id === item.id);
        if (selIdx !== -1) {
          this.selectedItems[selIdx] = res.data.media;
        }
      },
      error: (err: any) => console.error('Failed to update details', err)
    });
  }

  deletePermanently(): void {
    if (!this.selectedItemForDetails) return;
    const item = this.selectedItemForDetails;

    Swal.fire({
      title: 'Delete from Media Library?',
      text: `Are you sure you want to permanently delete "${item.title || item.originalName}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete permanently'
    }).then(result => {
      if (result.isConfirmed) {
        this.mediaSvc.deleteMedia(item.id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Deleted from Library', timer: 1200, showConfirmButton: false });
            this.selectedItems = this.selectedItems.filter(i => i.id !== item.id);
            this.mediaItems = this.mediaItems.filter(i => i.id !== item.id);
            this.selectedItemForDetails = null;
            this.totalCount--;
          },
          error: (err: any) => {
            Swal.fire('Delete Failed', err?.error?.message || 'Failed to delete from library.', 'error');
          }
        });
      }
    });
  }

  // Format Helper
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  confirmSelection(): void {
    if (this.selectedItems.length) {
      this.select.emit(this.selectedItems);
    }
  }

  closeModal(): void {
    this.close.emit();
  }
}
