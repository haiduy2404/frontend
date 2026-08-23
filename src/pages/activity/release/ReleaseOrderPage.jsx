import { useNavigate } from "react-router-dom";

import "../../../styles/ReleaseOrderPage.css";

import ReleaseOrderFilters from "../../../components/export/order-pages/ReleaseOrderFilters";
import ReleaseOrderListPanel from "../../../components/export/order-pages/ReleaseOrderListPanel";
import ReleaseOrderDetailPanel from "../../../components/export/order-pages/ReleaseOrderDetailPanel";

import useReleaseOrderListController from "../../../components/export/order-pages/controllers/useReleaseOrderListController";
import useReleaseOrderDetailController from "../../../components/export/order-pages/controllers/useReleaseOrderDetailController";
import useReleaseOrderActionController from "../../../components/export/order-pages/controllers/useReleaseOrderActionController";
import useReleaseOrderSplitPane from "../../../components/export/order-pages/controllers/useReleaseOrderSplitPane";


function ReleaseOrderPage() {
  const navigate = useNavigate();


  /* =========================================================
     DETAIL
     ========================================================= */

  const {
    detailRows,
    selectedReleaseDetail,
    detailLoading,

    detailSearch,
    setDetailSearch,

    filteredDetailRows,

    fetchReleaseOrderDetail,
    clearReleaseOrderDetail,

    parseNumber,
    formatViNumber,
  } =
    useReleaseOrderDetailController();


  /* =========================================================
     LIST
     ========================================================= */

  const {
    releaseOrders,
    loading,
    total,

    search,
    filters,

    page,
    pageSize,

    selectedId,
    selectedIds,
    selectedRow,

    isAllChecked,

    getReleaseStatusText,

    setSelectedId,
    setSelectedIds,

    fetchReleaseOrders,

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
    useReleaseOrderListController({
      onLoadDetail:
        fetchReleaseOrderDetail,

      onClearDetail:
        clearReleaseOrderDetail,
    });


  /* =========================================================
     ACTION
     ========================================================= */

  const {
    canCreate,
    canUpdate,
    canComplete,
    canDelete,

    handleCompleteFromSelection,
    handleCloneReleaseOrder,
    handleDeleteRelease,
    handleEditReleaseOrder,
  } =
    useReleaseOrderActionController({
      navigate,

      releaseOrders,
      selectedRow,
      selectedIds,

      setSelectedId,
      setSelectedIds,

      fetchReleaseOrders,
      clearReleaseOrderDetail,
    });


  /* =========================================================
     SPLIT PANE
     ========================================================= */

  const {
    leftPaneWidth,
    isResizing,

    splitContainerRef,
    listPaneRef,

    handleSplitterPointerDown,
    resetPaneSize,
  } =
    useReleaseOrderSplitPane();


  /* =========================================================
     CURRENT DETAIL
     ========================================================= */

  const detailRow =
    selectedReleaseDetail
      ? {
          ...selectedRow,
          ...selectedReleaseDetail,
        }
      : selectedRow;


  const selectedReleaseCode =
    selectedRow?.code ||
    selectedRow?.release_code ||
    selectedRow?.id ||
    "";


  /* =========================================================
     NAVIGATION
     ========================================================= */

  const handleAdd =
    () => {
      navigate(
        "/dashboard/activity/export/order-detail/new"
      );
    };


  const handleOpenReleaseOrder =
    (row) => {
      if (!row) {
        return;
      }

      const code =
        row.code ||
        row.release_code ||
        row.id;

      if (!code) {
        return;
      }

      navigate(
        `/dashboard/activity/export/order-detail/${code}?mode=print`
      );
    };


  const handlePrint =
    () => {
      if (
        !selectedReleaseCode
      ) {
        alert(
          "Vui lòng chọn lệnh xuất kho"
        );

        return;
      }

      navigate(
        `/dashboard/activity/export/order-detail/${selectedReleaseCode}?mode=print`
      );
    };


  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="release-order-page">
      {/* =====================================================
        PAGE HEADER
        ===================================================== */}
      <div className="release-order-page-header">
        <div className="release-order-page-header-text">
          <div className="release-order-page-kicker">
            HOẠT ĐỘNG KHO
          </div>

          <h1>
            Lệnh xuất kho
          </h1>
        </div>
      </div>

      <div
        ref={
          splitContainerRef
        }
        className={`release-order-layout${
          isResizing
            ? " is-resizing"
            : ""
        }`}
      >
        {/* =====================================================
            LEFT
            ===================================================== */}

        <aside
          ref={
            listPaneRef
          }
          className="release-order-left-column"
          style={
            leftPaneWidth ===
            null
              ? undefined
              : {
                  width:
                    `${leftPaneWidth}px`,

                  minWidth:
                    `${leftPaneWidth}px`,

                  maxWidth:
                    `${leftPaneWidth}px`,

                  flexBasis:
                    `${leftPaneWidth}px`,
                }
          }
        >
          <ReleaseOrderFilters
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

          <ReleaseOrderListPanel
            releaseOrders={
              releaseOrders
            }
            loading={
              loading
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
              handleToggleAll
            }
            onToggleOne={
              handleToggleOne
            }

            onSelectRow={
              handleSelectRow
            }

            onOpenReleaseOrder={
              handleOpenReleaseOrder
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


        {/* =====================================================
            SPLITTER
            ===================================================== */}

        <div
          className="release-order-column-splitter"
          role="separator"
          aria-orientation="vertical"
          aria-label="Kéo để thay đổi chiều rộng danh sách và chi tiết"
          title="Giữ chuột kéo sang trái hoặc phải. Nhấp đúp để đặt lại."
          onPointerDown={
            handleSplitterPointerDown
          }
          onDoubleClick={
            resetPaneSize
          }
        >
          <span />
        </div>


        {/* =====================================================
            RIGHT
            ===================================================== */}

        <section className="release-order-right-column">
          <ReleaseOrderDetailPanel
            selectedRow={
              detailRow
            }

            selectedCount={
              selectedIds.length
            }

            getReleaseStatusText={
              getReleaseStatusText
            }

            canCreate={
              canCreate
            }
            canUpdate={
              canUpdate
            }
            canComplete={
              canComplete
            }
            canDelete={
              canDelete
            }

            onAdd={
              handleAdd
            }

            onEdit={
              handleEditReleaseOrder
            }

            onComplete={
              handleCompleteFromSelection
            }

            onClone={() =>
              handleCloneReleaseOrder(
                selectedRow
              )
            }

            onDelete={() =>
              handleDeleteRelease(
                selectedRow
              )
            }

            onPrint={
              handlePrint
            }

            detailSearch={
              detailSearch
            }

            onDetailSearchChange={
              setDetailSearch
            }

            detailLoading={
              detailLoading
            }

            detailRows={
              detailRows
            }

            filteredDetailRows={
              filteredDetailRows
            }

            parseNumber={
              parseNumber
            }

            formatViNumber={
              formatViNumber
            }
          />
        </section>
      </div>
    </div>
  );
}


export default ReleaseOrderPage;