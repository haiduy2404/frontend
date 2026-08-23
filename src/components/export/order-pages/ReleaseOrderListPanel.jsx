import ReleaseOrderListTable from "./ReleaseOrderListTable";
import ReleaseOrderPagination from "./ReleaseOrderPagination";


function ReleaseOrderListPanel({
  releaseOrders,
  loading,

  total,
  page,
  pageSize,

  selectedId,
  selectedIds,

  isAllChecked,

  getReleaseStatusText,

  onToggleAll,
  onToggleOne,
  onSelectRow,
  onOpenReleaseOrder,

  onPageSizeChange,
  onPreviousPage,
  onNextPage,
}) {
  return (
    <div className="release-order-list-panel">
      <div className="release-order-list-scroll">
        <ReleaseOrderListTable
          releaseOrders={
            releaseOrders
          }

          loading={
            loading
          }

          selectedId={
            selectedId
          }

          selectedIds={
            selectedIds
          }

          isAllChecked={
            isAllChecked
          }

          getReleaseStatusText={
            getReleaseStatusText
          }

          onToggleAll={
            onToggleAll
          }

          onToggleOne={
            onToggleOne
          }

          onSelectRow={
            onSelectRow
          }

          onOpenReleaseOrder={
            onOpenReleaseOrder
          }
        />
      </div>


      <ReleaseOrderPagination
        total={
          total
        }

        page={
          page
        }

        pageSize={
          pageSize
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
  );
}


export default ReleaseOrderListPanel;