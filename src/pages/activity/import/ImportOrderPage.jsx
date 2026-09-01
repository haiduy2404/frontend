import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../../contexts/AuthContext";

import "../../../styles/ImportOrderPage.css";
import "../../../styles/ImportOrderDetailPage.css";
//import "../../../styles/ImportOrderResizable.css";

import useImportOrderListController from "../../../hooks/order-page/useImportOrderListController.jsx";
import useImportOrderDetailController from "../../../hooks/order-page/useImportOrderDetailController.jsx";
import useImportOrderActionController from "../../../hooks/order-page/useImportOrderActionController.jsx";
import useImportOrderSplitPane from "../../../hooks/order-page/useImportOrderSplitPane.jsx";
import ImportOrderFilters from "../../../components/import/order-pages/ImportOrderFilters.jsx";

import ImportOrderHeaderActions from "../../../components/import/order-pages/ImportOrderHeaderActions.jsx";
import ImportOrderListPanel from "../../../components/import/order-pages/ImportOrderListPanel.jsx";
import ImportOrderSplitter from "../../../components/import/order-pages/ImportOrderSplitter.jsx";
import ImportOrderDetailPanel from "../../../components/import/order-pages/ImportOrderDetailPanel.jsx";
import ImportOrderActionMenu from "../../../components/import/order-pages/ImportOrderActionMenu.jsx";

