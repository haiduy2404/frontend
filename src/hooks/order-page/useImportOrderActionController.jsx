import {
  useState,
} from "react";

import {
  updateWarehouseReceiptStatus,
  deleteWarehouseReceipt,
} from "../../services/warehouseReceiptService";


const waitForPaint = () =>
  new Promise(
    (resolve) => {
      requestAnimationFrame(
        () => {
          requestAnimationFrame(
            resolve
          );
        }
      );
    }
  );


const waitRandomActionTime =
  () => {
    const timeout =
      Math.floor(
        Math.random() *
          (1500 - 700 + 1)
      ) + 700;

    return new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          timeout
        )
    );
  };


function useImportOrderActionController({
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
}) {
  const [
    completing,
    setCompleting,
  ] = useState(false);

  const [
    rejecting,
    setRejecting,
  ] = useState(false);

  const [
    openActionId,
    setOpenActionId,
  ] = useState(null);

  const [
    menuPosition,
    setMenuPosition,
  ] = useState(null);


  /* =========================================================
     APPROVE SELECTION
     ========================================================= */

  const selectedApprovalRows =
    selectedIds
      .map(
        (selectedRowId) =>
          importOrders.find(
            (row) =>
              row.id ===
              selectedRowId
          )
      )
      .filter(
        (row) =>
          row &&
          isWaitingDeliveryStatus(
            row.status
          )
      );


  const approvalRows =
    selectedApprovalRows.length >
    0
      ? selectedApprovalRows
      : isWaitingDeliveryStatus(
          selectedRow?.status
        )
      ? [selectedRow]
      : [];


  const isApproveButtonDisabled =
    completing ||
    rejecting ||
    approvalRows.length ===
      0;


  /* =========================================================
     REJECT SELECTION
     ========================================================= */

  const rejectReceipt =
    selectedIds.length === 1
      ? importOrders.find(
          (row) =>
            row.id ===
            selectedIds[0]
        ) || null

      : selectedIds.length === 0
      ? selectedRow

      : null;


  const isRejectButtonDisabled =
    rejecting ||
    completing ||
    selectedIds.length > 1 ||
    !rejectReceipt ||
    rejectReceipt.status !==
      "COMPLETED";


  /* =========================================================
     APPROVE
     ========================================================= */

  const handleApproveReceipts =
    async (rows) => {
      if (
        completing ||
        rejecting
      ) {
        return;
      }


      const rowsToApprove =
        Array.isArray(rows)
          ? rows.filter(
              (row) =>
                isWaitingDeliveryStatus(
                  row?.status
                )
            )
          : [];


      if (
        rowsToApprove.length ===
        0
      ) {
        alert(
          "Vui lòng chọn ít nhất một phiếu đang Chờ nhận hàng"
        );

        return;
      }


      const confirmed =
        window.confirm(
          rowsToApprove.length ===
            1
            ? `Bạn có chắc muốn trình duyệt phiếu ${
                rowsToApprove[0]
                  .code ||
                rowsToApprove[0]
                  .invoice_code ||
                rowsToApprove[0]
                  .id
              }?`

            : `Bạn có chắc muốn trình duyệt ${rowsToApprove.length} phiếu đã chọn?`
        );


      if (!confirmed) {
        return;
      }


      try {
        setCompleting(true);

        await waitForPaint();
        await waitRandomActionTime();


        const results =
          await Promise.allSettled(
            rowsToApprove.map(
              (row) =>
                updateWarehouseReceiptStatus(
                  row.id,
                  {
                    status:
                      "RECEIVED",
                  }
                )
            )
          );


        const successRows =
          [];

        const failedRows =
          [];


        results.forEach(
          (
            result,
            index
          ) => {
            if (
              result.status ===
              "fulfilled"
            ) {
              successRows.push(
                rowsToApprove[
                  index
                ]
              );
            } else {
              failedRows.push({
                row:
                  rowsToApprove[
                    index
                  ],

                error:
                  result.reason,
              });
            }
          }
        );


        setOpenActionId(null);
        setSelectedIds([]);


        await fetchImportOrders();


        if (
          failedRows.length ===
          0
        ) {
          alert(
            `Trình duyệt thành công ${successRows.length} phiếu.`
          );

          return;
        }


        const failedCodes =
          failedRows
            .map(
              ({ row }) =>
                row.code ||
                row.invoice_code ||
                row.id
            )
            .join(", ");


        failedRows.forEach(
          ({
            row,
            error,
          }) => {
            console.error(
              `APPROVE RECEIPT ${
                row.code ||
                row.id
              } ERROR:`,

              error?.response
                ?.data ||
                error
            );
          }
        );


        alert(
          `Trình duyệt thành công ${successRows.length}/${rowsToApprove.length} phiếu.\nPhiếu thất bại: ${failedCodes}`
        );
      } catch (error) {
        console.error(
          "APPROVE RECEIPTS ERROR:",
          error.response?.data ||
            error
        );

        alert(
          error.response?.data
            ?.message ||
            error.response?.data
              ?.detail ||
            "Không thể trình duyệt các phiếu đã chọn"
        );
      } finally {
        setCompleting(false);
      }
    };


  /* =========================================================
     REJECT
     ========================================================= */

  const handleRejectReceipt =
    async (receipt) => {
      if (
        rejecting ||
        completing
      ) {
        return;
      }


      if (!canDeleteAdmin) {
        alert(
          "Bạn không có quyền từ chối phiếu đã hoàn thành"
        );

        return;
      }


      if (!receipt?.id) {
        alert(
          "Vui lòng chọn phiếu nhập kho cần từ chối"
        );

        return;
      }


      if (
        receipt.status !==
        "COMPLETED"
      ) {
        alert(
          "Chỉ được từ chối phiếu ở trạng thái Đã hoàn thành"
        );

        return;
      }


      const receiptCode =
        receipt.code ||
        receipt.invoice_code ||
        receipt.invoice_no ||
        receipt.id;


      const confirmed =
        window.confirm(
          `Bạn có chắc chắn muốn từ chối phiếu ${receiptCode} không?`
        );


      if (!confirmed) {
        return;
      }


      try {
        setRejecting(true);

        await waitForPaint();
        await waitRandomActionTime();


        await updateWarehouseReceiptStatus(
          receipt.id,
          {
            status:
              "CANCELLED",
          }
        );


        setSelectedIds([]);
        setSelectedId(null);

        clearImportOrderDetail();

        setPage(1);


        await fetchImportOrders({
          page: 1,
        });


        alert(
          `Từ chối phiếu ${receiptCode} thành công. Phiếu đã chuyển về Chờ nhận hàng.`
        );
      } catch (error) {
        console.error(
          "REJECT WAREHOUSE RECEIPT ERROR:",
          error.response?.data ||
            error
        );

        alert(
          error.response?.data
            ?.message ||
            error.response?.data
              ?.detail ||
            `Không thể từ chối phiếu ${receiptCode}`
        );
      } finally {
        setRejecting(false);
      }
    };


  /* =========================================================
     DELETE ONE
     ========================================================= */

  const handleDeleteReceipt =
    async (row) => {
      if (!row?.id) {
        return;
      }


      const confirmed =
        window.confirm(
          `Bạn có chắc muốn xóa phiếu ${
            row.code ||
            row.invoice_code ||
            ""
          } không?`
        );


      if (!confirmed) {
        return;
      }


      try {
        await deleteWarehouseReceipt(
          row.id
        );

        setOpenActionId(null);

        await fetchImportOrders();

        alert(
          "Xóa phiếu nhập thành công"
        );
      } catch (error) {
        console.error(
          "DELETE RECEIPT ERROR:",
          error.response?.data ||
            error
        );

        alert(
          "Xóa phiếu nhập thất bại"
        );
      }
    };


  /* =========================================================
     DELETE MULTIPLE
     ========================================================= */

  const handleDeleteSelectedReceipts =
    async () => {
      if (
        selectedIds.length ===
        0
      ) {
        alert(
          "Vui lòng chọn ít nhất một phiếu cần xóa"
        );

        return;
      }


      const confirmed =
        window.confirm(
          `Bạn có chắc muốn xóa ${selectedIds.length} phiếu nhập đã chọn không?`
        );


      if (!confirmed) {
        return;
      }


      try {
        await Promise.all(
          selectedIds.map(
            (selectedRowId) =>
              deleteWarehouseReceipt(
                selectedRowId
              )
          )
        );


        setSelectedIds([]);
        setSelectedId(null);

        clearImportOrderDetail();


        await fetchImportOrders();


        alert(
          "Xóa các phiếu nhập đã chọn thành công"
        );
      } catch (error) {
        console.error(
          "DELETE SELECTED RECEIPTS ERROR:",
          error.response?.data ||
            error
        );

        alert(
          error.response?.data
            ?.message ||
            error.response?.data
              ?.detail ||
            "Xóa các phiếu nhập đã chọn thất bại"
        );
      }
    };


  return {
    completing,
    rejecting,

    openActionId,
    menuPosition,

    setOpenActionId,
    setMenuPosition,

    approvalRows,
    rejectReceipt,

    isApproveButtonDisabled,
    isRejectButtonDisabled,

    handleApproveReceipts,
    handleRejectReceipt,

    handleDeleteReceipt,
    handleDeleteSelectedReceipts,
  };
}


export default useImportOrderActionController;