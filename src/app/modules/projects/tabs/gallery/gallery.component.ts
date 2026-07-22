import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MediaService } from '../../../../core/services/domain.services';
import { MediaLibraryModalComponent } from '../../../../shared/components/media-library-modal/media-library-modal.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule, MediaLibraryModalComponent],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css']
})
export class GalleryComponent implements OnInit {
  projectId: string = '';
  galleryItems: any[] = [];
  loading: boolean = false;
  showMediaModal: boolean = false;

  // Lightbox properties
  activeLightboxIndex: number | null = null;

  constructor(
    private route: ActivatedRoute,
    public mediaSvc: MediaService
  ) {}

  ngOnInit(): void {
    // Parent route contains the project ID (projects/:id)
    this.route.parent?.params.subscribe(params => {
      this.projectId = params['id'];
      if (this.projectId) {
        this.loadGallery();
      }
    });
  }

  loadGallery(): void {
    this.loading = true;
    this.mediaSvc.getProjectGallery(this.projectId).subscribe({
      next: (res: any) => {
        this.galleryItems = res?.data?.items || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load gallery', err);
        this.loading = false;
      }
    });
  }

  onMediaSelected(mediaItems: any[]): void {
    this.showMediaModal = false;
    if (!mediaItems.length) return;

    this.loading = true;
    let pending = mediaItems.length;

    mediaItems.forEach(item => {
      this.mediaSvc.addGalleryItem(this.projectId, { mediaId: item.id }).subscribe({
        next: () => {
          pending--;
          if (pending === 0) {
            this.loadGallery();
            Swal.fire({ icon: 'success', title: 'Added to project gallery!', timer: 1500, showConfirmButton: false });
          }
        },
        error: (err) => {
          pending--;
          if (pending === 0) this.loadGallery();
          console.error(err);
        }
      });
    });
  }

  updateCaption(item: any): void {
    this.mediaSvc.updateGalleryItem(this.projectId, item.id, { caption: item.caption }).subscribe({
      next: () => {
        // Silent success, maybe show toast if desired
      },
      error: (err) => {
        console.error('Failed to update caption', err);
      }
    });
  }

  removePhoto(item: any): void {
    Swal.fire({
      title: 'Remove photo?',
      text: 'Remove this photo from the project gallery? It will remain in the Media Library.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, remove'
    }).then(result => {
      if (result.isConfirmed) {
        this.mediaSvc.removeGalleryItem(this.projectId, item.id).subscribe({
          next: () => {
            this.loadGallery();
            Swal.fire({ icon: 'success', title: 'Removed!', timer: 1200, showConfirmButton: false });
          },
          error: (err) => {
            Swal.fire('Error', err?.error?.message || 'Failed to remove.', 'error');
          }
        });
      }
    });
  }

  // Directional shift sorting
  moveItem(index: number, direction: 'left' | 'right'): void {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= this.galleryItems.length) return;

    // Swap items locally
    const temp = this.galleryItems[index];
    this.galleryItems[index] = this.galleryItems[targetIdx];
    this.galleryItems[targetIdx] = temp;

    // Build ordering payload based on new array order
    const payload = this.galleryItems.map((item, idx) => ({
      id: item.id,
      displayOrder: idx
    }));

    this.mediaSvc.reorderGallery(this.projectId, payload).subscribe({
      next: () => this.loadGallery(),
      error: (err) => {
        console.error('Failed to save sort order', err);
        this.loadGallery();
      }
    });
  }

  // Lightbox view helpers
  openLightbox(index: number): void {
    this.activeLightboxIndex = index;
  }

  closeLightbox(): void {
    this.activeLightboxIndex = null;
  }

  prevImage(event: MouseEvent): void {
    event.stopPropagation();
    if (this.activeLightboxIndex !== null && this.activeLightboxIndex > 0) {
      this.activeLightboxIndex--;
    } else {
      this.activeLightboxIndex = this.galleryItems.length - 1; // loop around
    }
  }

  nextImage(event: MouseEvent): void {
    event.stopPropagation();
    if (this.activeLightboxIndex !== null && this.activeLightboxIndex < this.galleryItems.length - 1) {
      this.activeLightboxIndex++;
    } else {
      this.activeLightboxIndex = 0; // loop around
    }
  }
}
