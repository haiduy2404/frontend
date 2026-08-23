function ImportOrderPagination({
  total,

  page,
  pageSize,

  currentRowCount,

  onPageSizeChange,
  onPreviousPage,
  onNextPage,
}) {
  const totalPages =
    Math.max(
      1,
      Math.ceil(
        total / pageSize
      )
    );

  return (
    <div className="warehouse-import-pagination">
      <div className="import-pagination-size">
        <span>
          Hiển thị
        </span>

        <select
          value={pageSize}
          onChange={(event) =>
            onPageSizeChange(
              Number(
                event.target.value
              )
            )
          }
        >
          <option value={10}>
            10
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
      </div>

      <div className="import-pagination-navigation">
        <button
          type="button"
          disabled={page <= 1}
          onClick={
            onPreviousPage
          }
        >
          ‹
        </button>

        <span className="import-pagination-current">
          {page}
        </span>

        <span className="import-pagination-total-page">
          / {totalPages}
        </span>

        <button
          type="button"
          disabled={
            page >= totalPages ||
            currentRowCount ===
              0
          }
          onClick={
            onNextPage
          }
        >
          ›
        </button>
      </div>
    </div>
  );
}

export default ImportOrderPagination;