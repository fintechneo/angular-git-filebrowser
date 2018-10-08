import { NgModule } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { SidenavSmallWidthAutoAdjustDirective } from './sidenavsmallwidthautoadjust.directive';

@NgModule({
    declarations: [
        SidenavSmallWidthAutoAdjustDirective
    ],
    exports: [
        SidenavSmallWidthAutoAdjustDirective
    ]
})
export class LayoutHelperModule {
    constructor(
        private breakpointobserver: BreakpointObserver
    ) {
    }
}
