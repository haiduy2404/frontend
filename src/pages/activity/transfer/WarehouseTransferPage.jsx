import "../../../styles/WarehouseTransferPage.css";

import WarehouseTransferDetailPanel from "../../../components/transfer/transfer-pages/WarehouseTransferDetailPanel";
import WarehouseTransferFilters from "../../../components/transfer/transfer-pages/WarehouseTransferFilters";
import WarehouseTransferListPanel from "../../../components/transfer/transfer-pages/WarehouseTransferListPanel";
import useWarehouseTransferActionController from "../../../components/transfer/transfer-pages/controllers/useWarehouseTransferActionController";
import useWarehouseTransferDetailController from "../../../components/transfer/transfer-pages/controllers/useWarehouseTransferDetailController";
import useWarehouseTransferListController from "../../../components/transfer/transfer-pages/controllers/useWarehouseTransferListController";

export default function WarehouseTransferPage() {
  const list = useWarehouseTransferListController();
  const detail = useWarehouseTransferDetailController(list.selectedRow);
  const actions = useWarehouseTransferActionController({
    loadTransfers: list.loadTransfers,
    clearSelection: list.clearSelection,
  });

  return (
    <div className="warehouse-transfer-page">
      <aside className="warehouse-transfer-left-column">
        <div className="warehouse-transfer-tab-title">Điều chuyển</div>

        <WarehouseTransferFilters
          keyword={list.keyword}
          setKeyword={list.setKeyword}
          timeRange={list.timeRange}
          setTimeRange={list.setTimeRange}
          status={list.status}
          setStatus={list.setStatus}
        />

        <WarehouseTransferListPanel
          transfers={list.transfers}
          totalCount={list.totalCount}
          selectedTransferId={list.selectedTransferId}
          onSelectTransfer={list.handleSelectTransfer}
          pageSize={list.pageSize}
          setPageSize={list.setPageSize}
          loading={list.loading}
          error={list.error}
        />
      </aside>

      <WarehouseTransferDetailPanel detail={detail.detail} actions={actions} />
    </div>
  );
}
