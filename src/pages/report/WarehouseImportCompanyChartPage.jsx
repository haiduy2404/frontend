import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "../../styles/WarehouseImportCompanyChartPage.css";
import { getWarehouseReceiptCompanySummary } from "../../services/warehouseReceiptReportService";

function WarehouseImportCompanyChartPage() {
  const [searchParams] = useSearchParams();

  const [reportRows, setReportRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const unwrapData = (response) => response?.data || response;

const getChartStep = (value) => {
  const number = Number(value || 0);

  if (number <= 0) return 1000000;

  if (number < 10000000) return 1000000; // X triệu
  if (number < 100000000) return 10000000; // XX triệu
  if (number < 1000000000) return 100000000; // XXX triệu

  if (number < 5000000000) return 500000000; // vài tỉ
  if (number < 10000000000) return 1000000000; // nhiều tỉ

  return 5000000000;
};

const roundUpChartMax = (value) => {
  const number = Number(value || 0);

  if (number <= 0) return 1000000;

  const step = getChartStep(number);

  return Math.ceil(number / step) * step;
};

  const parseMoney = (value) => {
    if (value === null || value === undefined || value === "") return 0;
    if (typeof value === "number") return value;

    const text = String(value).trim();

    if (text.includes(",") && text.includes(".")) {
      return Number(text.replace(/\./g, "").replace(",", ".")) || 0;
    }

    if (text.includes(",")) {
      return Number(text.replace(",", ".")) || 0;
    }

    return Number(text) || 0;
  };

  const formatMoney = (value) => {
    return parseMoney(value).toLocaleString("vi-VN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const getMetricLabels = (key) => {
    const labels = {
      goodsAmount: "Tổng tiền hàng",
      vatAmount: "Thuế VAT",
      totalAmount: "Tổng tiền",
    };

    return labels[key] || key;
  };

  const selectedMetrics = useMemo(() => {
    const raw = searchParams.get("metrics");

    if (!raw) {
      return ["totalAmount"];
    }

    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [searchParams]);

  const chartData = useMemo(() => {
    return reportRows.map((company) => ({
      companyName: company.company_name || "-",
      goodsAmount: parseMoney(company.company_goods_amount),
      vatAmount: parseMoney(company.company_vat_amount),
      totalAmount: parseMoney(company.company_total_amount),
    }));
  }, [reportRows]);

  const fetchChartData = async () => {
    try {
      setLoading(true);

      const params = {};

      if (searchParams.get("start_date")) {
        params.start_date = searchParams.get("start_date");
      }

      if (searchParams.get("end_date")) {
        params.end_date = searchParams.get("end_date");
      }

      if (searchParams.get("company_id")) {
        params.company_id = searchParams.get("company_id");
      }

      if (searchParams.get("company_ids")) {
        params.company_ids = searchParams.get("company_ids");
      }

      const response = await getWarehouseReceiptCompanySummary(params);
      const data = unwrapData(response);

      const results = Array.isArray(data?.data?.results)
        ? data.data.results
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data)
        ? data
        : [];

      setReportRows(results);
    } catch (error) {
      console.error("LOAD WAREHOUSE IMPORT CHART ERROR:", error.response?.data || error);
      alert("Không tải được dữ liệu biểu đồ báo cáo");
      setReportRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [searchParams]);

    const chartMax = useMemo(() => {
    const maxValue = chartData.reduce((max, row) => {
    const rowMax = Math.max(
        selectedMetrics.includes("goodsAmount") ? row.goodsAmount : 0,
        selectedMetrics.includes("vatAmount") ? row.vatAmount : 0,
        selectedMetrics.includes("totalAmount") ? row.totalAmount : 0
    );

        return Math.max(max, rowMax);
    }, 0);

    return roundUpChartMax(maxValue);
    }, [chartData, selectedMetrics]);

    const chartTicks = useMemo(() => {
    const step = getChartStep(chartMax);
    const ticks = [];

    for (let value = 0; value <= chartMax; value += step) {
        ticks.push(value);
    }

    return ticks;
    }, [chartMax]);

  return (
    <div className="warehouse-import-chart-page">
      <div className="warehouse-import-chart-card">
        <div className="warehouse-import-chart-header">
          <div>
            <h1>BIỂU ĐỒ BÁO CÁO NHẬP KHO</h1>
            <p>So sánh giá trị nhập kho theo công ty</p>
          </div>

          <button type="button" onClick={() => window.close()}>
            Đóng tab
          </button>
        </div>

        <div className="warehouse-import-chart-content">
          {loading && (
            <div className="chart-empty">Đang tải dữ liệu biểu đồ...</div>
          )}

          {!loading && chartData.length === 0 && (
            <div className="chart-empty">Không có dữ liệu biểu đồ</div>
          )}

          {!loading && chartData.length > 0 && (
            <ResponsiveContainer width="100%" height={Math.max(360, chartData.length * 72)}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 16, right: 32, left: 180, bottom: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    type="number"
                    domain={[0, chartMax]}
                    ticks={chartTicks}
                    tickFormatter={(value) => formatMoney(value)}
                />
                <YAxis
                  type="category"
                  dataKey="companyName"
                  width={180}
                />
                <Tooltip formatter={(value) => formatMoney(value)} />
                <Legend />
                    {selectedMetrics.includes("goodsAmount") && (
                    <Bar
                        dataKey="goodsAmount"
                        name={getMetricLabels("goodsAmount")}
                        fill="#2563eb"
                    />
                    )}

                    {selectedMetrics.includes("vatAmount") && (
                    <Bar
                        dataKey="vatAmount"
                        name={getMetricLabels("vatAmount")}
                        fill="#f59e0b"
                    />
                    )}

                    {selectedMetrics.includes("totalAmount") && (
                    <Bar
                        dataKey="totalAmount"
                        name={getMetricLabels("totalAmount")}
                        fill="#16a34a"
                    />
                    )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default WarehouseImportCompanyChartPage;