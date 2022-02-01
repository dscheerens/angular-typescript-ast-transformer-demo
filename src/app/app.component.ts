import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
    public readonly title = '<<<package.name>>>';
    public readonly version = '<<<package.version>>>';
    public readonly buildDate = '<<<build.timestamp>>>';

    public ngOnInit(): void {
        console.log('5 + 3 =', 5 + 3);
    }

    public testTypeGuards(): void {
        const value = Math.random() < 0.5 ? Math.PI : ['p', 'i'].join('');

        if (is<string>(value)) {
            console.log('got string:', value);
        }
        if (is<string>(value)) {
            console.log('got anonther string:', value);
        }
        if (is<number>(value)) {
            console.log('got number:', value);
        }
        if (is<boolean>(value)) {
            console.log('got boolean:', value);
        }
        if (is<Foo>(value)) {
            console.log('got foo:', value);
        }
        if (is<Foo[]>(value)) {
            console.log('got foo array:', value);
        }
        if (is<SomeThingElse>(value)) {
            console.log('got SomeThingElse:', value);
        }
        if (is<A & B>(value)) {
            console.log('got A & B:', value);
        }
        if (is<C>(value)) {
            console.log('got C:', value);
        }

        console.log([4, true, '5234'].filter(is<string | number>()));
        console.log([5, false, '987'].filter(is<number | string>()));
    }
}

function is<T>(value: unknown): value is T;
function is<T>(): (value: unknown) => value is T;
function is(): never {
    throw new Error('not implemented!'); // calls to this functions are rewritten!
}

interface Foo {
    bar: string;
    baz: number | boolean;
}

type SomeThingElse = {
    prop1: Foo;
    prop2: -42e299;
};

type A = { a: string };
type B = { b: number };
type C = A & B;
