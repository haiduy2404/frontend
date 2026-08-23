import { useState } from "react";

import ReleaseOrderDetailHeader from "./ReleaseOrderDetailHeader";
import ReleaseOrderSummary from "./ReleaseOrderSummary";
import ReleaseOrderWorkflow from "./ReleaseOrderWorkflow";
import ReleaseOrderGoodsSummary from "./ReleaseOrderGoodsSummary";
import ReleaseOrderGoodsDetailModal from "./ReleaseOrderGoodsDetailModal";
import ReleaseOrderSidePanel from "./ReleaseOrderSidePanel";


function ReleaseOrderDetailPanel({
  selectedRow,
  selectedCount,
  getReleaseStatusText,

  canCreate,
  canUpdate,
  canComplete,
  canDelete,

  onAdd,
  onEdit,
  onComplete,
  onClone,
  onDelete,
  onPrint,

  detailSearch,
  onDetailSearchChange,
  detailLoading,
  detailRows,
  filteredDetailRows,

  parseNumber,
  formatViNumber,
}) {
  const [
    goodsModalOpen,
    setGoodsModalOpen,
  ] = useState(false);


  return (
    <div className="release-order-detail-panel">
      <ReleaseOrderDetailHeader
        selectedRow={selectedRow}
        getReleaseStatusText={getReleaseStatusText}
        canCreate={canCreate}
        onAdd={onAdd}
      />


      {!selectedRow ? (
        <div className="release-order-detail-empty-state">
          Chọn một lệnh xuất kho bên trái để xem chi tiết
        </div>
      ) : (
        <div className="release-order-detail-scroll">
          <ReleaseOrderSummary
            selectedRow={selectedRow}
            detailRows={detailRows}
            parseNumber={parseNumber}
            formatViNumber={formatViNumber}
          />


          <div className="release-order-detail-body-layout">
            <main className="release-order-detail-main-content">
              {/* Workflow chỉ hiển thị trạng thái, không chứa nút duyệt nữa */}
              <ReleaseOrderWorkflow
                selectedRow={selectedRow}
                selectedCount={selectedCount}
              />


              <ReleaseOrderGoodsSummary
                detailRows={detailRows}
                detailLoading={detailLoading}
                parseNumber={parseNumber}
                formatViNumber={formatViNumber}
                onViewDetail={() =>
                  setGoodsModalOpen(true)
                }
              />
            </main>


            <ReleaseOrderSidePanel
              selectedRow={selectedRow}
              selectedCount={selectedCount}

              canCreate={canCreate}
              canUpdate={canUpdate}
              canComplete={canComplete}
              canDelete={canDelete}

              onComplete={onComplete}
              onEdit={onEdit}
              onClone={onClone}
              onDelete={onDelete}
              onPrint={onPrint}
            />
          </div>
        </div>
      )}


      <ReleaseOrderGoodsDetailModal
        open={goodsModalOpen}
        onClose={() =>
          setGoodsModalOpen(false)
        }

        detailSearch={detailSearch}
        onDetailSearchChange={onDetailSearchChange}

        detailLoading={detailLoading}
        detailRows={detailRows}
        filteredDetailRows={filteredDetailRows}

        parseNumber={parseNumber}
        formatViNumber={formatViNumber}
      />
    </div>
  );
}


export default ReleaseOrderDetailPanel;