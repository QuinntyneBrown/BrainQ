import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BqEntityType, BqTypeGlyph } from './type-glyph';

@Component({
  selector: 'bq-glyph-host',
  imports: [BqTypeGlyph],
  template: `<bq-type-glyph [type]="type()" />`,
})
class Host {
  readonly type = signal<BqEntityType>('Note');
}

const TYPES: BqEntityType[] = ['Person', 'Project', 'Commitment', 'Note', 'Idea'];

describe('BqTypeGlyph — non-empty distinct glyph per type (bug 0009)', () => {
  it.each(TYPES)('renders at least one SVG primitive for type %s', (t) => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.type.set(t);
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg).toBeTruthy();
    const primitives = svg.querySelectorAll('path, circle, rect');
    expect(primitives.length).toBeGreaterThan(0);
  });
});
