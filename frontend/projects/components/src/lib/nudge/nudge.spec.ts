import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BqNudge } from './nudge';

@Component({
  selector: 'bq-nudge-host',
  imports: [BqNudge],
  template: `<bq-nudge text="Worth a message" (open)="opened.set(opened() + 1)" />`,
})
class Host {
  readonly opened = signal(0);
}

describe('BqNudge — keyboard accessibility (bug 0018)', () => {
  it('renders the actionable element as a <button type="button">', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const button = host.querySelector('button');
    expect(button).toBeTruthy();
    expect(button?.type).toBe('button');
    // The <li> from the previous incarnation is gone.
    expect(host.querySelector('li')).toBeNull();
  });

  it('clicking the button emits the open event', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    button.click();
    expect(fixture.componentInstance.opened()).toBe(1);
  });
});
