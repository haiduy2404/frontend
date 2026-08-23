import ImportOrderListTable from "./ImportOrderListTable.jsx";
import ImportOrderPagination from "./ImportOrderPagination.jsx";

function ImportOrderListPanel({
  importOrders,

  selectedId,
  selectedIds,

  completing,
  rejecting,

  isAllChecked,
  waitingDeliveryRows,

  isWaitingDeliveryStatus,
  getReceiptStatusText,

  total,
  page,
  pageSize,

  onToggleAll,
  onToggleOne,

  onSelectRow,
  onOpenReceipt,

  onPageSizeChange,
  onPreviousPage,
  onNextPage,
}) {
  return (
    <div className="warehouse-import-list-pane">
      <div className="warehouse-import-list-content">
        <ImportOrderListTable
          importOrders={importOrders}
          total={total}
          selectedId={selectedId}
          selectedIds={selectedIds}
          completing={completing}
          rejecting={rejecting}
          isAllChecked={isAllChecked}
          waitingDeliveryRows={waitingDeliveryRows}
          isWaitingDeliveryStatus={
            isWaitingDeliveryStatus
          }
          getReceiptStatusText={
            getReceiptStatusText
          }
          onToggleAll={onToggleAll}
          onToggleOne={onToggleOne}
          onSelectRow={onSelectRow}
          onOpenReceipt={onOpenReceipt}
        />
      </div>

      <div className="warehouse-import-list-pagination">
        <ImportOrderPagination
          total={total}
          page={page}
          pageSize={pageSize}
          currentRowCount={
            importOrders.length
          }
          onPageSizeChange={
            onPageSizeChange
          }
          onPreviousPage={
            onPreviousPage
          }
          onNextPage={
            onNextPage
          }
        />
      </div>
    </div>
  );
}

export default ImportOrderListPanel;