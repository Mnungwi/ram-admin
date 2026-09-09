import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, ActivatedRoute, Router } from '@angular/router';
import {
  UserService,
  ProjectService,

} from '../../../core/services/domain.services';
import { ClientService } from '../../../core/services/client.service';
import { Project } from '../../../core/models/index';
import { SelectOption } from 'src/app/shared/components/searchable-select/searchable-select.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css'],
})
export class ProjectDetailComponent implements OnInit {
  project: Project | undefined;
  projectId = '';


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientSvc: ClientService,
    private userSvc: UserService,
    private projectSvs: ProjectService,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    // this.route.params.subscribe((params) => {
    //   this.projectId = params['id'];
    //   this.project = this.data.getProject(this.projectId);
    // });
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');

      if (!id) return;

      this.projectId = id;

      // this.projectSvs.getOne(id).subscribe({
      //   next: (res: any) => {
      //     this.project = res.data ?? res;
      //   },
      //   error: (err) => console.error(err),
      // });

      this.projectSvs.getOne(id).subscribe({
        next: (res: any) => {
          this.project = res?.data?.project;
          
        },
        error: (err) => console.error(err),
      });
    });

  }

  getStatusClass(s: string): string {
    const m: any = {
      Active: 'badge-active',
      'On Hold': 'badge-on-hold',
      Completed: 'badge-completed',
      Cancelled: 'badge-overdue',
    };
    return m[s] || 'badge-pending';
  }

  getCurrentTab(): string {
    const url = this.router.url;
    const segments = url.split('/');
    return segments[segments.length - 1] || 'overview';
  }

}
