/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Direction, Directionality } from '@angular/cdk/bidi';
import {
  ComponentRef,
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  Renderer2,
  SimpleChanges,
  ViewContainerRef,
  booleanAttribute,
  computed,
  inject,
  signal
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';

import { NzFormItemFeedbackIconComponent, NzFormNoStatusService, NzFormStatusService } from 'ng-zorro-antd/core/form';
import { NzDestroyService } from 'ng-zorro-antd/core/services';
import { NgClassInterface, NzSizeLDSType, NzStatus, NzValidateStatus, NzVariant } from 'ng-zorro-antd/core/types';
import { getStatusClassNames } from 'ng-zorro-antd/core/util';
import { NZ_SPACE_COMPACT_ITEM_TYPE, NZ_SPACE_COMPACT_SIZE, NzSpaceCompactItemDirective } from 'ng-zorro-antd/space';

@Directive({
  selector: 'input[nz-input],textarea[nz-input]',
  exportAs: 'nzInput',
  host: {
    class: 'ant-input',
    '[class.ant-input-disabled]': 'disabled',
    '[class.ant-input-borderless]': `nzVariant === 'borderless' || (nzVariant === 'outlined' && nzBorderless)`,
    '[class.ant-input-filled]': `nzVariant === 'filled'`,
    '[class.ant-input-underlined]': `nzVariant === 'underlined'`,
    '[class.ant-input-lg]': `finalSize() === 'large'`,
    '[class.ant-input-sm]': `finalSize() === 'small'`,
    '[attr.disabled]': 'disabled || null',
    '[class.ant-input-rtl]': `dir=== 'rtl'`,
    '[class.ant-input-stepperless]': `nzStepperless`
  },
  hostDirectives: [NzSpaceCompactItemDirective],
  providers: [NzDestroyService, { provide: NZ_SPACE_COMPACT_ITEM_TYPE, useValue: 'input' }]
})
export class NzInputDirective implements OnChanges, OnInit {
  /**
   * @deprecated Will be removed in v21. It is recommended to use `nzVariant` instead.
   */
  @Input({ transform: booleanAttribute }) nzBorderless = false;
  @Input() nzVariant: NzVariant = 'outlined';
  @Input() nzSize: NzSizeLDSType = 'default';
  @Input({ transform: booleanAttribute }) nzStepperless: boolean = true;
  @Input() nzStatus: NzStatus = '';
  @Input({ transform: booleanAttribute })
  get disabled(): boolean {
    if (this.ngControl && this.ngControl.disabled !== null) {
      return this.ngControl.disabled;
    }
    return this._disabled;
  }
  set disabled(value: boolean) {
    this._disabled = value;
  }
  _disabled = false;
  disabled$ = new Subject<boolean>();

  dir: Direction = 'ltr';
  // status
  prefixCls: string = 'ant-input';
  status: NzValidateStatus = '';
  statusCls: NgClassInterface = {};
  hasFeedback: boolean = false;
  feedbackRef: ComponentRef<NzFormItemFeedbackIconComponent> | null = null;
  components: Array<ComponentRef<NzFormItemFeedbackIconComponent>> = [];
  ngControl = inject(NgControl, { self: true, optional: true });

  protected finalSize = computed(() => {
    if (this.compactSize) {
      return this.compactSize();
    }
    return this.size();
  });

  private size = signal<NzSizeLDSType>(this.nzSize);
  private compactSize = inject(NZ_SPACE_COMPACT_SIZE, { optional: true });
  private destroy$ = inject(NzDestroyService);
  private nzFormStatusService = inject(NzFormStatusService, { optional: true });
  private nzFormNoStatusService = inject(NzFormNoStatusService, { optional: true });

  constructor(
    private renderer: Renderer2,
    private elementRef: ElementRef,
    protected hostView: ViewContainerRef,
    private directionality: Directionality
  ) {}

  ngOnInit(): void {
    this.nzFormStatusService?.formStatusChanges
      .pipe(
        distinctUntilChanged((pre, cur) => {
          return pre.status === cur.status && pre.hasFeedback === cur.hasFeedback;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(({ status, hasFeedback }) => {
        this.setStatusStyles(status, hasFeedback);
      });

    if (this.ngControl) {
      this.ngControl.statusChanges
        ?.pipe(
          filter(() => this.ngControl!.disabled !== null),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.disabled$.next(this.ngControl!.disabled!);
        });
    }

    this.dir = this.directionality.value;
    this.directionality.change?.pipe(takeUntil(this.destroy$)).subscribe((direction: Direction) => {
      this.dir = direction;
    });
  }

  ngOnChanges({ disabled, nzStatus, nzSize }: SimpleChanges): void {
    if (disabled) {
      this.disabled$.next(this.disabled);
    }
    if (nzStatus) {
      this.setStatusStyles(this.nzStatus, this.hasFeedback);
    }
    if (nzSize) {
      this.size.set(nzSize.currentValue);
    }
  }

  private setStatusStyles(status: NzValidateStatus, hasFeedback: boolean): void {
    // set inner status
    this.status = status;
    this.hasFeedback = hasFeedback;
    this.renderFeedbackIcon();
    // render status if nzStatus is set
    this.statusCls = getStatusClassNames(this.prefixCls, status, hasFeedback);
    Object.keys(this.statusCls).forEach(status => {
      if (this.statusCls[status]) {
        this.renderer.addClass(this.elementRef.nativeElement, status);
      } else {
        this.renderer.removeClass(this.elementRef.nativeElement, status);
      }
    });
  }

  private renderFeedbackIcon(): void {
    if (!this.status || !this.hasFeedback || !!this.nzFormNoStatusService) {
      // remove feedback
      this.hostView.clear();
      this.feedbackRef = null;
      return;
    }

    this.feedbackRef = this.feedbackRef || this.hostView.createComponent(NzFormItemFeedbackIconComponent);
    this.feedbackRef.location.nativeElement.classList.add('ant-input-suffix');
    this.feedbackRef.instance.status = this.status;
    this.feedbackRef.instance.updateIcon();
  }
}
