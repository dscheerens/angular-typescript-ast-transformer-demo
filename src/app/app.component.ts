import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
    public readonly title = '<<<package.name>>>';
    public readonly version = '<<<package.version>>>';
    public readonly buildDate = '<<<build.timestamp>>>';
}
