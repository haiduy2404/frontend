import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getWarehouseReceiptByCode,
  updateWarehouseReceiptInventoriesActual,
  updateWarehouseReceiptStatus,
} from "../../../../services/warehouseReceiptService";

import {
  useAuth,
} from "../../../../contexts/AuthContext";


function useImportOrderInspectionController({
  selectedRow,

  /**
   * Gọi sau khi hoàn thành kiểm nghiệm.
   *
   * ImportOrderPage có thể truyền callback này
   * để refresh lại:
   * - danh sách phiếu
   * - detail
   * - status/workflow
   */
  onCompleted,
} = {}) {
  const {
    canDo,
  } = useAuth();


  /* =========================================================
     PERMISSION
     ========================================================= */

  const canUpdateInspection =
    canDo(
      "update_warehouse_receipt_items"
    );

  const canCompleteInspection =
    canDo(
      "complete_warehouse_receipt"
    );


  /* =========================================================
     MODAL
     ========================================================= */

  const [
    inspectionModalOpen,
    setInspectionModalOpen,
  ] = useState(false);


  /* =========================================================
     DATA
     ========================================================= */

  const [
    receiptDetail,
    setReceiptDetail,
  ] = useState(null);

  const [
    inspectionRows,
    setInspectionRows,
  ] = useState([]);

  const [
    loadingInspection,
    setLoadingInspection,
  ] = useState(false);

  const [
    savingInspectionAction,
    setSavingInspectionAction,
  ] = useState("");


  /* =========================================================
     CURRENT RECEIPT
     ========================================================= */

  const receiptCode =
    selectedRow?.code ||
    selectedRow?.receipt_code ||
    selectedRow
      ?.warehouse_receipt_code ||
    selectedRow?.invoice_code ||
    "";


  /* =========================================================
     HELPERS
     ========================================================= */

  const unwrapData = (
    response
  ) =>
    response?.data ||
    response;


  /**
   * Giữ cách parse số của InspectionDetailPage cũ.
   */
  const parseInspectionNumber =
    useCallback(
      (
        value,
        options = {}
      ) => {
        const {
          viThousands = false,
        } = options;

        if (
          value === null ||
          value === undefined ||
          value === ""
        ) {
          return 0;
        }

        if (
          typeof value ===
          "number"
        ) {
          return Number.isNaN(
            value
          )
            ? 0
            : value;
        }

        const text =
          String(value).trim();

        if (!text) {
          return 0;
        }

        let normalized =
          text;

        if (
          text.includes(",")
        ) {
          /*
           * VN:
           * 60.000,00
           * 100.500,000
           */
          normalized =
            text
              .replace(
                /\./g,
                ""
              )
              .replace(
                ",",
                "."
              );
        } else if (
          viThousands &&
          /^\d{1,3}(\.\d{3})+$/.test(
            text
          )
        ) {
          /*
           * 300.000
           * 1.250.000
           */
          normalized =
            text.replace(
              /\./g,
              ""
            );
        } else if (
          (
            text.match(
              /\./g
            ) || []
          ).length > 1
        ) {
          normalized =
            text.replace(
              /\./g,
              ""
            );
        }

        const number =
          Number(
            normalized
          );

        return Number.isNaN(
          number
        )
          ? 0
          : number;
      },
      []
    );


  const formatInspectionQuantity =
    useCallback(
      (value) => {
        const number =
          parseInspectionNumber(
            value
          );

        return number.toLocaleString(
          "vi-VN",
          {
            minimumFractionDigits: 3,
            maximumFractionDigits: 5,
          }
        );
      },
      [
        parseInspectionNumber,
      ]
    );


  const getInspectionCodeFromReceiptCode =
    useCallback(
      (value) => {
        const text =
          String(
            value || ""
          );

        const numbers =
          text.replace(
            /\D/g,
            ""
          );

        return numbers || "";
      },
      []
    );


  const inspectionCode =
    useMemo(
      () =>
        getInspectionCodeFromReceiptCode(
          receiptCode
        ),
      [
        receiptCode,
        getInspectionCodeFromReceiptCode,
      ]
    );


  /* =========================================================
     STATUS
     ========================================================= */

  const isReceiptCompleted =
    String(
      receiptDetail?.status ||
      selectedRow?.status ||
      ""
    ).toUpperCase() ===
    "COMPLETED";


    const currentStatus =
    String(
        selectedRow?.status ||
        ""
    )
        .trim()
        .toUpperCase();


    const canOpenInspection =
    Boolean(
        selectedRow &&
        receiptCode
    ) &&
    (
        currentStatus === "RECEIVED" ||
        currentStatus === "COMPLETED"
    );


  /* =========================================================
     MAP INVENTORY ROW
     ========================================================= */

  const mapInspectionRow =
    useCallback(
      (
        item,
        index
      ) => {
        /*
         * Logic cũ:
         *
         * BE kiểm tra:
         * accepted + rejected
         * theo request_quantity.
         *
         * Không có request_quantity
         * mới fallback original_quantity.
         */
        const documentQuantity =
          item.request_quantity ??
          item.original_quantity ??
          item.document_quantity ??
          item.quantity ??
          0;

        const acceptedQuantity =
          item.accepted_quantity !==
            null &&
          item.accepted_quantity !==
            undefined &&
          item.accepted_quantity !==
            ""
            ? item.accepted_quantity
            : documentQuantity;

        const rejectedQuantity =
          item.rejected_quantity !==
            null &&
          item.rejected_quantity !==
            undefined &&
          item.rejected_quantity !==
            ""
            ? item.rejected_quantity
            : parseInspectionNumber(
                documentQuantity
              ) -
              parseInspectionNumber(
                acceptedQuantity
              );

        return {
          id:
            item.inventory_id ||
            item.goods_id ||
            index + 1,

          inventory_id:
            item.inventory_id ||
            "",

          goods_id:
            item.goods_id ||
            "",

          goods_code:
            item.goods_code ||
            "",

          goods_name:
            item.goods_name ||
            "",

          unit_name:
            item.unit_name ||
            item.unit ||
            "",

          original_quantity:
            formatInspectionQuantity(
              documentQuantity
            ),

          accepted_quantity:
            formatInspectionQuantity(
              acceptedQuantity
            ),

          rejected_quantity:
            formatInspectionQuantity(
              rejectedQuantity
            ),
        };
      },
      [
        formatInspectionQuantity,
        parseInspectionNumber,
      ]
    );


  /* =========================================================
     FETCH DETAIL
     ========================================================= */

  const fetchInspectionDetail =
    useCallback(
      async (
        customReceiptCode =
          receiptCode
      ) => {
        if (
          !customReceiptCode
        ) {
          setReceiptDetail(
            null
          );

          setInspectionRows(
            []
          );

          return null;
        }

        try {
          setLoadingInspection(
            true
          );

          const response =
            await getWarehouseReceiptByCode(
              customReceiptCode
            );

          const data =
            unwrapData(
              response
            );

          setReceiptDetail(
            data
          );

          const rows =
            data?.inventory_lines ||
            data?.inventory ||
            data?.items ||
            data?.details ||
            [];

          const mappedRows =
            Array.isArray(
              rows
            )
              ? rows.map(
                  mapInspectionRow
                )
              : [];

          setInspectionRows(
            mappedRows
          );

          return data;
        } catch (
          error
        ) {
          console.error(
            "LOAD IMPORT ORDER INSPECTION ERROR:",
            error.response
              ?.data ||
              error
          );

          setReceiptDetail(
            null
          );

          setInspectionRows(
            []
          );

          alert(
            "Không tải được dữ liệu kiểm nghiệm"
          );

          return null;
        } finally {
          setLoadingInspection(
            false
          );
        }
      },
      [
        receiptCode,
        mapInspectionRow,
      ]
    );


  /* =========================================================
     OPEN / CLOSE MODAL
     ========================================================= */

  const openInspection =
    useCallback(
      async () => {
        if (!selectedRow) {
          alert(
            "Vui lòng chọn phiếu nhập kho"
          );

          return false;
        }

        if (!receiptCode) {
          alert(
            "Không tìm thấy mã phiếu nhập kho"
          );

          return false;
        }

        const status =
          String(
            selectedRow.status ||
            ""
          ).toUpperCase();

        if (
            status !== "RECEIVED" &&
            status !== "COMPLETED"
        ) {
        alert(
            "Phiếu nhập kho chưa ở trạng thái có thể xem kiểm nghiệm"
        );

        return false;
        }

        setInspectionModalOpen(
          true
        );

        await fetchInspectionDetail(
          receiptCode
        );

        return true;
      },
      [
        selectedRow,
        receiptCode,
        fetchInspectionDetail,
      ]
    );


  const closeInspection =
    useCallback(
      () => {
        if (
          savingInspectionAction
        ) {
          return;
        }

        setInspectionModalOpen(
          false
        );
      },
      [
        savingInspectionAction,
      ]
    );


  /* =========================================================
     EDIT ACCEPTED QUANTITY
     ========================================================= */

  const changeAcceptedQuantity =
    useCallback(
      (
        rowId,
        value
      ) => {
        setInspectionRows(
          (previous) =>
            previous.map(
              (item) => {
                if (
                  item.id !==
                  rowId
                ) {
                  return item;
                }

                const originalQuantity =
                  parseInspectionNumber(
                    item.original_quantity
                  );

                const acceptedQuantity =
                  parseInspectionNumber(
                    value
                  );

                return {
                  ...item,

                  accepted_quantity:
                    value,

                  /*
                   * FE chỉ tính phần chênh.
                   * Validation cuối vẫn để BE.
                   */
                  rejected_quantity:
                    formatInspectionQuantity(
                      originalQuantity -
                        acceptedQuantity
                    ),
                };
              }
            )
        );
      },
      [
        parseInspectionNumber,
        formatInspectionQuantity,
      ]
    );


  const blurAcceptedQuantity =
    useCallback(
      (rowId) => {
        setInspectionRows(
          (previous) =>
            previous.map(
              (item) => {
                if (
                  item.id !==
                  rowId
                ) {
                  return item;
                }

                const originalQuantity =
                  parseInspectionNumber(
                    item.original_quantity
                  );

                const acceptedQuantity =
                  parseInspectionNumber(
                    item.accepted_quantity
                  );

                return {
                  ...item,

                  accepted_quantity:
                    formatInspectionQuantity(
                      acceptedQuantity
                    ),

                  rejected_quantity:
                    formatInspectionQuantity(
                      originalQuantity -
                        acceptedQuantity
                    ),
                };
              }
            )
        );
      },
      [
        parseInspectionNumber,
        formatInspectionQuantity,
      ]
    );


  /* =========================================================
     VALIDATE
     ========================================================= */

  const validateBeforeSave =
    useCallback(
      ({
        isComplete = false,
      } = {}) => {
        if (
          !canUpdateInspection
        ) {
          alert(
            "Bạn không có quyền cập nhật biên bản kiểm nghiệm"
          );

          return false;
        }

        if (
          isComplete &&
          !canCompleteInspection
        ) {
          alert(
            "Bạn không có quyền hoàn thành phiếu nhập kho"
          );

          return false;
        }

        if (
          !inspectionCode
        ) {
          alert(
            "Không xác định được số biên bản kiểm nghiệm"
          );

          return false;
        }

        if (
          !receiptCode
        ) {
          alert(
            "Không tìm thấy phiếu nhập kho tham chiếu"
          );

          return false;
        }

        if (
          !receiptDetail?.id
        ) {
          alert(
            "Không tìm thấy ID phiếu nhập kho"
          );

          return false;
        }

        if (
          isReceiptCompleted
        ) {
          alert(
            "Phiếu nhập kho này đã hoàn thành"
          );

          return false;
        }

        if (
          inspectionRows.length ===
          0
        ) {
          alert(
            "Phiếu nhập kho chưa có chi tiết hàng hóa"
          );

          return false;
        }

        return true;
      },
      [
        canUpdateInspection,
        canCompleteInspection,
        inspectionCode,
        receiptCode,
        receiptDetail,
        isReceiptCompleted,
        inspectionRows,
      ]
    );


  /* =========================================================
     PAYLOAD
     ========================================================= */

  const buildInspectionPayload =
    useCallback(
      () => ({
        inventories:
          inspectionRows.map(
            (item) => ({
              inventory_id:
                item.inventory_id,

              accepted_quantity:
                parseInspectionNumber(
                  item.accepted_quantity
                ),

              rejected_quantity:
                parseInspectionNumber(
                  item.rejected_quantity
                ),
            })
          ),
      }),
      [
        inspectionRows,
        parseInspectionNumber,
      ]
    );


  /* =========================================================
     LƯU TẠM
     ========================================================= */

  const saveInspectionDraft =
    useCallback(
      async () => {
        if (
          !validateBeforeSave({
            isComplete:
              false,
          })
        ) {
          return false;
        }

        const payload =
          buildInspectionPayload();

        console.log(
          "SAVE IMPORT ORDER INSPECTION DRAFT:",
          payload
        );

        setSavingInspectionAction(
          "draft"
        );

        try {
          /*
           * QUAN TRỌNG:
           *
           * LƯU TẠM CHỈ LƯU inventories.
           *
           * KHÔNG gọi API status.
           * Status vẫn RECEIVED.
           */
          await updateWarehouseReceiptInventoriesActual(
            receiptCode,
            payload
          );

          await fetchInspectionDetail(
            receiptCode
          );

          alert(
            "Lưu tạm số liệu kiểm nghiệm thành công"
          );

          return true;
        } catch (
          error
        ) {
          console.error(
            "SAVE IMPORT ORDER INSPECTION DRAFT ERROR:",
            error.response
              ?.data ||
              error
          );

          const data =
            error.response
              ?.data;

          const message =
            data?.message ||
            data?.detail ||
            data?.status ||
            data?.data
              ?.status ||
            data?.data
              ?.accepted_quantity ||
            "Lưu tạm kiểm nghiệm thất bại";

          alert(
            typeof message ===
              "string"
              ? message
              : JSON.stringify(
                  message
                )
          );

          return false;
        } finally {
          setSavingInspectionAction(
            ""
          );
        }
      },
      [
        validateBeforeSave,
        buildInspectionPayload,
        receiptCode,
        fetchInspectionDetail,
      ]
    );


  /* =========================================================
     HOÀN THÀNH KIỂM NGHIỆM
     ========================================================= */

  const completeInspection =
    useCallback(
      async () => {
        if (
          !validateBeforeSave({
            isComplete:
              true,
          })
        ) {
          return false;
        }

        const confirmed =
          window.confirm(
            "Bạn có chắc muốn hoàn thành kiểm nghiệm? Phiếu nhập kho sẽ chuyển sang trạng thái Đã hoàn thành và cập nhật tồn kho."
          );

        if (!confirmed) {
          return false;
        }

        const payload =
          buildInspectionPayload();

        console.log(
          "COMPLETE IMPORT ORDER INSPECTION:",
          payload
        );

        setSavingInspectionAction(
          "complete"
        );

        try {
          /*
           * BƯỚC 1
           * Lưu accepted / rejected.
           */
          await updateWarehouseReceiptInventoriesActual(
            receiptCode,
            payload
          );

          /*
           * BƯỚC 2
           * Chỉ Hoàn thành mới đổi status.
           */
          await updateWarehouseReceiptStatus(
            receiptDetail.id,
            {
              status:
                "COMPLETED",
            }
          );

          /*
           * Cập nhật local trước
           * để modal biết receipt đã complete.
           */
          setReceiptDetail(
            (previous) => ({
              ...previous,

              status:
                "COMPLETED",
            })
          );

          alert(
            "Hoàn thành kiểm nghiệm và cập nhật phiếu nhập kho thành công"
          );

          setInspectionModalOpen(
            false
          );

          /*
           * Cho ImportOrderPage refresh list + detail.
           */
          if (
            typeof onCompleted ===
            "function"
          ) {
            await onCompleted({
              receiptCode,
              receiptId:
                receiptDetail.id,
            });
          }

          return true;
        } catch (
          error
        ) {
          console.error(
            "COMPLETE IMPORT ORDER INSPECTION ERROR:",
            error.response
              ?.data ||
              error
          );

          const data =
            error.response
              ?.data;

          const message =
            data?.message ||
            data?.detail ||
            data?.status ||
            data?.data
              ?.status ||
            data?.data
              ?.accepted_quantity ||
            "Hoàn thành kiểm nghiệm thất bại";

          alert(
            typeof message ===
              "string"
              ? message
              : JSON.stringify(
                  message
                )
          );

          return false;
        } finally {
          setSavingInspectionAction(
            ""
          );
        }
      },
      [
        validateBeforeSave,
        buildInspectionPayload,
        receiptCode,
        receiptDetail,
        onCompleted,
      ]
    );


  /* =========================================================
     SELECTED ROW CHANGE
     ========================================================= */

  useEffect(() => {
    /*
     * Nếu user đổi phiếu trong khi modal đang đóng,
     * xóa data cũ để lần mở sau không flash dữ liệu phiếu trước.
     */
    if (
      !inspectionModalOpen
    ) {
      setReceiptDetail(
        null
      );

      setInspectionRows(
        []
      );
    }
  }, [
    selectedRow?.id,
    inspectionModalOpen,
  ]);


  /* =========================================================
     RETURN
     ========================================================= */

  return {
    /* permission */
    canUpdateInspection,
    canCompleteInspection,

    /* status */
    canOpenInspection,
    isReceiptCompleted,

    /* identity */
    receiptCode,
    inspectionCode,

    /* modal */
    inspectionModalOpen,
    openInspection,
    closeInspection,

    /* loading */
    loadingInspection,
    savingInspectionAction,

    /* data */
    receiptDetail,
    inspectionRows,

    /* edit */
    changeAcceptedQuantity,
    blurAcceptedQuantity,

    /* actions */
    saveInspectionDraft,
    completeInspection,

    /* helpers */
    parseInspectionNumber,
    formatInspectionQuantity,

    /* manual reload nếu cần */
    fetchInspectionDetail,
  };
}


export default useImportOrderInspectionController;