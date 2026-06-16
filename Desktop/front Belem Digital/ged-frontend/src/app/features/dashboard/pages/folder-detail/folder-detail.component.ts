import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentService, Folder } from 'src/app/core/services/document.service';

@Component({
  selector: 'app-folder-detail',
  templateUrl: './folder-detail.component.html',
  styleUrls: ['./folder-detail.component.scss']
})
export class FolderDetailComponent implements OnInit {
  folder: Folder | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentService: DocumentService
  ) {}

  ngOnInit(): void {
    // Pega o ID da rota e converte para número
    const folderId = Number(this.route.snapshot.paramMap.get('id'));
    this.folder = this.documentService.getFolderById(folderId);

    // Se a pasta não existir, volta para o dashboard
    if (!this.folder) {
      this.goBack();
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}