function ImportOrderPage() {
  const navigate =
    useNavigate();

  const {
    canDo,
  } = useAuth();

  const canDeleteAdmin =
    canDo(
      "delete_warehouse_import_admin"
    );

  const canUpdate =
    canDo(
      "update_warehouse_receipt"
    );

  const canComplete =
    canDo(
      "complete_warehouse_receipt"
    );

  const canDelete =
    canDo(
      "delete_warehouse_receipt"
    );

  const canCreate =
    canDo(
      "create_warehouse_receipt"
    );

  const {
    detailSearch,
    setDetailSearch,

    detailRows,
    filteredDetailRows,

    detailLoading,

    fetchImportOrderDetail,
    clearImportOrderDetail,

    detailTotalAmount,

    detailVat0Amount,
    detailVat5Amount,
    detailVat8Amount,
    detailVat10Amount,

    detailGrandTotal,

    parseMoney,
    formatViNumber,
    formatViQuantity,
  } =
    useImportOrderDetailController();

  const {
    importOrders,
    total,

    search,
    filters,

    page,
    pageSize,

    selectedId,
    selectedIds,
    selectedRow,

    setSelectedId,
    setSelectedIds,
    setPage,

    waitingDeliveryRows,
    isAllChecked,

    isWaitingDeliveryStatus,
    getReceiptStatusText,

    fetchImportOrders,

    handleSearchChange,

    handleSelectRow,

    handleToggleAll,
    handleToggleOne,

    handleFilterChange,
    handleTimeTypeChange,

    handlePageSizeChange,
    handlePreviousPage,
    handleNextPage,
  } =
    useImportOrderListController({
      onLoadDetail:
        fetchImportOrderDetail,

      onClearDetail:
        clearImportOrderDetail,
    });

  const {
    completing,
    rejecting,

    openActionId,
    menuPosition,

    approvalRows,
    rejectReceipt,

    isApproveButtonDisabled,
    isRejectButtonDisabled,

    handleApproveReceipts,
    handleRejectReceipt,

    handleDeleteReceipt,
    handleDeleteSelectedReceipts,
  } =
    useImportOrderActionController({
      canDeleteAdmin,

      importOrders,

      selectedRow,
      selectedIds,

      setSelectedIds,
      setSelectedId,
      setPage,

      isWaitingDeliveryStatus,

      fetchImportOrders,

      clearImportOrderDetail,
    });

  const {
    leftPaneWidth,
    isResizing,

    splitContainerRef,
    listPaneRef,

    handleSplitterPointerDown,
    resetPaneSize,
  } =
    useImportOrderSplitPane();

  const handleEdit =
    () => {
      if (!selectedRow) {
        alert(
          "Vui lòng chọn phiếu cần chỉnh sửa"
        );

        return;
      }

      if (
        selectedRow.status ===
        "COMPLETED"
      ) {
        alert(
          "Phiếu đã hoàn thành, không được chỉnh sửa."
        );

        return;
      }


      const receiptCode =
        selectedRow.code ||
        selectedRow.id;

      if (
        selectedRow.status ===
        "RECEIVED"
      ) {
        navigate(
          `/dashboard/activity/import/order-detail/${receiptCode}?mode=edit-items`
        );

        return;
      }
      navigate(
        `/dashboard/activity/import/order-detail/${receiptCode}`
      );
    };

  const handleToolbarDelete =
    () => {
      if (
        selectedIds.length > 1
      ) {
        handleDeleteSelectedReceipts();

        return;
      }


      if (!selectedRow) {
        alert(
          "Vui lòng chọn phiếu cần xóa"
        );

        return;
      }


      handleDeleteReceipt(
        selectedRow
      );
    };

const handleInspectionCompleted =
  async () => {
    await fetchImportOrders();

    if (selectedRow?.code) {
      await fetchImportOrderDetail(
        selectedRow.code
      );
    }
  };

 return (
  <div className="warehouse-import-page">
    {/* =================================
        PAGE HEADER
    ================================= */}
    <div className="warehouse-import-page-header">
      <div className="warehouse-import-page-header-text">
        <div className="warehouse-import-page-kicker">
          HOẠT ĐỘNG KHO
        </div>

        <h1>
          Nhập kho
        </h1>
      </div>
    </div>
    <div
      ref={splitContainerRef}
      className={`warehouse-import-main${
        isResizing
          ? " is-resizing"
          : ""
      }`}
    >
      {/* =================================
          LEFT COLUMN
      ================================= */}
        <aside
          ref={listPaneRef}
          className="warehouse-import-left-column"
          style={
            leftPaneWidth === null
              ? undefined
              : {
                  width: `${leftPaneWidth}px`,
                  minWidth: `${leftPaneWidth}px`,
                  maxWidth: `${leftPaneWidth}px`,
                  flexBasis: `${leftPaneWidth}px`,
                }
          }
        >
        <ImportOrderFilters
          search={
            search
          }
          filters={
            filters
          }
          onSearchChange={
            handleSearchChange
          }
          onFilterChange={
            handleFilterChange
          }
          onTimeTypeChange={
            handleTimeTypeChange
          }
        />

        <ImportOrderListPanel
          importOrders={
            importOrders
          }

          selectedId={
            selectedId
          }

          selectedIds={
            selectedIds
          }

          completing={
            completing
          }

          rejecting={
            rejecting
          }

          isAllChecked={
            isAllChecked
          }

          waitingDeliveryRows={
            waitingDeliveryRows
          }

          isWaitingDeliveryStatus={
            isWaitingDeliveryStatus
          }

          getReceiptStatusText={
            getReceiptStatusText
          }

          total={
            total
          }

          page={
            page
          }

          pageSize={
            pageSize
          }

          onToggleAll={
            handleToggleAll
          }

          onToggleOne={
            handleToggleOne
          }

          onSelectRow={
            handleSelectRow
          }

          onOpenReceipt={(
            row
          ) =>
            navigate(
              `/dashboard/activity/import/order-detail/${
                row.code ||
                row.id
              }?mode=print`
            )
          }

          onPageSizeChange={
            handlePageSizeChange
          }

          onPreviousPage={
            handlePreviousPage
          }

          onNextPage={
            handleNextPage
          }
        />
      </aside>

      {/* =================================
          SPLITTER
      ================================= */}
      <ImportOrderSplitter
        onPointerDown={
          handleSplitterPointerDown
        }
        onReset={
          resetPaneSize
        }
      />

      {/* =================================
          RIGHT COLUMN
      ================================= */}
      <section className="warehouse-import-right-column">
        <ImportOrderDetailPanel
          selectedRow={selectedRow}
          getReceiptStatusText={getReceiptStatusText}

          canCreate={canCreate}

          onAdd={() =>
            navigate(
              "/dashboard/activity/import/order-detail/new"
            )
          }

          completing={completing}

          /* TỪ CHỐI */
          rejecting={rejecting}

          canApprove={
            !isApproveButtonDisabled
          }

          onApprove={() =>
            handleApproveReceipts(
              approvalRows
            )
          }

          canUpdate={canUpdate}
          canDelete={canDelete}

          onEdit={handleEdit}

          onDelete={() => {
            if (!selectedRow) {
              return;
            }

            handleDeleteReceipt(
              selectedRow
            );
          }}

            /* =============================
            TỪ CHỐI - LOGIC CŨ
          ============================= */
          onReject={() => {
            if (!selectedRow) {
              return;
            }

            handleRejectReceipt(
              selectedRow
            );
          }}

          /* =============================
            KIỂM NGHIỆM HOÀN THÀNH
          ============================= */
          onInspectionCompleted={
            handleInspectionCompleted
          }

          detailSearch={detailSearch}
          onDetailSearchChange={
            setDetailSearch
          }

          detailLoading={detailLoading}
          detailRows={detailRows}
          filteredDetailRows={
            filteredDetailRows
          }

          detailTotalAmount={
            detailTotalAmount
          }

          detailVat0Amount={
            detailVat0Amount
          }

          detailVat5Amount={
            detailVat5Amount
          }

          detailVat8Amount={
            detailVat8Amount
          }

          detailVat10Amount={
            detailVat10Amount
          }

          detailGrandTotal={
            detailGrandTotal
          }

          parseMoney={parseMoney}
          formatViNumber={
            formatViNumber
          }
          formatViQuantity={
            formatViQuantity
          }
        />
      </section>
    </div>

    <ImportOrderActionMenu
      openActionId={
        openActionId
      }

      menuPosition={
        menuPosition
      }

      importOrders={
        importOrders
      }

      isWaitingDeliveryStatus={
        isWaitingDeliveryStatus
      }

      onApprove={(row) =>
        handleApproveReceipts(
          [row]
        )
      }

      onDelete={
        handleDeleteReceipt
      }
    />
  </div>
);
}


export default ImportOrderPage;