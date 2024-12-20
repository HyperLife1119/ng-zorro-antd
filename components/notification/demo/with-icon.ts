import { Component } from '@angular/core';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'nz-demo-notification-with-icon',
  imports: [NzButtonModule],
  template: `
    <button nz-button (click)="createNotification('success')">Success</button>
    <button nz-button (click)="createNotification('info')">Info</button>
    <button nz-button (click)="createNotification('warning')">Warning</button>
    <button nz-button (click)="createNotification('error')">Error</button>
  `,
  styles: [
    `
      button {
        margin-right: 1em;
      }
    `
  ]
})
export class NzDemoNotificationWithIconComponent {
  constructor(private notification: NzNotificationService) {}

  createNotification(type: string): void {
    this.notification.create(
      type,
      'Notification Title',
      'This is the content of the notification. This is the content of the notification. This is the content of the notification.'
    );
  }
}
