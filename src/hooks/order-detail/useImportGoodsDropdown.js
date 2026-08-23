import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { getGoods } from "../../services/goodsService";

const extractGoodsResults = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data?.results)) {
    return data.data.results;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

const getGoodsTotalPages = (
  data,
  results,
  pageSize
) => {
  return (
    data?.data?.total_pages ||
    data?.total_pages ||
    Math.ceil(
      (
        data?.data?.count ||
        data?.count ||
        results.length
      ) / pageSize
    ) ||
    1
  );
};

const useImportGoodsDropdown = () => {
  const PAGE_SIZE = 30;

  const [goodsList, setGoodsList] =
    useState([]);

  const [goodsPage, setGoodsPage] =
    useState(1);

  const [
    goodsTotalPages,
    setGoodsTotalPages,
  ] = useState(1);

  const [
    goodsLoading,
    setGoodsLoading,
  ] = useState(false);

  const [
    showGoodsDropdown,
    setShowGoodsDropdown,
  ] = useState(false);

  const [
    activeGoodsRowId,
    setActiveGoodsRowId,
  ] = useState(null);

  const [
    goodsKeyword,
    setGoodsKeyword,
  ] = useState("");

  const [
    debouncedGoodsKeyword,
    setDebouncedGoodsKeyword,
  ] = useState("");

  const goodsSearchRequestIdRef =
    useRef(0);

  const goodsPendingRequestsRef =
    useRef(0);

  const debouncedGoodsKeywordRef =
    useRef("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGoodsKeyword(
        goodsKeyword
      );
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [goodsKeyword]);

  useEffect(() => {
    debouncedGoodsKeywordRef.current =
      debouncedGoodsKeyword;
  }, [debouncedGoodsKeyword]);

  const fetchGoodsDropdown =
    useCallback(
      async ({
        keyword = "",
        pageNumber = 1,
        append = false,
      } = {}) => {
        const keywordSnapshot =
          keyword;

        const requestId = append
          ? null
          : ++goodsSearchRequestIdRef.current;

        goodsPendingRequestsRef.current +=
          1;

        setGoodsLoading(true);

        try {
          const data = await getGoods({
            search: keywordSnapshot,
            page: pageNumber,
            page_size: PAGE_SIZE,
          });

          if (
            !append &&
            requestId !==
              goodsSearchRequestIdRef.current
          ) {
            return;
          }

          if (
            append &&
            keywordSnapshot !==
              debouncedGoodsKeywordRef.current
          ) {
            return;
          }

          const results =
            extractGoodsResults(data);

          const totalPages =
            getGoodsTotalPages(
              data,
              results,
              PAGE_SIZE
            );

          setGoodsList((prev) =>
            append
              ? [...prev, ...results]
              : results
          );

          setGoodsPage(pageNumber);
          setGoodsTotalPages(totalPages);
        } catch (error) {
          console.error(
            "LOAD GOODS DROPDOWN ERROR:",
            error.response?.data ||
              error
          );

          alert(
            "Không tải được danh sách hàng hóa"
          );
        } finally {
          goodsPendingRequestsRef.current -=
            1;

          if (
            goodsPendingRequestsRef.current ===
            0
          ) {
            setGoodsLoading(false);
          }
        }
      },
      []
    );

  useEffect(() => {
    if (!showGoodsDropdown) {
      return;
    }

    fetchGoodsDropdown({
      keyword:
        debouncedGoodsKeyword,
      pageNumber: 1,
      append: false,
    });
  }, [
    debouncedGoodsKeyword,
    showGoodsDropdown,
    fetchGoodsDropdown,
  ]);

  const openGoodsDropdown = (
    rowId,
    keyword = ""
  ) => {
    const normalizedKeyword =
      keyword || "";

    setActiveGoodsRowId(rowId);
    setShowGoodsDropdown(true);

    setGoodsKeyword(
      normalizedKeyword
    );

    setDebouncedGoodsKeyword(
      normalizedKeyword
    );
  };

  const searchGoodsForRow = (
    rowId,
    keyword = ""
  ) => {
    setActiveGoodsRowId(rowId);
    setShowGoodsDropdown(true);
    setGoodsKeyword(keyword);
  };

  const hideGoodsDropdown = () => {
    setShowGoodsDropdown(false);
  };

  const closeGoodsDropdown = () => {
    setShowGoodsDropdown(false);
    setActiveGoodsRowId(null);
    setGoodsKeyword("");
  };

  const toggleGoodsDropdown = (
    rowId,
    keyword = ""
  ) => {
    if (
      showGoodsDropdown &&
      String(activeGoodsRowId) ===
        String(rowId)
    ) {
      closeGoodsDropdown();
      return;
    }

    openGoodsDropdown(
      rowId,
      keyword
    );
  };

  const handleGoodsDropdownScroll = (
    event
  ) => {
    const element =
      event.currentTarget;

    const isBottom =
      element.scrollTop +
        element.clientHeight >=
      element.scrollHeight - 8;

    if (
      !isBottom ||
      goodsLoading ||
      goodsPage >= goodsTotalPages
    ) {
      return;
    }

    fetchGoodsDropdown({
      keyword:
        debouncedGoodsKeywordRef.current,
      pageNumber:
        goodsPage + 1,
      append: true,
    });
  };

  const refreshGoodsDropdown = () => {
    return fetchGoodsDropdown({
      keyword:
        debouncedGoodsKeywordRef.current,
      pageNumber: 1,
      append: false,
    });
  };

  return {
    goodsList,
    goodsLoading,
    showGoodsDropdown,
    activeGoodsRowId,
    hideGoodsDropdown,
    openGoodsDropdown,
    searchGoodsForRow,
    closeGoodsDropdown,
    toggleGoodsDropdown,
    handleGoodsDropdownScroll,
    refreshGoodsDropdown,
  };
};

export default useImportGoodsDropdown;