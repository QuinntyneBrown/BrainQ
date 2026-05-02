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
});
