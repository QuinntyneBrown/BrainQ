import { TestBed } from '@angular/core/testing';
import { provideBrainQDomain, BRAIN_Q_DATA, BqEntity } from 'domain';
import { DetailScreen } from './detail';

describe('DetailScreen — slice 03 delete flow', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DetailScreen],
      providers: [provideBrainQDomain()],
    });
  });

  it('"Delete" calls data.removeEntity and emits back', () => {
    const data = TestBed.inject(BRAIN_Q_DATA);
    const created = data.capture({ type: 'Note', text: 'temporary thought' });

    const fixture = TestBed.createComponent(DetailScreen);
    fixture.componentRef.setInput('id', created.id);
    fixture.detectChanges();

    let backCount = 0;
    fixture.componentInstance.back.subscribe(() => backCount++);

    fixture.componentInstance.delete();
    fixture.detectChanges();

    expect(data.byId(created.id)).toBeUndefined();
    expect(backCount).toBe(1);
  });

  it('renders mentioned-by row testid keyed by source entity id', () => {
    const data = TestBed.inject(BRAIN_Q_DATA);
    const target = data.capture({ type: 'Note', text: 'target' });
    const source = data.capture({ type: 'Person', text: 'Iris Okafor' });
    data.addEdge(source.id, target.id, 'mentions');

    const fixture = TestBed.createComponent(DetailScreen);
    fixture.componentRef.setInput('id', target.id);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector(`[data-testid="brain-row-${source.id}"]`)).toBeTruthy();
  });

  it('Commitment card shows 0 (not blank) for unset streak/target (bug 0014)', () => {
    const data = TestBed.inject(BRAIN_Q_DATA);
    const c = data.capture({ type: 'Commitment', text: 'Stretch daily' });

    const fixture = TestBed.createComponent(DetailScreen);
    fixture.componentRef.setInput('id', c.id);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const numerics = Array.from(host.querySelectorAll<HTMLElement>('.bq-display-num')).map(
      (el) => el.textContent?.trim() ?? '',
    );
    // streak / today / target are the three .bq-display-num cells in the Commitment card
    expect(numerics[0]).toBe('0');
    // today cell is either '✓' or '—'
    expect(['✓', '—']).toContain(numerics[1]);
    // target should not be blank
    expect(numerics[2]).not.toBe('');
  });
});
