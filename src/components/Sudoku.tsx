import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import "./Sudoku.css";
import { createBoard } from "../lib/sudokuUtils";

type Cell = {
  value: number | boolean[];
  static: boolean;
  draft: boolean;
};

export default function Sudoku() {
  const [mousedown, setMousedown] = useState(false);
  const [shift, setShift] = useState(false);
  const [cells, setCells] = useState<Cell[]>(
    createBoard(0.45).map((v) => {
      if (v === 0) {
        return {
          value: 0,
          draft: false,
          static: false,
        };
      }
      return {
        value: v,
        draft: false,
        static: true,
      };
    })
  );
  const [markedCells, setMarkedCells] = useState<boolean[]>(
    Array(81).fill(false)
  );
  const [draftMode, setDraftMode] = useState(false);

  const highlighted = useMemo(() => {
    const highlighteds = new Set<number>();
    if (!draftMode) {
      for (const [index, marked] of markedCells.entries()) {
        if (!marked) continue;
        const cell = cells[index];
        if (cell.draft || cell.value === 0) continue;
        cells
          .map((c, i) => {
            return { ...c, i };
          })
          .filter((c) => c.value === cell.value)
          .forEach((c) => highlighteds.add(c.i));
      }
    }
    return [...highlighteds];
  }, [markedCells, draftMode, cells]);

  useEffect(() => {
    if (cells.every((cell) => !cell.draft && cell.value !== 0)) {
      window.location.href =
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&pp=ygUIcmlja3JvbGw%3D";
    }
  }, [cells]);

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
                const newDraftValues = Array.isArray(v.value)
                  ? [...v.value]
                  : Array(9).fill(false);
                if (num !== 0) {
                  newDraftValues[num - 1] = !newDraftValues[num - 1];
                } else {
                  newDraftValues.fill(false);
                }
                return { ...v, value: newDraftValues, draft: true };
              }
              return { ...v, value: num === v.value ? 0 : num, draft: false };
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
                    highlighted={highlighted.includes(((i / 3) | 0) * 18 +
                    i * 3 +
                    (i1 % 3) +
                    ((i1 / 3) | 0) * 9)}
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
  highlighted
}: {
  cell: Cell;
  marked: boolean;
  setMarked: (marked: boolean) => void;
  mousepressed: boolean;
  draftMode: boolean;
  highlighted: boolean
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
      }  ${marked ? (draftMode ? "bg-amber-300" : "bg-cyan-500") : highlighted ? "bg-red-300": ""}`}
    >
      {!cell.draft ? (
        cell.value === 0 ? (
          ""
        ) : (
          cell.value
        )
      ) : (
        <DraftValues values={cell.value as boolean[]}></DraftValues>
      )}
    </div>
  );
}

function DraftValues({ values }: { values: boolean[] }) {
  return (
    <>
      {values
        .map((v, i) => {
          return { v, i };
        })
        .filter((v) => v.v)
        .map((v) => v.i + 1)
        .join()}
    </>
  );
}
