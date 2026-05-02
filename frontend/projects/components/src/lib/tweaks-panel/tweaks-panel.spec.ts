import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideBqTweaks } from 'domain';
import { BqTweaksPanel } from './tweaks-panel';

@Component({
  selector: 'bq-tweaks-host',
  imports: [BqTweaksPanel],
  template: `<bq-tweaks-panel #panel />`,
})
class Host {}

describe('BqTweaksPanel — outside-click dismissal (bug 0024)', () => {
  it('closes when pointerdown fires outside the wrapper', () => {
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideBqTweaks()],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const panelEl = fixture.nativeElement.querySelector('bq-tweaks-panel');
    // Reach into the BqTweaksPanel instance to flip open without a real click.
    // Easier: query the toggle button via testid and click it.
    const toggle = panelEl.querySelector('[data-testid="tweaks-toggle"]') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();

    // Verify panel is open by presence of the dialog.
    expect(panelEl.querySelector('[role="dialog"]')).toBeTruthy();

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();

    expect(panelEl.querySelector('[role="dialog"]')).toBeNull();
  });
});
