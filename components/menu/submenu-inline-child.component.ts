/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Direction, Directionality } from '@angular/cdk/bidi';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Renderer2,
  SimpleChanges,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { collapseMotion } from 'ng-zorro-antd/core/animation';
import { NzSafeAny } from 'ng-zorro-antd/core/types';

import { NzMenuModeType } from './menu.types';

@Component({
  selector: '[nz-submenu-inline-child]',
  animations: [collapseMotion],
  exportAs: 'nzSubmenuInlineChild',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-template [ngTemplateOutlet]="templateOutlet"></ng-template>`,
  host: {
    class: 'ant-menu ant-menu-inline ant-menu-sub',
    '[class.ant-menu-rtl]': `dir === 'rtl'`,
    '[@collapseMotion]': 'expandState'
  },
  imports: [NgTemplateOutlet]
})
export class NzSubmenuInlineChildComponent implements OnDestroy, OnInit, OnChanges {
  @Input() templateOutlet: TemplateRef<NzSafeAny> | null = null;
  @Input() menuClass: string = '';
  @Input() mode: NzMenuModeType = 'vertical';
  @Input() nzOpen = false;
  listOfCacheClassName: string[] = [];
  expandState = 'collapsed';
  dir: Direction = 'ltr';
  private destroy$ = new Subject<void>();

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private directionality: Directionality
  ) {}

  calcMotionState(): void {
    if (this.nzOpen) {
      this.expandState = 'expanded';
    } else {
      this.expandState = 'collapsed';
    }
  }
  ngOnInit(): void {
    this.calcMotionState();

    this.dir = this.directionality.value;
    this.directionality.change?.pipe(takeUntil(this.destroy$)).subscribe((direction: Direction) => {
      this.dir = direction;
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    const { mode, nzOpen, menuClass } = changes;
    if (mode || nzOpen) {
      this.calcMotionState();
    }
    if (menuClass) {
      if (this.listOfCacheClassName.length) {
        this.listOfCacheClassName
          .filter(item => !!item)
          .forEach(className => {
            this.renderer.removeClass(this.elementRef.nativeElement, className);
          });
      }
      if (this.menuClass) {
        this.listOfCacheClassName = this.menuClass.split(' ');
        this.listOfCacheClassName
          .filter(item => !!item)
          .forEach(className => {
            this.renderer.addClass(this.elementRef.nativeElement, className);
          });
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
