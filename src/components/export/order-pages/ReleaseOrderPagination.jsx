function ReleaseOrderPagination({
  total,
  page,
  pageSize,

  onPageSizeChange,
  onPreviousPage,
  onNextPage,
}) {
  const start =
    total > 0
      ? (page - 1) *
          pageSize +
        1
      : 0;


  const end =
    Math.min(
      page * pageSize,
      total
    );


  return (
    <div className="release-order-pagination">
      <div className="release-order-pagination-size">
        <span>
          Hiển thị
        </span>

        <select
          value={pageSize}
          onChange={
            onPageSizeChange
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


      <div className="release-order-pagination-nav">
        <button
          type="button"
          disabled={
            page <= 1
          }
          onClick={
            onPreviousPage
          }
        >
          ‹
        </button>

        <strong>
          {start} - {end}
        </strong>

        <button
          type="button"
          disabled={
            page *
              pageSize >=
            total
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


export default ReleaseOrderPagination;