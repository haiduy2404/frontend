import WarehouseReleaseListTable from "./WarehouseReleaseListTable";
import WarehouseReleasePagination from "./WarehouseReleasePagination";

function WarehouseReleaseListPanel({
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

  onPageSizeChange,
  onPreviousPage,
  onNextPage,
}) {
  return (
    <div className="warehouse-release-list-panel">
      <div className="warehouse-release-list-scroll">
        <WarehouseReleaseListTable
          releaseOrders={releaseOrders}
          loading={loading}
          selectedId={selectedId}
          selectedIds={selectedIds}
          isAllChecked={isAllChecked}
          getReleaseStatusText={getReleaseStatusText}
          onToggleAll={onToggleAll}
          onToggleOne={onToggleOne}
          onSelectRow={onSelectRow}
        />
      </div>

      <WarehouseReleasePagination
        total={total}
        page={page}
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
      />
    </div>
  );
}

export default WarehouseReleaseListPanel;
