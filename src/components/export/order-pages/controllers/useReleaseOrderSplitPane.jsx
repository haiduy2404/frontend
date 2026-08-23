import { useEffect, useRef, useState } from "react";

function useReleaseOrderSplitPane() {
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

      const containerWidth = container.getBoundingClientRect().width;
      const minLeftWidth = 330;
      const preferredMaxLeftWidth = 480;
      const minRightWidth = 600;
      const splitterWidth = 10;
      const availableMaxWidth = containerWidth - minRightWidth - splitterWidth;
      const maxLeftWidth = Math.max(
        minLeftWidth,
        Math.min(preferredMaxLeftWidth, availableMaxWidth)
      );
      const nextWidth = resizeStart.width + (event.clientX - resizeStart.x);
      const clampedWidth = Math.min(
        maxLeftWidth,
        Math.max(minLeftWidth, nextWidth)
      );

      setLeftPaneWidth(clampedWidth);
    };

    const stopResizing = () => {
      resizeStartRef.current = null;
      setIsResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing);
    window.addEventListener("pointercancel", stopResizing);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
      window.removeEventListener("pointercancel", stopResizing);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [isResizing]);

  const handleSplitterPointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const listPane = listPaneRef.current;
    if (!listPane) return;

    event.preventDefault();
    resizeStartRef.current = {
      x: event.clientX,
      width: listPane.getBoundingClientRect().width,
    };
    setIsResizing(true);
  };

  return {
    leftPaneWidth,
    isResizing,
    splitContainerRef,
    listPaneRef,
    handleSplitterPointerDown,
    resetPaneSize: () => setLeftPaneWidth(null),
  };
}

export default useReleaseOrderSplitPane;
