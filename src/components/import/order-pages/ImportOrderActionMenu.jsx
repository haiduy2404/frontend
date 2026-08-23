function ImportOrderActionMenu({
  openActionId,
  menuPosition,

  importOrders,

  isWaitingDeliveryStatus,

  onApprove,
  onDelete,
}) {
  if (
    !openActionId ||
    !menuPosition
  ) {
    return null;
  }

  const row =
    importOrders.find(
      (item) =>
        item.id === openActionId
    );

  if (!row) {
    return null;
  }

  return (
    <div
      className="row-action-menu fixed-row-action-menu"
      style={{
        top:
          menuPosition.top,

        left:
          menuPosition.left,
      }}
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <button
        disabled={
          !isWaitingDeliveryStatus(
            row.status
          )
        }
        onClick={() =>
          onApprove(row)
        }
      >
        Duyệt lệnh
      </button>

      <button
        className="danger"
        onClick={() =>
          onDelete(row)
        }
      >
        Xóa
      </button>
    </div>
  );
}

export default ImportOrderActionMenu;