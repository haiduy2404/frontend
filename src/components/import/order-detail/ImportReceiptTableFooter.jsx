function ImportReceiptTableFooter({
  totalRows,
}) {
  return (
    <div className="table-bottom-bar">
      <div>
        Tổng số:{" "}
        <strong>
          {totalRows}
        </strong>
      </div>

      <div className="table-pagination">
        <span>
          Số dòng/trang
        </span>

        <select defaultValue={20}>
          <option value={20}>
            20
          </option>

          <option value={50}>
            50
          </option>

          <option value={100}>
            100
          </option>
        </select>

        <strong>
          1 - {totalRows}
        </strong>

        <button disabled>
          ‹
        </button>

        <button disabled>
          ›
        </button>
      </div>
    </div>
  );
}

export default ImportReceiptTableFooter;