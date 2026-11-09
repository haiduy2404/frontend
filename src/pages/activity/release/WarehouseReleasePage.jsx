import "../../../styles/WarehouseReleasePage.css";

import WarehouseReleaseFilters from "../../../components/export/release-pages/WarehouseReleaseFilters";
import WarehouseReleaseListPanel from "../../../components/export/release-pages/WarehouseReleaseListPanel";
import WarehouseReleaseDetailPanel from "../../../components/export/release-pages/WarehouseReleaseDetailPanel";
import WarehouseReleaseActualModal from "../../../components/export/release-pages/WarehouseReleaseActualModal";
import WarehouseReleasePrintModal from "../../../components/export/release-pages/WarehouseReleasePrintModal";

import useWarehouseReleaseListController from "../../../components/export/release-pages/controllers/useWarehouseReleaseListController";
import useWarehouseReleaseDetailController from "../../../components/export/release-pages/controllers/useWarehouseReleaseDetailController";
import useWarehouseReleaseActionController from "../../../components/export/release-pages/controllers/useWarehouseReleaseActionController";
import useWarehouseReleaseActualController from "../../../components/export/release-pages/controllers/useWarehouseReleaseActualController";
import useWarehouseReleasePrintController from "../../../components/export/release-pages/controllers/useWarehouseReleasePrintController";
import useWarehouseReleaseSplitPane from "../../../components/export/release-pages/controllers/useWarehouseReleaseSplitPane";

function WarehouseReleasePage() {
  const detail =
    useWarehouseReleaseDetailController();

  const list =
    useWarehouseReleaseListController({
      onLoadDetail:
        detail.fetchReleaseOrderDetail,
      onClearDetail:
        detail.clearReleaseOrderDetail,
    });

  const actions =
    useWarehouseReleaseActionController({
      releaseOrders:
        list.releaseOrders,
      selectedIds:
        list.selectedIds,
      selectedOrder:
        detail.selectedOrder,
      clearSelection:
        list.clearSelection,
      clearDetail:
        detail.clearReleaseOrderDetail,
      refreshList:
        list.fetchReleaseOrders,
    });

  const actual =
    useWarehouseReleaseActualController({
      onSuccess: async () => {
        await list.fetchReleaseOrders();

        const code =
          list.getRowCode(
            list.selectedRow
          );

        if (code) {
          await detail.fetchReleaseOrderDetail(
            code
          );
        }
      },
    });

  const printing =
    useWarehouseReleasePrintController();

  const split =
    useWarehouseReleaseSplitPane();

  const detailRow =
    detail.selectedOrder
      ? {
          ...list.selectedRow,
          ...detail.selectedOrder,
        }
      : list.selectedRow;

  const selectedReleaseCode =
    list.getRowCode(detailRow);

  const handleOpenActual = () => {
    if (!selectedReleaseCode) {
      alert(
        "Vui lòng chọn lệnh xuất kho"
      );
      return;
    }

    actual.openActualModal(
      selectedReleaseCode
    );
  };

  const handlePrint = (formKey) => {
    if (!selectedReleaseCode) {
      alert(
        "Vui lòng chọn lệnh xuất kho"
      );
      return;
    }

    printing.openPrintModal(
      selectedReleaseCode,
      formKey
    );
  };

  return (
    <div className="warehouse-release-page">
      {/* =====================================================
        PAGE HEADER
        ===================================================== */}
      <div className="warehouse-release-page-header">
        <div className="warehouse-release-page-header-text">
          <div className="warehouse-release-page-kicker">
            HOẠT ĐỘNG KHO
          </div>

          <h1>
            Xuất kho
          </h1>
        </div>
      </div>
      <div
        ref={split.splitContainerRef}
        className={[
          "warehouse-release-layout",
          split.isResizing
            ? "is-resizing"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <aside
          ref={split.listPaneRef}
          className="warehouse-release-left-column"
          style={
            split.leftPaneWidth === null
              ? undefined
              : {
                  width:
                    `${split.leftPaneWidth}px`,
                  minWidth:
                    `${split.leftPaneWidth}px`,
                  maxWidth:
                    `${split.leftPaneWidth}px`,
                  flexBasis:
                    `${split.leftPaneWidth}px`,
                }
          }
        >
          <WarehouseReleaseFilters
            search={list.search}
            filters={list.filters}
            warehouses={list.warehouses}
            getWarehouseDisplayName={
              list.getWarehouseDisplayName
            }
            onSearchChange={
              list.handleSearchChange
            }
            onFilterChange={
              list.handleFilterChange
            }
            onTimeTypeChange={
              list.handleTimeTypeChange
            }
          />

          <WarehouseReleaseListPanel
            releaseOrders={
              list.releaseOrders
            }
            loading={list.loading}
            total={list.total}
            page={list.page}
            pageSize={list.pageSize}
            selectedId={list.selectedId}
            selectedIds={list.selectedIds}
            isAllChecked={list.isAllChecked}
            getReleaseStatusText={
              list.getReleaseStatusText
            }
            onToggleAll={
              list.handleToggleAll
            }
            onToggleOne={
              list.handleToggleOne
            }
            onSelectRow={
              list.handleSelectRow
            }
            onPageSizeChange={
              list.handlePageSizeChange
            }
            onPreviousPage={
              list.handlePreviousPage
            }
            onNextPage={
              list.handleNextPage
            }
          />
        </aside>

        <div
          className="warehouse-release-column-splitter"
          role="separator"
          aria-orientation="vertical"
          onPointerDown={
            split.handleSplitterPointerDown
          }
          onDoubleClick={
            split.resetPaneSize
          }
        >
          <span />
        </div>

        <section className="warehouse-release-right-column">
          <WarehouseReleaseDetailPanel
            selectedRow={detailRow}
            selectedCount={
              list.selectedIds.length
            }
            getReleaseStatusText={
              list.getReleaseStatusText
            }
            detailRows={
              detail.detailRows
            }
            detailSearch={
              detail.detailSearch
            }
            detailLoading={
              detail.detailLoading
            }
            filteredDetailRows={
              detail.filteredDetailRows
            }
            onDetailSearchChange={(
              event
            ) =>
              detail.setDetailSearch(
                event.target.value
              )
            }
            parseNumber={
              detail.parseNumber
            }
            formatViNumber={
              detail.formatViNumber
            }
            canUseReleaseActualPage={
              actions.canUseReleaseActualPage
            }
            canDelete={
              actions.canDelete
            }
            rejecting={
              actions.rejecting
            }
            deleting={
              actions.deleting
            }
            canRejectReleaseByStatus={
              actions.canRejectReleaseByStatus
            }
            canDeleteReleaseByStatus={
              actions.canDeleteReleaseByStatus
            }
            printForms={
              printing.printForms
            }
            onOpenActual={
              handleOpenActual
            }
            onReject={
              actions.handleRejectRelease
            }
            onDelete={
              actions.handleDeleteRelease
            }
            onPrint={
              handlePrint
            }
          />
        </section>
      </div>

      <WarehouseReleaseActualModal
        controller={actual}
      />

      <WarehouseReleasePrintModal
        controller={printing}
      />
    </div>
  );
}

export default WarehouseReleasePage;
