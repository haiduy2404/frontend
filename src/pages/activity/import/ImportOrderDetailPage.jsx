import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { useAuth } from "../../../contexts/AuthContext";

import "../../../styles/ImportOrderDetailPage.css";

import {
  createEmptyImportReceiptHeader,
} from "../../../utils/importReceiptMapper";

import {
  parseNumber,
} from "../../../utils/importReceiptNumber";

import useImportGoodsDropdown from "../../../hooks/order-detail/useImportGoodsDropdown.js";
import useImportWarehouses from "../../../hooks/order-detail/useImportWarehouses.js";
import useImportReceiptController from "../../../hooks/order-detail/useImportReceiptController.js";
import useImportReceiptVat from "../../../hooks/order-detail/useImportReceiptVat.js";
import useImportSupplierBank from "../../../hooks/order-detail/useImportSupplierBank.js";
import useImportReceiptItems from "../../../hooks/order-detail/useImportReceiptItems.js";

import GoodsFormModal from "../../../components/GoodsFormModal";

import ImportReceiptPageHeader from "../../../components/import/order-detail/ImportReceiptPageHeader.jsx";
import ImportReceiptHeader from "../../../components/import/order-detail/ImportReceiptHeader.jsx";
import ImportReceiptItemsTable from "../../../components/import/order-detail/ImportReceiptItemsTable.jsx";
import ImportReceiptMoneySummary from "../../../components/import/order-detail/ImportReceiptMoneySummary.jsx";
import ImportReceiptTableFooter from "../../../components/import/order-detail/ImportReceiptTableFooter.jsx";
import ImportReceiptFooter from "../../../components/import/order-detail/ImportReceiptFooter.jsx";


function ImportOrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { canDo } = useAuth();

  const [searchParams] =
    useSearchParams();

  const [
    showAddGoodsModal,
    setShowAddGoodsModal,
  ] = useState(false);

  const enterNavigationRef =
    useRef(null);


  /* =========================================================
     MODE / PERMISSION
     ========================================================= */

  const isCreateMode =
    !id || id === "new";

  const isPrintMode =
    searchParams.get("mode") ===
    "print";

  const isEditReceivedMode =
    searchParams.get("mode") ===
    "edit-items";

  const isLockedWhenReceived =
    isPrintMode ||
    isEditReceivedMode;

  const isLockedOnlyPrint =
    isPrintMode;


  const canSave =
    id && id !== "new"
      ? canDo(
          "update_warehouse_receipt"
        )
      : canDo(
          "create_warehouse_receipt"
        );

  const canComplete =
    canDo(
      "complete_warehouse_receipt"
    );

  /* =========================================================
     HEADER
     ========================================================= */

  const [
    headerData,
    setHeaderData,
  ] = useState(
    () =>
      createEmptyImportReceiptHeader()
  );


  /* =========================================================
     SUPPLIER / BANK
     ========================================================= */

  const {
    companyLoading,

    clearBankAccounts,
    loadCompanyByTaxCode,
    loadCompanyBanks,

    resetSupplierBank,
  } = useImportSupplierBank();


  /* =========================================================
     WAREHOUSE
     ========================================================= */

  const {
    warehouseList,
    warehouseLoading,
  } = useImportWarehouses();


  /* =========================================================
     GOODS DROPDOWN
     ========================================================= */

  const {
    goodsList,
    goodsLoading,

    showGoodsDropdown,
    activeGoodsRowId,

    openGoodsDropdown,
    searchGoodsForRow,

    hideGoodsDropdown,
    closeGoodsDropdown,

    toggleGoodsDropdown,

    handleGoodsDropdownScroll,

    refreshGoodsDropdown,
  } = useImportGoodsDropdown();


  /* =========================================================
     RECEIPT ITEMS
     ========================================================= */

  const {
    items,
    setItems,

    deletedItems,

    insertRowAfter,

    addRow:
      handleAddRow,

    deleteRow:
      handleDeleteRow,

    selectGoods,

    changeItemUnit:
      handleChangeItemUnit,

    changeItemField:
      handleChangeItemField,

    resetItems,
  } = useImportReceiptItems();


  /* =========================================================
     VAT
     ========================================================= */

  const {
    manualVatSummary,

    totalAmount,
    vatSummary,
    finalGrandTotal,

    buildVatAmountSummaryPayload,

    handleChangeManualVat,
    handleBlurManualVat,

    resetVat,
    loadVatSummary,
  } = useImportReceiptVat(
    items,
    parseNumber
  );


  /* =========================================================
     RECEIPT CONTROLLER
     ========================================================= */

  const {
    loadReceiptDetail,
    saveReceiptData,
    resetReceiptController,
  } = useImportReceiptController({
    receiptCode: id,

    headerData,
    items,
    deletedItems,

    setHeaderData,
    setItems,

    loadVatSummary,
    loadCompanyBanks,

    buildVatAmountSummaryPayload,
  });

  /* =========================================================
     ENTER NAVIGATION
     ========================================================= */

  const handleEnterMoveNext = (
    event
  ) => {
    if (
      event.key !== "Enter" ||
      event.nativeEvent?.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }

    event.preventDefault();

    const fields =
      Array.from(
        enterNavigationRef.current
          ?.querySelectorAll(
            '[data-enter-next="true"]:not(:disabled):not([readonly]):not([type="hidden"])'
          ) || []
      );

    const currentIndex =
      fields.indexOf(
        event.currentTarget
      );

    if (currentIndex === -1) {
      return;
    }

    const direction =
      event.shiftKey ? -1 : 1;

    const nextField =
      fields[
        currentIndex +
          direction
      ];

    event.currentTarget.blur();

    if (!nextField) {
      return;
    }

    requestAnimationFrame(() => {
      nextField.focus();

      if (
        nextField.tagName ===
          "INPUT" &&
        ![
          "checkbox",
          "radio",
          "file",
        ].includes(
          nextField.type
        ) &&
        typeof nextField.select ===
          "function"
      ) {
        nextField.select();
      }
    });
  };


  /* =========================================================
     HEADER HANDLERS
     ========================================================= */

  const handleLoadCompanyByTaxCode =
    async () => {
      await loadCompanyByTaxCode(
        headerData.tax_code,
        setHeaderData
      );
    };


  const handleHeaderChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setHeaderData(
      (previous) => ({
        ...previous,

        [name]: value,

        ...(
          name ===
            "bank_account_name" ||
          name ===
            "bank_account_number"
            ? {
                bank_account_id:
                  "",
              }
            : {}
        ),
      })
    );

    if (
      name === "tax_code"
    ) {
      clearBankAccounts();
    }
  };


  /* =========================================================
     ITEM HANDLERS
     ========================================================= */

  const handleSelectGoods = (
    goods
  ) => {
    selectGoods(
      activeGoodsRowId,
      goods
    );

    closeGoodsDropdown();
  };


  const handleUnitPriceEnter = (
    event,
    rowId
  ) => {
    if (
      event.key !== "Enter" ||
      event.nativeEvent?.isComposing ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey
    ) {
      return;
    }

    if (event.shiftKey) {
      handleEnterMoveNext(
        event
      );

      return;
    }

    event.preventDefault();

    event.currentTarget.blur();

    const newRow =
      insertRowAfter(
        rowId
      );

    closeGoodsDropdown();

    /*
     * Chờ React render dòng mới
     * rồi focus về Mã hàng.
     */
    requestAnimationFrame(
      () => {
        requestAnimationFrame(
          () => {
            const goodsCodeInputs =
              Array.from(
                enterNavigationRef.current
                  ?.querySelectorAll(
                    "[data-goods-code-row-id]"
                  ) || []
              );

            const newGoodsCodeInput =
              goodsCodeInputs.find(
                (input) =>
                  input.dataset
                    .goodsCodeRowId ===
                  String(
                    newRow.id
                  )
              );

            if (
              newGoodsCodeInput
            ) {
              newGoodsCodeInput.focus();
              newGoodsCodeInput.select();
            }
          }
        );
      }
    );
  };


  /* =========================================================
     LOAD DETAIL
     ========================================================= */

  useEffect(() => {
    if (
      id &&
      id !== "new"
    ) {
      loadReceiptDetail(
        id
      );
    }
  }, [id]);


  /* =========================================================
     RESET
     ========================================================= */

  const resetNewReceiptForm =
    () => {
      resetReceiptController();

      resetSupplierBank();

      setHeaderData(
        createEmptyImportReceiptHeader()
      );

      resetItems();

      resetVat();
    };


  /* =========================================================
     SAVE
     ========================================================= */

  const saveReceipt = async ({
    status,
    successMessage,
    addNew = false,
  }) => {
    const {
      saved,
      validationMessage,
    } =
      await saveReceiptData({
        status,
      });

    if (!saved) {
      if (
        validationMessage
      ) {
        alert(
          validationMessage
        );
      }

      return;
    }

    alert(
      successMessage
    );

    if (addNew) {
      resetNewReceiptForm();

      navigate(
        "/dashboard/activity/import/order-detail/new",
        {
          replace: true,
        }
      );

      return;
    }

    navigate(
      "/dashboard/activity/import/order"
    );
  };


  const handleSaveDraft =
    async () => {
      try {
        await saveReceipt({
          status:
            "WAITING_DELIVERY",

          successMessage:
            "Lưu tạm phiếu nhập kho thành công",
        });
      } catch (error) {
        console.error(
          "SAVE DRAFT WAREHOUSE RECEIPT ERROR:",
          error.response?.data ||
            error
        );

        alert(
          error.response?.data
            ?.message ||
            error.response?.data
              ?.detail ||
            "Lưu tạm phiếu nhập kho thất bại"
        );
      }
    };


  const handleComplete =
    async () => {
      try {
        await saveReceipt({
          status:
            "RECEIVED",

          successMessage:
            id &&
            id !== "new"
              ? "Cập nhật phiếu nhập kho thành công"
              : "Tạo phiếu nhập kho thành công",
        });
      } catch (error) {
        console.error(
          "CREATE WAREHOUSE RECEIPT ERROR:",
          error.response?.data ||
            error
        );

        alert(
          error.response?.data
            ?.message ||
            error.response?.data
              ?.detail ||
            "Tạo phiếu nhập kho thất bại"
        );
      }
    };


  const handleSaveDraftAndAddNew =
    async () => {
      try {
        await saveReceipt({
          status:
            "WAITING_DELIVERY",

          successMessage:
            "Lưu tạm thành công",

          addNew: true,
        });
      } catch (error) {
        console.error(
          "SAVE DRAFT AND ADD NEW ERROR:",
          error.response?.data ||
            error
        );

        alert(
          error.response?.data
            ?.message ||
            error.response?.data
              ?.detail ||
            "Lưu tạm thất bại"
        );
      }
    };

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div
      className="import-order-detail-page"
      ref={
        enterNavigationRef
      }
    >
      <ImportReceiptPageHeader
        id={id}
        isCreateMode={
          isCreateMode
        }
        onClose={() =>
          navigate(
            "/dashboard/activity/import/order"
          )
        }
      />

      <div className="import-order-detail-body">
        <ImportReceiptHeader
          id={id}
          headerData={
            headerData
          }
          setHeaderData={
            setHeaderData
          }
          warehouseList={
            warehouseList
          }
          warehouseLoading={
            warehouseLoading
          }
          companyLoading={
            companyLoading
          }
          isPrintMode={
            isPrintMode
          }
          isLockedWhenReceived={
            isLockedWhenReceived
          }
          isLockedOnlyPrint={
            isLockedOnlyPrint
          }
          onHeaderChange={
            handleHeaderChange
          }
          onLoadCompanyByTaxCode={
            handleLoadCompanyByTaxCode
          }
          onEnterMoveNext={
            handleEnterMoveNext
          }
        />

        <div className="detail-section-title">
          Chi tiết
        </div>

        <div className="detail-card">
          <ImportReceiptItemsTable
            items={items}
            isPrintMode={
              isPrintMode
            }
            activeGoodsRowId={
              activeGoodsRowId
            }
            showGoodsDropdown={
              showGoodsDropdown
            }
            goodsList={
              goodsList
            }
            goodsLoading={
              goodsLoading
            }
            totalAmount={
              totalAmount
            }
            onEnterMoveNext={
              handleEnterMoveNext
            }
            onUnitPriceEnter={
              handleUnitPriceEnter
            }
            onOpenGoodsDropdown={
              openGoodsDropdown
            }
            onSearchGoodsForRow={
              searchGoodsForRow
            }
            onToggleGoodsDropdown={
              toggleGoodsDropdown
            }
            onGoodsDropdownScroll={
              handleGoodsDropdownScroll
            }
            onOpenAddGoodsModal={() => {
              hideGoodsDropdown();

              setShowAddGoodsModal(
                true
              );
            }}
            onSelectGoods={
              handleSelectGoods
            }
            onChangeItemField={
              handleChangeItemField
            }
            onChangeItemUnit={
              handleChangeItemUnit
            }
            onAddRow={
              handleAddRow
            }
            onDeleteRow={
              handleDeleteRow
            }
          />

          <ImportReceiptMoneySummary
            manualVatSummary={
              manualVatSummary
            }
            vatSummary={
              vatSummary
            }
            finalGrandTotal={
              finalGrandTotal
            }
            isPrintMode={
              isPrintMode
            }
            onResetVat={
              resetVat
            }
            onChangeManualVat={
              handleChangeManualVat
            }
            onBlurManualVat={
              handleBlurManualVat
            }
          />

          <ImportReceiptTableFooter
            totalRows={
              items.length
            }
          />
        </div>
      </div>

      <ImportReceiptFooter
        isPrintMode={
          isPrintMode
        }

        canSave={
          canSave
        }

        canComplete={
          canComplete
        }

        onCancel={() =>
          navigate(
            "/dashboard/activity/import/order"
          )
        }

        onSaveAndAdd={
          handleSaveDraftAndAddNew
        }

        onSaveDraft={
          handleSaveDraft
        }

        onComplete={
          handleComplete
        }
      />

      {showAddGoodsModal && (
        <GoodsFormModal
          onClose={() => {
            setShowAddGoodsModal(
              false
            );

            closeGoodsDropdown();
          }}
          onSuccess={(goods) => {
            setShowAddGoodsModal(
              false
            );

            if (goods) {
              handleSelectGoods(
                goods
              );
            } else {
              closeGoodsDropdown();
            }

            refreshGoodsDropdown();
          }}
        />
      )}
    </div>
  );
}

export default ImportOrderDetailPage;