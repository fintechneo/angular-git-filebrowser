import { Directive } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material';

@Directive({
    selector: '[appSidenavSmallWidthAutoAdjust]'
})
export class SidenavSmallWidthAutoAdjustDirective {

    constructor(
        sidenav: MatSidenav,
        breakpointobserver: BreakpointObserver) {
        breakpointobserver.observe(
            '(max-width: 599px)'
        ).subscribe(state => {
            if (state.matches) {
                if (sidenav.mode === 'side' && sidenav.opened) {
                    sidenav.close();
                }
                sidenav.mode = 'over';
            } else {
                sidenav.mode = 'side';
                if (!sidenav.opened) {
                    sidenav.open();
                }
            }

        });

    }
}
