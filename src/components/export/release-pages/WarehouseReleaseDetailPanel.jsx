import { useState } from "react";
import WarehouseReleaseDetailHeader from "./WarehouseReleaseDetailHeader";
import WarehouseReleaseSummary from "./WarehouseReleaseSummary";
import WarehouseReleaseWorkflow from "./WarehouseReleaseWorkflow";
import WarehouseReleaseGoodsSummary from "./WarehouseReleaseGoodsSummary";
import WarehouseReleaseGoodsDetailModal from "./WarehouseReleaseGoodsDetailModal";
import WarehouseReleaseSidePanel from "./WarehouseReleaseSidePanel";

function WarehouseReleaseDetailPanel({
  selectedRow,
  selectedCount,

  getReleaseStatusText,

  detailRows,
  detailSearch,
  detailLoading,
  filteredDetailRows,
  onDetailSearchChange,

  parseNumber,
  formatViNumber,

  canUseReleaseActualPage,
  canDelete,

  rejecting,
  deleting,

  canRejectReleaseByStatus,
  canDeleteReleaseByStatus,

  printForms,

  onOpenActual,
  onReject,
  onDelete,
  onPrint,
}) {
  const [goodsModalOpen, setGoodsModalOpen] =
    useState(false);

  return (
    <div className="warehouse-release-detail-panel">
      <WarehouseReleaseDetailHeader
        selectedRow={selectedRow}
        getReleaseStatusText={getReleaseStatusText}
      />

      {!selectedRow ? (
        <div className="warehouse-release-detail-empty">
          Chọn một lệnh xuất kho bên trái để xem chi tiết
        </div>
      ) : (
        <div className="warehouse-release-detail-scroll">
          <WarehouseReleaseSummary
            selectedRow={selectedRow}
            detailRows={detailRows}
            parseNumber={parseNumber}
            formatViNumber={formatViNumber}
          />

          <div className="warehouse-release-detail-body-layout">
            <main className="warehouse-release-detail-main">
              <WarehouseReleaseWorkflow
                selectedRow={selectedRow}
              />

              <WarehouseReleaseGoodsSummary
                detailRows={detailRows}
                detailLoading={detailLoading}
                formatViNumber={formatViNumber}
                onViewDetail={() =>
                  setGoodsModalOpen(true)
                }
              />
            </main>

            <WarehouseReleaseSidePanel
              selectedRow={selectedRow}
              selectedCount={selectedCount}
              canUseReleaseActualPage={
                canUseReleaseActualPage
              }
              canDelete={canDelete}
              rejecting={rejecting}
              deleting={deleting}
              canRejectReleaseByStatus={
                canRejectReleaseByStatus
              }
              canDeleteReleaseByStatus={
                canDeleteReleaseByStatus
              }
              printForms={printForms}
              onOpenActual={onOpenActual}
              onReject={onReject}
              onDelete={onDelete}
              onPrint={onPrint}
            />
          </div>
        </div>
      )}

      <WarehouseReleaseGoodsDetailModal
        open={goodsModalOpen}
        onClose={() =>
          setGoodsModalOpen(false)
        }
        detailSearch={detailSearch}
        onDetailSearchChange={onDetailSearchChange}
        detailLoading={detailLoading}
        filteredDetailRows={filteredDetailRows}
        parseNumber={parseNumber}
        formatViNumber={formatViNumber}
      />
    </div>
  );
}

export default WarehouseReleaseDetailPanel;
