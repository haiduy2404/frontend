import {
  RiAddLine,
} from "react-icons/ri";

function ImportOrderHeaderActions({
  canCreate,
  onAdd,
}) {
  return (
    <div className="import-order-header-actions">
      {canCreate && (
        <button
          type="button"
          className="add-btn"
          onClick={onAdd}
        >
          <RiAddLine />
          <span>Thêm</span>
        </button>
      )}
    </div>
  );
}

export default ImportOrderHeaderActions;