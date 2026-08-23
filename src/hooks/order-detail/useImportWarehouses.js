import {
  useEffect,
  useState,
} from "react";

import { getWarehouses } from "../../services/warehouseService";

const extractWarehouseResults = (data) => {
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

const useImportWarehouses = () => {
  const [
    warehouseList,
    setWarehouseList,
  ] = useState([]);

  const [
    warehouseLoading,
    setWarehouseLoading,
  ] = useState(false);

  const loadWarehouses = async () => {
    try {
      setWarehouseLoading(true);

      const data = await getWarehouses({
        search: "",
        page: 1,
        page_size: 100,
      });

      setWarehouseList(
        extractWarehouseResults(data)
      );
    } catch (error) {
      console.error(
        "LOAD WAREHOUSE LIST ERROR:",
        error.response?.data || error
      );

      setWarehouseList([]);

      alert(
        "Không tải được danh sách kho"
      );
    } finally {
      setWarehouseLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  return {
    warehouseList,
    warehouseLoading,
    reloadWarehouses: loadWarehouses,
  };
};

export default useImportWarehouses;