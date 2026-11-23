import { boxUnit, colUnit, rowUnit } from '../grid';
import { TECHNIQUES } from '../solver/techniques';
import type { CellIndex, CellRole, Digit, SolverState, Step, TechniqueId, Unit } from '../types';
import { cellRef, cellsRef, describeEliminations, joinAnd, unitGen, unitLoc, unitNom } from './text';

export interface StepText {
  techniqueName: string;
  /** Razina 1: gdje gledati, bez imena tehnike. */
  level1: string;
  /** Razina 2: ime tehnike i opis uzorka. */
  level2: string;
  /** Oznake uloga za legendu na razini 2 (npr. pivot → "središte"). */
  roles: Partial<Record<CellRole, string>>;
  /** Razina 3: objašnjenje korak po korak. */
  steps: string[];
  /** Što se upisuje ili briše. */
  result: string;
}

export const techniqueName = (id: TechniqueId): string => TECHNIQUES.find((t) => t.id === id)?.name ?? id;

/** Zašto znamenka d ne može biti u ćeliji (upisani brojevi u redu/stupcu/kvadratu). */
function blocker(s: SolverState, cell: CellIndex, d: Digit): Unit | null {
  for (const u of [rowUnit(cell), colUnit(cell), boxUnit(cell)]) {
    if (u.cells.some((c) => s.values[c] === d)) return u;
  }
  return null;
}

function resultText(step: Step): string {
  if (step.placement) return `Upiši ${step.placement.digit} u ćeliju ${cellRef(step.placement.cell)}.`;
  return describeEliminations(step.eliminations);
}

const lookArea = (step: Step): string => {
  const parts: string[] = [];
  if (step.focus.units.length) parts.push(`Pogledaj ${joinAnd(step.focus.units.map(unitNom))}.`);
  if (step.focus.cells.length)
    parts.push(
      step.focus.cells.length === 1
        ? `Pogledaj ćeliju ${cellRef(step.focus.cells[0])}.`
        : `Pogledaj ćelije ${cellsRef(step.focus.cells)}.`,
    );
  if (step.focus.digit) parts.push(`Obrati pažnju na broj ${step.focus.digit}.`);
  return parts.join(' ');
};

const ELIM_HINT = 'Ovdje se može obrisati barem jedan kandidat.';

