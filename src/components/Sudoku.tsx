import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import "./Sudoku.css";

export default function Sudoku() {
  const [mousedown, setMousedown] = useState(false);
  const [cells, setCells] = useState<number[]>(Array(81).fill(0));

  useEffect(() => {
    document.onkeydown = (ev) => {
      switch (ev.key) {
        case "1":

        default:
      }
    };
    document.onmousedown = (ev) => setMousedown(true);
    document.onmouseup = (ev) => setMousedown(false);
  }, []);

  return (
    <>
      {mousedown && <span class="select-none">m</span>}
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
}: {
  cell: number;
  mousepressed: boolean;
}) {
  const divref = useRef<HTMLDivElement>(null);
  const [marked, setMarked] = useState(false);

  const mouseover = useCallback((ev: MouseEvent) => {
    setMarked(true);
  }, []);
  //jag är genious
  const mouseleave = useCallback(
    (ev: MouseEvent) => {
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
    <div ref={divref} class={`cell select-none ${marked && "bg-cyan-500"}`}>
      {cell === 0 ? "" : cell}
    </div>
  );
}
