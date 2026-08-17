import { useEffect, useRef } from 'react';
import { useSeason } from '../context/SeasonContext';
import { formatDate, roundStatus, todayISO } from '../data/domain';
import type { ViewName } from '../App';

interface Props {
  view: ViewName;
  currentRound: number;
  onOpenRound: (week: number) => void;
}

export function SeasonStrip({ view, currentRound, onOpenRound }: Props) {
  const { dates, weeks } = useSeason();
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view === 'round') {
      activeRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [view, currentRound]);

  const today = todayISO();

  return (
    <div className="season-strip-wrap">
      <div className="season-strip">
        {dates.map((iso, i) => {
          const r = i + 1;
          const st = roundStatus(weeks[r]);
          const ar = weeks[r]?.assignedRound;
          const isActive = r === currentRound && view === 'round';
          return (
            <div
              key={r}
              ref={isActive ? activeRef : undefined}
              className={`chip status-${st}${isActive ? ' active' : ''}${iso === today ? ' is-today' : ''}`}
              onClick={() => onOpenRound(r)}
            >
              <div className="wk">Sem {r}</div>
              <div className="dt">{formatDate(iso)}</div>
              <div className="sorteio-tag">{ar ? `Nº ${ar}` : '?'}</div>
              <div className="dot" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