export function explainStep(step: Step, s: SolverState): StepText {
  const name = techniqueName(step.technique);
  const ex = step.explanation;
  const result = resultText(step);
  const base = { techniqueName: name, result };

  switch (ex.kind) {
    case 'nakedSingle': {
      const groups = new Map<string, { unit: Unit; digits: Digit[] }>();
      const erased: Digit[] = [];
      for (let d = 1 as Digit; d <= 9; d = (d + 1) as Digit) {
        if (d === ex.digit) continue;
        const u = blocker(s, ex.cell, d);
        if (!u) {
          erased.push(d);
          continue;
        }
        const key = `${u.type}${u.index}`;
        groups.set(key, { unit: u, digits: [...(groups.get(key)?.digits ?? []), d] });
      }
      const steps = [...groups.values()].map(
        ({ unit, digits }) =>
          `${unitLoc(unit).replace(/^u/, 'U')} ${digits.length === 1 ? 'već je' : 'već su'} ${joinAnd(digits)}.`,
      );
      if (erased.length) {
        steps.push(`${erased.length === 1 ? 'Kandidat' : 'Kandidati'} ${joinAnd(erased)} ${erased.length === 1 ? 'obrisan je' : 'obrisani su'} ranijim koracima.`);
      }
      steps.push(`Za ćeliju ${cellRef(ex.cell)} ostaje samo broj ${ex.digit}.`);
      return {
        ...base,
        level1: `Pogledaj ćeliju ${cellRef(ex.cell)} — koji sve brojevi ondje mogu doći?`,
        level2: `${name}: ćelija ${cellRef(ex.cell)} ima samo jednog kandidata.`,
        roles: { target: 'ćelija' },
        steps,
      };
    }

    case 'hiddenSingle': {
      const groups = new Map<string, { reason: string; cells: CellIndex[] }>();
      for (const c of ex.unit.cells) {
        if (c === ex.cell || s.values[c]) continue;
        const u = blocker(s, c, ex.digit);
        const reason = u ? `jer je ${ex.digit} već ${unitLoc(u)}` : `jer je ${ex.digit} ondje obrisan ranijim koracima`;
        groups.set(reason, { reason, cells: [...(groups.get(reason)?.cells ?? []), c] });
      }
      const steps = [`Gledamo gdje sve ${unitLoc(ex.unit)} može doći broj ${ex.digit}.`];
      for (const g of groups.values()) {
        steps.push(`${g.cells.length === 1 ? 'Ćelija' : 'Ćelije'} ${cellsRef(g.cells)} ${g.cells.length === 1 ? 'otpada' : 'otpadaju'} ${g.reason}.`);
      }
      steps.push(`Ostaje samo ćelija ${cellRef(ex.cell)}, pa ondje mora biti ${ex.digit}.`);
      return {
        ...base,
        level1: `${lookArea(step)} Neki broj ovdje ima samo jedno moguće mjesto.`,
        level2: `${name}: ${unitLoc(ex.unit)} broj ${ex.digit} ima samo jedno mjesto.`,
        roles: { target: 'jedino mjesto' },
        steps,
      };
    }

    case 'pointing':
      return {
        ...base,
        level1: `${lookArea(step)} ${ELIM_HINT}`,
        level2: `${name}: ${unitLoc(ex.box)} broj ${ex.digit} je zatvoren u ${unitNom(ex.line)}.`,
        roles: { base: `mjesta za ${ex.digit}` },
        steps: [
          `${unitLoc(ex.box).replace(/^u/, 'U')} broj ${ex.digit} može doći samo u ${cellsRef(ex.cells)}.`,
          `Sve te ćelije su ${unitLoc(ex.line)}.`,
          `Dakle, ${ex.digit} ${unitLoc(ex.line)} sigurno je unutar ${unitGen(ex.box)} — ne zna se još gdje točno.`,
          `Zato ${ex.digit} ne može biti nigdje drugdje ${unitLoc(ex.line)}.`,
        ],
      };

    case 'boxLine':
      return {
        ...base,
        level1: `${lookArea(step)} ${ELIM_HINT}`,
        level2: `${name}: ${unitLoc(ex.line)} broj ${ex.digit} može biti samo unutar ${unitGen(ex.box)}.`,
        roles: { base: `mjesta za ${ex.digit}` },
        steps: [
          `${unitLoc(ex.line).replace(/^u/, 'U')} broj ${ex.digit} može doći samo u ${cellsRef(ex.cells)}.`,
          `Sve te ćelije su ${unitLoc(ex.box)}.`,
          `Dakle, ${ex.digit} ${unitLoc(ex.box)} mora biti baš u jednoj od tih ćelija (${unitLoc(ex.line)}).`,
          `Zato ${ex.digit} ne može biti u ostalim ćelijama ${unitGen(ex.box)}.`,
        ],
      };

    case 'nakedSubset': {
      const n = ex.size === 2 ? 'dvije' : 'tri';
      const what = ex.size === 2 ? 'ta dva broja' : 'ta tri broja';
      return {
        ...base,
        level1: `${lookArea(step)} ${ELIM_HINT}`,
        level2: `${name}: ${unitLoc(ex.unit)} ${n} ćelije imaju zajedno samo brojeve ${joinAnd(ex.digits)}.`,
        roles: { base: ex.size === 2 ? 'par' : 'trojka' },
        steps: [
          `${unitLoc(ex.unit).replace(/^u/, 'U')} ćelije ${cellsRef(ex.cells)} zajedno imaju samo kandidate ${joinAnd(ex.digits)}.`,
          `${n[0].toUpperCase()}${n.slice(1)} ćelije, ${what} — svaka od tih ćelija mora dobiti jedan od njih (ne zna se još kojim redom).`,
          `Zato ${what} ne mogu biti ni u jednoj drugoj ćeliji ${unitGen(ex.unit)}.`,
        ],
      };
    }

    case 'hiddenSubset': {
      const what = ex.size === 2 ? 'ta dva broja' : 'ta tri broja';
      const where = ex.size === 2 ? 'te dvije ćelije' : 'te tri ćelije';
      return {
        ...base,
        level1: `${lookArea(step)} ${ELIM_HINT}`,
        level2: `${name}: ${unitLoc(ex.unit)} brojevi ${joinAnd(ex.digits)} imaju ista ${ex.size === 2 ? 'dva' : 'tri'} moguća mjesta.`,
        roles: { base: ex.size === 2 ? 'skriveni par' : 'skrivena trojka' },
        steps: [
          `${unitLoc(ex.unit).replace(/^u/, 'U')} brojevi ${joinAnd(ex.digits)} mogu doći samo u ${cellsRef(ex.cells)}.`,
          `${what[0].toUpperCase()}${what.slice(1)} moraju zauzeti upravo ${where}.`,
          `Zato u ${where} nema mjesta ni za jedan drugi broj — ostali kandidati se brišu.`,
        ],
      };
    }

    case 'fish': {
      const d = ex.digit;
      const isRow = ex.baseUnits[0].type === 'row';
      const covers = joinAnd(ex.coverUnits.map(unitNom));
      const lines = ex.baseUnits.map((u) => {
        const cells = ex.cells.filter((c) => u.cells.includes(c));
        return `${unitLoc(u).replace(/^u/, 'U')} broj ${d} može biti samo u ${cellsRef(cells)}.`;
      });
      const steps =
        ex.size === 2
          ? [
              ...lines,
              `Oba ${isRow ? 'reda' : 'stupca'} imaju ${d} na istim mjestima: ${covers}.`,
              `Ako je ${d} u ${cellRef(ex.cells[0])}, onda je u ${cellRef(ex.cells[3])}; ako je u ${cellRef(ex.cells[1])}, onda je u ${cellRef(ex.cells[2])}.`,
              `U oba slučaja ${d} zauzima ${covers} upravo u ova dva ${isRow ? 'reda' : 'stupca'}.`,
              `Zato ${d} ne može biti nigdje drugdje: ${covers}.`,
            ]
          : [
              ...lines,
              `U ova tri ${isRow ? 'reda' : 'stupca'} broj ${d} može biti samo u: ${covers}.`,
              `Svaki od ta tri ${isRow ? 'reda' : 'stupca'} mora imati ${d}, i svaki ga mora smjestiti u drugi ${isRow ? 'stupac' : 'red'} (inače bi se dva ${d} vidjela).`,
              `Zato su sva tri ${isRow ? 'stupca' : 'reda'} (${covers}) već "popunjena" brojem ${d} iz ovih ${isRow ? 'redova' : 'stupaca'}.`,
              `${d} se briše iz ostalih ćelija: ${covers}.`,
            ];
      return {
        ...base,
        level1: `${lookArea(step)} ${ELIM_HINT}`,
        level2: `${name}: broj ${d} ${isRow ? 'u redovima' : 'u stupcima'} ${joinAnd(ex.baseUnits.map((u) => u.index + 1))} može biti samo ${isRow ? 'u stupcima' : 'u redovima'} ${joinAnd(ex.coverUnits.map((u) => u.index + 1))}.`,
        roles: { base: `mjesta za ${d}` },
        steps,
      };
    }

    case 'xyWing': {
      const [a, b] = ex.pincers;
      return {
        ...base,
        level1: `${lookArea(step)} ${ELIM_HINT}`,
        level2: `${name}: središte ${cellRef(ex.pivot)} {${ex.x},${ex.y}}, krakovi ${cellRef(a)} {${ex.x},${ex.z}} i ${cellRef(b)} {${ex.y},${ex.z}}.`,
        roles: { pivot: 'središte', pincer: 'krak' },
        steps: [
          `Središte ${cellRef(ex.pivot)} može biti samo ${ex.x} ili ${ex.y}.`,
          `Ako je središte ${ex.x}, onda krak ${cellRef(a)} (vidi središte) nije ${ex.x}, pa je ${ex.z}.`,
          `Ako je središte ${ex.y}, onda krak ${cellRef(b)} nije ${ex.y}, pa je ${ex.z}.`,
          `Kakogod bilo, jedan od krakova sigurno je ${ex.z}.`,
          `Zato ćelija koja vidi oba kraka ne može biti ${ex.z}.`,
        ],
      };
    }

    case 'xyzWing': {
      const [a, b] = ex.pincers;
      return {
        ...base,
        level1: `${lookArea(step)} ${ELIM_HINT}`,
        level2: `${name}: središte ${cellRef(ex.pivot)} {${ex.x},${ex.y},${ex.z}}, krakovi ${cellRef(a)} {${ex.x},${ex.z}} i ${cellRef(b)} {${ex.y},${ex.z}}.`,
        roles: { pivot: 'središte', pincer: 'krak' },
        steps: [
          `Središte ${cellRef(ex.pivot)} može biti ${ex.x}, ${ex.y} ili ${ex.z}.`,
          `Ako je središte ${ex.z} — onda je ono ${ex.z}.`,
          `Ako je središte ${ex.x}, krak ${cellRef(a)} nije ${ex.x}, pa je ${ex.z}.`,
          `Ako je središte ${ex.y}, krak ${cellRef(b)} nije ${ex.y}, pa je ${ex.z}.`,
          `Dakle, jedna od te tri ćelije sigurno je ${ex.z}.`,
          `Zato ćelija koja vidi sve tri ne može biti ${ex.z}.`,
        ],
      };
    }

    case 'remotePair': {
      const [p, q] = ex.digits;
      const chain = ex.chain;
      const alt = chain.map((c, k) => `${cellRef(c)} = ${k % 2 === 0 ? p : q}`).join(', ');
      return {
        ...base,
        level1: `${lookArea(step)} ${ELIM_HINT}`,
        level2: `${name}: lanac od ${chain.length} ćelija s istim parom {${p},${q}}.`,
        roles: { colorA: 'jedna vrijednost', colorB: 'druga vrijednost' },
        steps: [
          `Ćelije ${cellsRef(chain)} imaju samo kandidate ${p} i ${q}, a svaka vidi sljedeću u lancu.`,
          `Zato se vrijednosti u lancu izmjenjuju. Ako je prva ${p}: ${alt}.`,
          `(Ako je prva ${q}, sve je obrnuto.)`,
          `Krajevi ${cellRef(chain[0])} i ${cellRef(chain[chain.length - 1])} su uvijek različiti: jedan je ${p}, drugi ${q}.`,
          `Zato ćelija koja vidi oba kraja ne može biti ni ${p} ni ${q}.`,
        ],
      };
    }

    case 'wWing': {
      const [a, b] = ex.cells;
      const [l1, l2] = ex.link;
      return {
        ...base,
        level1: `${lookArea(step)} ${ELIM_HINT}`,
        level2: `${name}: ćelije ${cellRef(a)} i ${cellRef(b)} {${ex.x},${ex.y}} povezane jakom vezom na ${ex.x} ${unitLoc(ex.linkUnit)}.`,
        roles: { pincer: `ćelije {${ex.x},${ex.y}}`, link: `jaka veza na ${ex.x}` },
        steps: [
          `Ćelije ${cellRef(a)} i ${cellRef(b)} imaju samo kandidate ${ex.x} i ${ex.y}.`,
          `${unitLoc(ex.linkUnit).replace(/^u/, 'U')} broj ${ex.x} može biti samo u ${cellRef(l1)} ili ${cellRef(l2)}.`,
          `${cellRef(l1)} vidi ${cellRef(a)}, a ${cellRef(l2)} vidi ${cellRef(b)}.`,
          `Kad bi obje ćelije bile ${ex.x}, ni ${cellRef(l1)} ni ${cellRef(l2)} ne bi mogle biti ${ex.x}, pa ${ex.x} ${unitLoc(ex.linkUnit)} ne bi imao mjesta.`,
          `Dakle, barem jedna od ćelija ${cellRef(a)} i ${cellRef(b)} je ${ex.y}.`,
          `Zato ćelija koja vidi obje ne može biti ${ex.y}.`,
        ],
      };
    }

    case 'skyscraper': {
      const d = ex.digit;
      const [l1, l2] = ex.lines;
      const [b1, b2] = ex.base;
      const [t1, t2] = ex.tops;
      return {
        ...base,
        level1: `${lookArea(step)} ${ELIM_HINT}`,
        level2: `${name}: broj ${d} ${unitLoc(l1)} i ${unitLoc(l2)} ima po dva mjesta; temelji su poravnati.`,
        roles: { base: 'temelj', pincer: 'vrh' },
        steps: [
          `${unitLoc(l1).replace(/^u/, 'U')} broj ${d} može biti samo u ${cellRef(b1)} ili ${cellRef(t1)}.`,
          `${unitLoc(l2).replace(/^u/, 'U')} broj ${d} može biti samo u ${cellRef(b2)} ili ${cellRef(t2)}.`,
          `Temelji ${cellRef(b1)} i ${cellRef(b2)} se vide, pa najviše jedan od njih može biti ${d}.`,
          `Ako ${cellRef(b1)} nije ${d}, onda je ${cellRef(t1)} = ${d}. Ako ${cellRef(b2)} nije ${d}, onda je ${cellRef(t2)} = ${d}.`,
          `Dakle, barem jedan vrh je ${d}.`,
          `Zato ćelija koja vidi oba vrha ne može biti ${d}.`,
        ],
      };
    }

    case 'xyChain': {
      const z = ex.z;
      const c = ex.chain;
      const steps = [`Pretpostavimo da početak ${cellRef(c[0].cell)} NIJE ${z}. Onda je ${c[0].value}.`];
      for (let k = 1; k < c.length; k++) {
        steps.push(
          `Tada ${cellRef(c[k].cell)} (vidi prethodnu) nije ${c[k - 1].value}, pa je ${c[k].value}.`,
        );
      }
      steps.push(
        `Dakle, ako početak nije ${z}, kraj ${cellRef(c[c.length - 1].cell)} jest ${z}. Jedan od krajeva sigurno je ${z}.`,
        `Zato ćelija koja vidi oba kraja ne može biti ${z}.`,
      );
      return {
        ...base,
        level1: `${lookArea(step)} ${ELIM_HINT}`,
        level2: `${name}: lanac od ${c.length} ćelija s po dva kandidata; krajevi mogu biti ${z}.`,
        roles: { pincer: 'kraj lanca', link: 'lanac' },
        steps,
      };
    }

    case 'simpleColoring': {
      const d = ex.digit;
      const steps = [
        `Gledamo samo broj ${d}. Gdje u nekom redu, stupcu ili kvadratu ${d} ima točno dva mjesta, jedno od njih sigurno je ${d} (jaka veza).`,
        `Spojimo takve parove u lanac i bojimo naizmjence: plavo ${cellsRef(ex.colorA)}, narančasto ${cellsRef(ex.colorB)}.`,
        `Ili su sve plave ćelije ${d}, ili sve narančaste — samo još ne znamo koje.`,
      ];
      if (ex.rule === 'wrap' && ex.clash) {
        const color = ex.colorA.includes(ex.clash[0]) ? 'plave' : 'narančaste';
        steps.push(
          `Ćelije ${cellRef(ex.clash[0])} i ${cellRef(ex.clash[1])} su obje ${color} i vide se — ne mogu obje biti ${d}.`,
          `Zato ${color} ćelije nisu ${d}: ${d} se briše iz svih ${color === 'plave' ? 'plavih' : 'narančastih'} ćelija.`,
        );
      } else {
        steps.push(
          `Neke ćelije vide i plavu i narančastu ćeliju. Jedna od te dvije sigurno je ${d}.`,
          `Zato takva ćelija ne može biti ${d}.`,
        );
      }
      return {
        ...base,
        level1: `${lookArea(step)} Promatraj gdje sve može biti taj broj. ${ELIM_HINT}`,
        level2: `${name}: bojanje broja ${d} kroz lanac jakih veza (${ex.rule === 'wrap' ? 'dvije iste boje se vide' : 'ćelija vidi obje boje'}).`,
        roles: { colorA: 'plava', colorB: 'narančasta' },
        steps,
      };
    }
  }
}
