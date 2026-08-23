import { useEffect, useRef, useState } from "react";

function useWarehouseReleaseSplitPane() {
  const [leftPaneWidth, setLeftPaneWidth] = useState(null);
  const [isResizing, setIsResizing] = useState(false);

  const splitContainerRef = useRef(null);
  const listPaneRef = useRef(null);
  const resizeStartRef = useRef(null);

  useEffect(() => {
    if (!isResizing) return undefined;

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handlePointerMove = (event) => {
      const container = splitContainerRef.current;
      const resizeStart = resizeStartRef.current;

      if (!container || !resizeStart) return;

      const containerWidth =
        container.getBoundingClientRect().width;

      const minLeftWidth = 300;
      const minRightWidth = 560;
      const splitterWidth = 8;

      const maxLeftWidth = Math.max(
        minLeftWidth,
        containerWidth - minRightWidth - splitterWidth
      );

      const nextWidth =
        resizeStart.width +
        (event.clientX - resizeStart.x);

      setLeftPaneWidth(
        Math.min(
          maxLeftWidth,
          Math.max(minLeftWidth, nextWidth)
        )
      );
    };

    const stopResizing = () => {
      resizeStartRef.current = null;
      setIsResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing);
    window.addEventListener("pointercancel", stopResizing);

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );
      window.removeEventListener(
        "pointerup",
        stopResizing
      );
      window.removeEventListener(
        "pointercancel",
        stopResizing
      );

      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [isResizing]);

  const handleSplitterPointerDown = (event) => {
    if (
      event.pointerType === "mouse" &&
      event.button !== 0
    ) {
      return;
    }

    const listPane = listPaneRef.current;

    if (!listPane) return;

    event.preventDefault();

    resizeStartRef.current = {
      x: event.clientX,
      width: listPane.getBoundingClientRect().width,
    };

    setIsResizing(true);
  };

  const resetPaneSize = () => {
    setLeftPaneWidth(null);
  };

  return {
    leftPaneWidth,
    isResizing,

    splitContainerRef,
    listPaneRef,

    handleSplitterPointerDown,
    resetPaneSize,
  };
}

export default useWarehouseReleaseSplitPane;
