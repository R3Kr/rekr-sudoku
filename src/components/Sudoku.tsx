import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import "./Sudoku.css";

type Cell = {
  readonly value: number | boolean[];
  readonly static: boolean;
  readonly draft: boolean;
};

interface VersionHistoryNode {
  state: Cell[];
  previous?: VersionHistoryNode;
  next: VersionHistoryNode[];
}

function highlightAllDirections(index: number) {
  const highlights = [];
  let iterIndex = index;
  //left
  while (iterIndex % 9 !== 0) {
    highlights.push(--iterIndex);
  }
  //right
  iterIndex = index;
  while (iterIndex % 9 !== 8) {
    highlights.push(++iterIndex);
  }
  //up
  iterIndex = index;
  while (iterIndex - 9 >= 0) {
    iterIndex -= 9;
    highlights.push(iterIndex);
  }
  //down
  iterIndex = index;
  while (iterIndex + 9 < 81) {
    iterIndex += 9;
    highlights.push(iterIndex);
  }
  return highlights;
}

export default function Sudoku({board}:{board:number[]}) {
  const [mousedown, setMousedown] = useState(false);
  const [shift, setShift] = useState(false);
  const [cells, setCells] = useState<Cell[]>(
    board.map((v) => {
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

    for (const [index, marked] of markedCells.entries()) {
      if (!marked) continue;
      const cell = cells[index];
      if (cell.value === 0) continue;
      cells
        .map((c, i) => {
          return { ...c, i };
        })
        .filter(
          (c) =>
            c.value === cell.value ||
            (Array.isArray(cell.value) &&
              !Array.isArray(c.value) &&
              cell.value[c.value - 1])
        )
        .forEach((c) => {
          highlighteds.add(c.i);
          //lite op
          //highlightAllDirections(c.i).forEach(i => highlighteds.add(i))
        });
    }
    return [...highlighteds];
  }, [markedCells, cells]);

  useEffect(() => {
    if (cells.every((cell) => !cell.draft && cell.value !== 0)) {
      window.location.href =
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&pp=ygUIcmlja3JvbGw%3D";
    }
  }, [cells]);

  const beforeArrowMoveMark = useRef<boolean[] | null>();
  const curserindex = useRef<number>();
  const versionHistory = useRef<VersionHistoryNode>({ state: cells , next: []});

  useEffect(() => {
    document.onkeyup = (ev) => {
      if (ev.key === "Shift") {
        setShift(false);
      }
    };
    document.onkeydown = (ev) => {
      if (ev.key === "z") {
        if (versionHistory.current.previous) {
          versionHistory.current = versionHistory.current.previous;
          setCells(versionHistory.current.state);
        }
      }
      if (ev.key === "y") {
        if (versionHistory.current.next.length !== 0) {
            if (versionHistory.current.next.length === 1) {
                versionHistory.current = versionHistory.current.next[0];
            }
            else {
                let answer = false;
                let counter = 0
                while(!answer) {
                    answer = confirm(`There are now ${versionHistory.current.next.length - counter++} possible next states, press ok to go to redo or cancel to cycle through other alternatives`)
                }
                versionHistory.current = versionHistory.current.next[counter-1]
            }
          setCells(versionHistory.current.state);
        }
      }
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
        setCells((oldCells) => {
          const newCells = oldCells.map((v, i) => {
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
          });
          const history: VersionHistoryNode = {
            state: newCells,
            previous: versionHistory.current,
            next: []
          };
          versionHistory.current.next.unshift(history)
          versionHistory.current = history;
          return newCells;
        });
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
    <div class="sudoku-container">
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
                    highlighted={highlighted.includes(
                      ((i / 3) | 0) * 18 + i * 3 + (i1 % 3) + ((i1 / 3) | 0) * 9
                    )}
                  ></SudokuCell>
                ))}
            </div>
          ))}
      </div>
    </div>
  );
}

function SudokuCell({
  cell,
  mousepressed,
  marked,
  setMarked,
  draftMode,
  highlighted,
}: {
  cell: Cell;
  marked: boolean;
  setMarked: (marked: boolean) => void;
  mousepressed: boolean;
  draftMode: boolean;
  highlighted: boolean;
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
      }  ${
        marked
          ? draftMode
            ? "bg-amber-300"
            : "bg-cyan-500"
          : highlighted
          ? "bg-red-300"
          : ""
      }`}
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
