import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { Icon } from '../icon/icon';
import { Modal } from '../modal/modal';
import { ConfirmationService } from '../../../core/services/confirmation.service';

/** Zone des messages éphémères + boîte de confirmation globale. */
@Component({
  selector: 'app-toasts',
  imports: [Icon, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toasts.html',
  styleUrl: './toasts.css'
})
export class Toasts {
  protected readonly toasts = inject(ToastService);
  protected readonly confirmation = inject(ConfirmationService);
}
