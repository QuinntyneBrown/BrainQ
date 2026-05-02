import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BqSearchBar } from './search-bar';

@Component({
  selector: 'bq-host',
  imports: [BqSearchBar],
  template: `<bq-search-bar [autofocus]="auto()" placeholder="x" />`,
})
class Host {
  readonly auto = signal(true);
}

describe('BqSearchBar — autofocus (bug 0008)', () => {
  it('imperatively focuses the input when autofocus is true', async () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input.input') as HTMLInputElement;
    expect(document.activeElement).toBe(input);
  });

  it('does not steal focus when autofocus is false', async () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.auto.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input.input') as HTMLInputElement;
    expect(document.activeElement).not.toBe(input);
  });
});
