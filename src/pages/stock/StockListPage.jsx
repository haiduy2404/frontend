import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  RiDeleteBin6Line,
  RiEdit2Line,
  RiMore2Fill,
  RiPauseCircleLine,
  RiPlayCircleLine,
} from "react-icons/ri";

import "../../styles/StockListPage.css";

import {
  createWarehouse,
  deleteWarehouse,
  getWarehouses,
  importWarehouseExcel,
  updateWarehouse,
} from "../../services/warehouseService";

import { useAuth } from "../../contexts/AuthContext";

import {
  getStoredListPageState,
  saveStoredListPageState,
} from "../../utils/listPageStateStorage";


function StockListPage() {
  const LIST_PAGE_STATE_KEY =
    "stock-list-page-state";


  /* =========================================================
     AUTH
     ========================================================= */

  const {
    canDo,
    isWarehouseRestricted,
  } = useAuth();


  /* =========================================================
     STATE
     ========================================================= */

  const [warehouses, setWarehouses] =
    useState([]);


  const [search, setSearch] =
    useState(() => {
      const stored =
        getStoredListPageState(
          LIST_PAGE_STATE_KEY,
          {}
        );

      return stored.search || "";
    });


  const [selectedIds, setSelectedIds] =
    useState(() => {
      const stored =
        getStoredListPageState(
          LIST_PAGE_STATE_KEY,
          {}
        );

      return Array.isArray(
        stored.selectedIds
      )
        ? stored.selectedIds
        : [];
    });


  const [
    editingWarehouseId,
    setEditingWarehouseId,
  ] = useState(null);


  const [activeRowId, setActiveRowId] =
    useState(null);


  const [openMenuId, setOpenMenuId] =
    useState(null);


  const [showModal, setShowModal] =
    useState(false);


  const fileInputRef =
    useRef(null);


  /* =========================================================
     PAGINATION
     ========================================================= */

  const [page, setPage] =
    useState(() => {
      const stored =
        getStoredListPageState(
          LIST_PAGE_STATE_KEY,
          {}
        );

      const parsedPage =
        Number(stored.page);

      return Number.isFinite(
        parsedPage
      ) && parsedPage > 0
        ? parsedPage
        : 1;
    });


  const [
    totalPages,
    setTotalPages,
  ] = useState(1);


  const [pageSize, setPageSize] =
    useState(() => {
      const stored =
        getStoredListPageState(
          LIST_PAGE_STATE_KEY,
          {}
        );

      const parsedPageSize =
        Number(stored.pageSize);

      return Number.isFinite(
        parsedPageSize
      ) && parsedPageSize > 0
        ? parsedPageSize
        : 20;
    });


  const [total, setTotal] =
    useState(0);


  /* =========================================================
     FORM
     ========================================================= */

  const [formData, setFormData] =
    useState({
      code: "",
      name: "",
      address: "",
      accountant_code: "",
    });


  /* =========================================================
     SAVE LIST PAGE STATE
     ========================================================= */

  useEffect(() => {
    saveStoredListPageState(
      LIST_PAGE_STATE_KEY,
      {
        search,
        page,
        pageSize,
        selectedIds,
      }
    );
  }, [
    page,
    pageSize,
    search,
    selectedIds,
  ]);


  /* =========================================================
     FETCH WAREHOUSES
     ========================================================= */

  const fetchWarehouses = async (
    keyword = search,
    pageNumber = page,
    size = pageSize
  ) => {
    try {
      const response =
        await getWarehouses({
          search: keyword,
          page: pageNumber,
          page_size: size,
        });


      const payload =
        response?.data || response;


      const results =
        Array.isArray(payload)
          ? payload
          : Array.isArray(
              payload?.results
            )
          ? payload.results
          : [];


      setWarehouses(results);


      const activeSelectedIds =
        (selectedIds || []).filter(
          (id) =>
            results.some(
              (warehouse) =>
                warehouse.id === id
            )
        );


      setSelectedIds(
        activeSelectedIds
      );


      setTotal(
        payload?.total ??
          results.length
      );


      setTotalPages(
        payload?.total_pages ?? 1
      );
    } catch (error) {
      console.error(
        "GET WAREHOUSES ERROR:",
        error.response?.data ||
          error
      );

      setWarehouses([]);
      setTotal(0);
      setTotalPages(1);
    }
  };


  /* =========================================================
     LOAD PAGE
     ========================================================= */

  useEffect(() => {
    fetchWarehouses(
      search,
      page,
      pageSize
    );
  }, [page]);


  /* =========================================================
     CLOSE ROW MENU
     ========================================================= */

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
    };


    document.addEventListener(
      "click",
      handleClickOutside
    );


    return () => {
      document.removeEventListener(
        "click",
        handleClickOutside
      );
    };
  }, []);


  /* =========================================================
     EXCEL
     ========================================================= */

  const handleExcelClick = () => {
    fileInputRef.current?.click();
  };


  const handleExcelChange =
    async (event) => {
      const file =
        event.target.files?.[0];


      if (!file) {
        return;
      }


      const excelFormData =
        new FormData();


      excelFormData.append(
        "file",
        file
      );


      try {
        await importWarehouseExcel(
          excelFormData
        );

        alert(
          "Import Excel thành công"
        );

        await fetchWarehouses(
          search,
          page
        );
      } catch (error) {
        console.log(
          "IMPORT EXCEL ERROR:",
          error.response?.data ||
            error
        );

        alert(
          "Import Excel thất bại"
        );
      }


      event.target.value = "";
    };


  /* =========================================================
     SELECT
     ========================================================= */

  const handleSelectAll = (
    event
  ) => {
    if (event.target.checked) {
      setSelectedIds(
        warehouses.map(
          (warehouse) =>
            warehouse.id
        )
      );
    } else {
      setSelectedIds([]);
    }
  };


  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter(
            (item) =>
              item !== id
          )
        : [...prev, id]
    );
  };


  /* =========================================================
     FORM HANDLERS
     ========================================================= */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;


    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      address: "",
      accountant_code: "",
    });
  };


  const currentWarehouse =
    warehouses.find(
      (warehouse) =>
        warehouse.id ===
        editingWarehouseId
    );


  /* =========================================================
     SAVE WAREHOUSE
     ========================================================= */

  const handleSave = async (
    keepOpen
  ) => {
    if (
      !formData.code ||
      !formData.name ||
      !formData.address
    ) {
      alert(
        "Vui lòng nhập đầy đủ Mã kho, Tên kho và Địa chỉ"
      );

      return;
    }


    const payload = {
      code:
        formData.code.trim(),

      name:
        formData.name.trim(),

      address:
        formData.address.trim(),

      accountant_code:
        formData.accountant_code
          ?.trim() || "",

      status:
        editingWarehouseId
          ? currentWarehouse
              ?.status ||
            "ACTIVE"
          : "ACTIVE",
    };


    try {
      const isEditing =
        !!editingWarehouseId;


      if (isEditing) {
        await updateWarehouse(
          editingWarehouseId,
          payload
        );
      } else {
        await createWarehouse(
          payload
        );
      }


      await fetchWarehouses(
        search
      );


      setSelectedIds([]);

      setEditingWarehouseId(
        null
      );


      if (
        keepOpen &&
        !isEditing
      ) {
        resetForm();
      } else {
        setShowModal(false);

        resetForm();
      }


      alert(
        isEditing
          ? "Cập nhật kho thành công"
          : "Thêm kho thành công"
      );
    } catch (error) {
      console.log(
        "SAVE ERROR:",
        error
      );

      console.log(
        "ERROR DATA:",
        error.response?.data
      );


      alert(
        error.response?.data
          ?.code ||
          (editingWarehouseId
            ? "Cập nhật kho thất bại"
            : "Thêm kho thất bại")
      );
    }
  };


  /* =========================================================
     TOGGLE STATUS
     ========================================================= */

  const handleToggleStatus =
    async (warehouse) => {
      const isActive =
        warehouse.status ===
        "ACTIVE";


      const confirmed =
        window.confirm(
          isActive
            ? `Bạn có chắc muốn ngừng hoạt động kho "${warehouse.name}" không?`
            : `Bạn có chắc muốn kích hoạt lại kho "${warehouse.name}" không?`
        );


      if (!confirmed) {
        return;
      }


      try {
        await updateWarehouse(
          warehouse.id,
          {
            code:
              warehouse.code,

            name:
              warehouse.name,

            address:
              warehouse.address,

            accountant_code:
              warehouse.accountant_code ||
              "",

            status:
              isActive
                ? "INACTIVE"
                : "ACTIVE",
          }
        );


        await fetchWarehouses(
          search,
          page
        );
      } catch (error) {
        console.error(
          "TOGGLE WAREHOUSE STATUS ERROR:",
          error.response?.data ||
            error
        );


        alert(
          isActive
            ? "Ngừng hoạt động kho thất bại"
            : "Kích hoạt lại kho thất bại"
        );
      } finally {
        setOpenMenuId(null);
      }
    };


  /* =========================================================
     DELETE ROW
     ========================================================= */

  const handleDeleteRow =
    async (warehouse) => {
      const confirmed =
        window.confirm(
          `Bạn có chắc muốn xóa kho "${warehouse.name}" không?`
        );


      if (!confirmed) {
        return;
      }


      try {
        await deleteWarehouse(
          warehouse.id
        );


        setSelectedIds(
          (prev) =>
            prev.filter(
              (id) =>
                id !==
                warehouse.id
            )
        );


        await fetchWarehouses(
          search,
          page
        );
      } catch (error) {
        console.error(
          "DELETE WAREHOUSE ERROR:",
          error.response?.data ||
            error
        );


        alert(
          "Xóa kho thất bại"
        );
      } finally {
        setOpenMenuId(null);
      }
    };


  /* =========================================================
     BULK DELETE
     ========================================================= */

  const handleDelete =
    async () => {
      if (
        selectedIds.length === 0
      ) {
        alert(
          "Vui lòng chọn kho cần xóa"
        );

        return;
      }


      const confirmDelete =
        window.confirm(
          `Bạn có chắc muốn xóa ${selectedIds.length} kho không?`
        );


      if (!confirmDelete) {
        return;
      }


      try {
        await Promise.all(
          selectedIds.map(
            (id) =>
              deleteWarehouse(id)
          )
        );


        setSelectedIds([]);


        await fetchWarehouses(
          search
        );


        alert(
          "Xóa thành công"
        );
      } catch (error) {
        console.error(error);

        alert(
          "Xóa thất bại"
        );
      }
    };


  /* =========================================================
     PERMISSION
     ========================================================= */

  if (
    !canDo("view_warehouse")
  ) {
    return (
      <div className="no-permission-page">
        Tài khoản không được cấp quyền
        truy cập kho
      </div>
    );
  }


  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="stock-list-page">

      {/* =====================================================
          PAGE HEADER CARD
          ===================================================== */}

      <div className="stock-page-header-card">
        <div className="stock-page-header-content">
          <div className="stock-page-kicker">
            QUẢN LÝ KHO
          </div>


          <h1 className="stock-page-title">
            Kho
          </h1>


          <p className="stock-page-description">
            Quản lý danh sách kho, địa chỉ
            và trạng thái hoạt động.
          </p>
        </div>


        <div className="stock-page-header-action">
          {canDo(
            "update_warehouse"
          ) &&
            !isWarehouseRestricted && (
              <button
                type="button"
                className="add-btn"
                onClick={() => {
                  setEditingWarehouseId(
                    null
                  );

                  resetForm();

                  setShowModal(true);
                }}
              >
                + Thêm
              </button>
            )}
        </div>
      </div>


      {/* =====================================================
          TOOLBAR CARD
          ===================================================== */}

      <div className="stock-toolbar-card">
        <div className="stock-search-group">
          <input
            className="stock-search"
            placeholder="🔍  Tìm kiếm"
            value={search}
            onChange={(event) => {
              const value =
                event.target.value;


              setSearch(value);

              setPage(1);


              fetchWarehouses(
                value,
                1,
                pageSize
              );
            }}
          />


          {selectedIds.length >
            0 && (
            <button
              type="button"
              className="bulk-delete-btn"
              onClick={
                handleDelete
              }
              title="Xóa hàng loạt"
            >
              <RiDeleteBin6Line />
            </button>
          )}
        </div>
      </div>


      {/* =====================================================
          TABLE CARD
          ===================================================== */}

      <div className="stock-table-card">

        <div className="stock-table-wrapper">
          <table className="stock-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={
                      warehouses.length >
                        0 &&
                      selectedIds.length ===
                        warehouses.length
                    }
                    onChange={
                      handleSelectAll
                    }
                  />
                </th>


                <th className="small-col">
                  Mã kho
                </th>


                <th className="wide-col">
                  Tên kho
                </th>


                <th className="flex-col">
                  Địa chỉ kho
                </th>


                <th className="small-col">
                  Mã kho kế toán
                </th>


                <th className="status-col">
                  Trạng thái
                </th>


                <th className="action-col">
                </th>
              </tr>
            </thead>


            <tbody>
              {warehouses.map(
                (
                  warehouse,
                  index
                ) => (
                  <tr
                    key={
                      warehouse.id
                    }
                    className={`warehouse-row ${
                      activeRowId ===
                        warehouse.id ||
                      openMenuId ===
                        warehouse.id
                        ? "row-active"
                        : ""
                    }`}
                    onClick={() =>
                      setActiveRowId(
                        warehouse.id
                      )
                    }
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(
                          warehouse.id
                        )}
                        onChange={() =>
                          handleSelect(
                            warehouse.id
                          )
                        }
                      />
                    </td>


                    <td>
                      {warehouse.code}
                    </td>


                    <td>
                      {warehouse.name}
                    </td>


                    <td>
                      {warehouse.address}
                    </td>


                    <td>
                      {warehouse.accountant_code ||
                        "-"}
                    </td>


                    <td>
                      <span
                        className={`status-badge ${
                          warehouse.status ===
                          "ACTIVE"
                            ? "status-active"
                            : "status-inactive"
                        }`}
                      >
                        {warehouse.status ===
                        "ACTIVE"
                          ? "Đang hoạt động"
                          : "Ngừng hoạt động"}
                      </span>
                    </td>


                    <td className="row-actions">
                      {canDo(
                        "update_warehouse"
                      ) && (
                        <button
                          type="button"
                          className="row-edit-btn"
                          title="Sửa"
                          onClick={(
                            event
                          ) => {
                            event.stopPropagation();


                            setEditingWarehouseId(
                              warehouse.id
                            );


                            setFormData(
                              {
                                code:
                                  warehouse.code ||
                                  "",

                                name:
                                  warehouse.name ||
                                  "",

                                address:
                                  warehouse.address ||
                                  "",

                                accountant_code:
                                  warehouse.accountant_code ||
                                  "",
                              }
                            );


                            setShowModal(
                              true
                            );
                          }}
                        >
                          <RiEdit2Line />
                        </button>
                      )}


                      <div className="row-more-wrapper">
                        {(canDo(
                          "update_warehouse"
                        ) ||
                          canDo(
                            "delete_warehouse"
                          )) && (
                          <button
                            type="button"
                            className={`row-more-btn ${
                              openMenuId ===
                              warehouse.id
                                ? "open"
                                : ""
                            }`}
                            title="Thao tác khác"
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();


                              setOpenMenuId(
                                openMenuId ===
                                  warehouse.id
                                  ? null
                                  : warehouse.id
                              );
                            }}
                          >
                            <RiMore2Fill />
                          </button>
                        )}


                        {openMenuId ===
                          warehouse.id && (
                          <div
                            className={`row-more-menu ${
                              warehouses.length >
                                3 &&
                              index >=
                                warehouses.length -
                                  2
                                ? "drop-up"
                                : ""
                            }`}
                          >
                            {canDo(
                              "update_warehouse"
                            ) && (
                              <button
                                type="button"
                                className="menu-item"
                                onClick={(
                                  event
                                ) => {
                                  event.stopPropagation();


                                  handleToggleStatus(
                                    warehouse
                                  );
                                }}
                              >
                                {warehouse.status ===
                                "ACTIVE" ? (
                                  <>
                                    <RiPauseCircleLine className="menu-item-icon" />

                                    <span>
                                      Ngừng hoạt động
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <RiPlayCircleLine className="menu-item-icon" />

                                    <span>
                                      Kích hoạt lại
                                    </span>
                                  </>
                                )}
                              </button>
                            )}


                            {canDo(
                              "delete_warehouse"
                            ) && (
                              <>
                                <div className="menu-divider" />


                                <button
                                  type="button"
                                  className="menu-item danger"
                                  onClick={(
                                    event
                                  ) => {
                                    event.stopPropagation();


                                    handleDeleteRow(
                                      warehouse
                                    );
                                  }}
                                >
                                  <RiDeleteBin6Line className="menu-item-icon" />

                                  <span>
                                    Xóa kho
                                  </span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>


        {/* ===================================================
            PAGINATION
            =================================================== */}

        <div className="pagination">
          <div className="pagination-left">
            Tổng số:{" "}
            <strong>
              {total}
            </strong>
          </div>


          <div className="pagination-right">
            <span>
              Số dòng/trang
            </span>


            <select
              value={pageSize}
              onChange={(
                event
              ) => {
                const value =
                  Number(
                    event.target
                      .value
                  );


                setPageSize(
                  value
                );

                setPage(1);


                fetchWarehouses(
                  search,
                  1,
                  value
                );
              }}
            >
              <option value={10}>
                10
              </option>

              <option value={20}>
                20
              </option>

              <option value={30}>
                30
              </option>

              <option value={50}>
                50
              </option>

              <option value={100}>
                100
              </option>
            </select>


            <span>
              {total > 0
                ? (page - 1) *
                    pageSize +
                  1
                : 0}
              {" - "}
              {Math.min(
                page *
                  pageSize,
                total
              )}
            </span>


            <button
              type="button"
              disabled={
                page === 1
              }
              onClick={() =>
                setPage(
                  page - 1
                )
              }
            >
              ‹
            </button>


            <button
              type="button"
              disabled={
                page ===
                totalPages
              }
              onClick={() =>
                setPage(
                  page + 1
                )
              }
            >
              ›
            </button>
          </div>
        </div>
      </div>


      {/* =====================================================
          IMPORT EXCEL INPUT
          Giữ logic cũ, không ảnh hưởng giao diện
          ===================================================== */}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        hidden
        onChange={
          handleExcelChange
        }
      />


      {/* =====================================================
          ADD / EDIT MODAL
          ===================================================== */}

      {showModal && (
        <div className="modal-overlay">
          <div className="warehouse-modal">

            <div className="modal-header">
              <h3>
                {editingWarehouseId
                  ? "Sửa Kho"
                  : "Thêm Kho"}
              </h3>


              <button
                type="button"
                onClick={() => {
                  setShowModal(
                    false
                  );

                  setEditingWarehouseId(
                    null
                  );

                  resetForm();
                }}
              >
                ×
              </button>
            </div>


            <div className="modal-form">

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Mã kho{" "}
                    <span>*</span>
                  </label>


                  <input
                    name="code"
                    value={
                      formData.code
                    }
                    onChange={
                      handleChange
                    }
                    autoFocus
                  />
                </div>


                <div className="form-group">
                  <label>
                    Tên kho{" "}
                    <span>*</span>
                  </label>


                  <input
                    name="name"
                    value={
                      formData.name
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>


                <div className="form-group wide">
                  <label>
                    Chi nhánh{" "}
                    <span>*</span>
                  </label>


                  <select>
                    <option>
                      CÔNG TY CỔ PHẦN VẬN TẢI ĐƯỜNG SẮT...
                    </option>
                  </select>
                </div>
              </div>


              <div className="form-row">
                <div className="form-group">
                  <label>
                    Vị trí địa lý
                  </label>


                  <select>
                    <option>
                      Tỉnh/Thành phố
                    </option>
                  </select>
                </div>


                <div className="form-group">
                  <label>
                    &nbsp;
                  </label>


                  <select>
                    <option>
                      Xã/Phường
                    </option>
                  </select>
                </div>


                <div className="form-group wide">
                  <label>
                    Địa chỉ{" "}
                    <span>*</span>
                  </label>


                  <textarea
                    name="address"
                    value={
                      formData.address
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>
              </div>


              <div className="form-row">
                <div className="form-group large">
                  <input
                    placeholder="Số nhà, tên đường"
                  />
                </div>
              </div>


              <div className="form-row">
                <div className="form-group large">
                  <label>
                    Mã kho kế toán
                  </label>


                  <input
                    name="accountant_code"
                    value={
                      formData.accountant_code
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>
              </div>
            </div>


            <div className="modal-footer">
              <button
                type="button"
                className="modal-footer-close-btn"
                onClick={() => {
                  setShowModal(
                    false
                  );

                  setEditingWarehouseId(
                    null
                  );

                  resetForm();
                }}
              >
                ×
              </button>


              {!editingWarehouseId && (
                <button
                  type="button"
                  className="save-more-btn"
                  onClick={() =>
                    handleSave(
                      true
                    )
                  }
                >
                  Lưu và Thêm
                </button>
              )}


              <button
                type="button"
                className="save-btn"
                onClick={() =>
                  handleSave(
                    false
                  )
                }
              >
                Lưu
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}


export default StockListPage;