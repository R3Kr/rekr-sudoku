import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import "./Sudoku.css";

type Cell = {
  value: number | Set<number>;
  static: boolean;
  draft: boolean;
};

export default function Sudoku() {
  const [mousedown, setMousedown] = useState(false);
  const [shift, setShift] = useState(false);
  const [cells, setCells] = useState<Cell[]>(
    Array(81)
      .fill(0)
      .map((v) => {
        if (Math.random() < 0.3) {
          return {
            value: Math.floor(Math.random() * 9 + 1),
            static: true,
            draft: false,
          };
        }
        return {
          value: v,
          static: false,
          draft: false,
        };
      })
  );
  const [markedCells, setMarkedCells] = useState<boolean[]>(
    Array(81).fill(false)
  );
  const [draftMode, setDraftMode] = useState(false);

  const beforeArrowMoveMark = useRef<boolean[] | null>();
  const curserindex = useRef<number>();

  useEffect(() => {
    document.onkeyup = (ev) => {
      if (ev.key === "Shift") {
        setShift(false);
      }
    };
    document.onkeydown = (ev) => {
      if (ev.key === "Shift" && !ev.repeat) {
        setShift(true);
        return;
      }
      if (ev.key === " ") {
        setDraftMode((mode) => !mode);
        return;
      }
      if (ev.key.includes("Arrow")) {
        //abs so always an index is picked
        const markIndex = Math.min(
          80,
          Math.max(
            0,
            curserindex.current !== undefined
              ? curserindex.current
              : markedCells.findIndex((v) => v)
          )
        );
        setMarkedCells((oldMarked) => {
          if (!beforeArrowMoveMark.current) {
            beforeArrowMoveMark.current = oldMarked;
          }
          const newMarked = [...oldMarked];
          if (!shift) {
            //newMarked[markIndex] = false;
            newMarked.fill(false);
          }
          curserindex.current =
            ev.key === "ArrowLeft"
              ? markIndex - 1
              : ev.key === "ArrowRight"
              ? markIndex + 1
              : ev.key === "ArrowUp"
              ? markIndex - 9
              : markIndex + 9;
          newMarked[curserindex.current] = true;
          return newMarked;
        });
      }

      const num = Number.parseInt(ev.key);
      if (num >= 0 && num <= 9) {
        setCells((oldCells) =>
          oldCells.map((v, i) => {
            if (!v.static && markedCells[i]) {
              if (draftMode) {
                const newDraftValues = new Set(
                  v.value instanceof Set ? v.value : []
                );
                newDraftValues.add(num);
                return { ...v, value: num !== 0 ? newDraftValues : new Set(), draft: true };
              }
              return { ...v, value: num, draft: false };
            }
            return v;
          })
        );
      }
    };
    document.onmousedown = (ev) => setMousedown(true);
    document.onmouseup = (ev) => setMousedown(false);
    document.onmousemove = () => {
      if (beforeArrowMoveMark.current) {
        setMarkedCells(beforeArrowMoveMark.current);
        beforeArrowMoveMark.current = null;
        curserindex.current = undefined;
      }
    };

    // Clean up function to remove event handlers
    return () => {
      document.onkeydown = null;
      document.onmousedown = null;
      document.onmouseup = null;
      document.onmousemove = null;
    };
  }, [markedCells, shift, draftMode]);

  return (
    <>
      <div class="sudoku-grid">
        {Array(9)
          .fill(0)
          .map((_, i) => (
            <div class="block">
              {Array(9)
                .fill(0)
                .map((_, i1) => (
                  <SudokuCell
                    cell={
                      cells[
                        ((i / 3) | 0) * 18 +
                          i * 3 +
                          (i1 % 3) +
                          ((i1 / 3) | 0) * 9
                      ]
                    }
                    mousepressed={mousedown}
                    marked={
                      markedCells[
                        ((i / 3) | 0) * 18 +
                          i * 3 +
                          (i1 % 3) +
                          ((i1 / 3) | 0) * 9
                      ]
                    }
                    setMarked={(marked) => {
                      setMarkedCells((oldMarkedCells) => {
                        const newMarkedCells = [...oldMarkedCells];
                        newMarkedCells[
                          ((i / 3) | 0) * 18 +
                            i * 3 +
                            (i1 % 3) +
                            ((i1 / 3) | 0) * 9
                        ] = marked;
                        return newMarkedCells;
                      });
                    }}
                    draftMode={draftMode}
                  ></SudokuCell>
                ))}
            </div>
          ))}
      </div>
    </>
  );
}

function SudokuCell({
  cell,
  mousepressed,
  marked,
  setMarked,
  draftMode,
}: {
  cell: Cell;
  marked: boolean;
  setMarked: (marked: boolean) => void;
  mousepressed: boolean;

  draftMode: boolean;
}) {
  const divref = useRef<HTMLDivElement>(null);

  const mouseover = useCallback((ev: MouseEvent) => {
    setMarked(true);
  }, []);
  //jag är genious
  const mouseleave = useCallback(
    (ev: MouseEvent) => {
      //medvetet stale clojure
      if (!marked && !mousepressed) {
        setMarked(false);
      }
    },
    [mousepressed]
  );
  useEffect(() => {
    //unmark cellswhen mouse is pressed
    if (mousepressed) {
      setMarked(false);
    }
    if (divref.current) {
      divref.current.onmousemove = mouseover;
      divref.current.onmouseout = mouseleave;
    }
  }, [divref.current, mousepressed]);
  return (
    <div
      ref={divref}
      class={`cell select-none ${cell.draft ? "text-2xl" : "text-4xl"} ${
        !cell.static ? (cell.draft ? "opacity-50" : "opacity-70") : ""
      } ${marked ? (draftMode ? "bg-amber-300" : "bg-cyan-500") : ""}`}
    >
      {!cell.draft
        ? cell.value === 0
          ? ""
          : cell.value
        : (cell.value as Set<number>).size === 0
        ? ""
        : [...(cell.value as Set<number>)].join()}
    </div>
  );
}
