function ImportOrderSplitter({
  onPointerDown,
  onReset,
}) {
  return (
    <div
      className="detail-splitter import-vertical-splitter"
      role="separator"
      aria-orientation="horizontal"
      aria-label="Kéo để thay đổi chiều cao danh sách và chi tiết hàng hóa"
      title="Giữ chuột và kéo lên hoặc xuống. Nhấp đúp để đặt lại."
      onPointerDown={
        onPointerDown
      }
      onDoubleClick={
        onReset
      }
    >
      <span className="import-vertical-splitter-handle" />
    </div>
  );
}

export default ImportOrderSplitter;