// src/utils/signerUtils.js

export const normalizeSignerPosition = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();


// =========================================================
// SIGNER THEO POSITION USER
// =========================================================

export const SIGNER_DEFINITIONS = {
  cungTieu: {
    key: "cungTieu",
    label: "PT cung tiêu",
    match: (position) =>
      position.includes("cung tieu"),
  },

  thuKho: {
    key: "thuKho",
    label: "Thủ kho",
    required: true,
    match: (position) =>
      position.startsWith("thu kho"),
  },

  vatLieuVien: {
    key: "vatLieuVien",
    label: "Vật liệu viên",
    match: (position) =>
      position.includes("vat lieu vien"),
  },

  phoPhongKHVT: {
    key: "phoPhongKHVT",
    label: "Phó phòng KHVT",
    match: (position) =>
      position.includes("pho phong khvt"),
  },

  truongPhongKHVT: {
    key: "truongPhongKHVT",
    label: "Trưởng phòng KHVT",
    match: (position) =>
      position === "tp khvt" ||
      position.includes("truong phong khvt"),
  },

  phongKHVT: {
    key: "phongKHVT",
    label: "Phòng KHVT",
    match: (position) =>
      position === "tp khvt" ||
      position.includes("truong phong khvt") ||
      position.includes("phong khvt"),
  },

  giamDoc: {
    key: "giamDoc",
    label: "Giám đốc",
    match: (position) =>
      position === "giam doc",
  },
};


// =========================================================
// NHÓM SIGNER THEO NGHIỆP VỤ
// =========================================================

export const IMPORT_RECEIPT_SIGNER_KEYS = [
  "cungTieu",
  "thuKho",
  "vatLieuVien",
  "phoPhongKHVT",
  "truongPhongKHVT",
  "giamDoc",
];

export const RELEASE_SIGNER_KEYS = [
  "cungTieu",
  "thuKho",
  "phongKHVT",
  "giamDoc",
];


// =========================================================
// METADATA KEY DÙNG TRÊN CÁC FORM IN
// =========================================================

export const SIGNER_METADATA_KEYS = {
  nguoiLapPhieu: "NGƯỜI LẬP PHIẾU",

  thuKhoNhapKho: "THỦ KHO_NHẬP KHO",

  thuKho: "THỦ KHO",

  phongKHVT: "PHÒNG KHVT",

  keToanTruong: "KẾ TOÁN TRƯỞNG",

  giamDoc: "GIÁM ĐỐC",

  phoGiamDoc: "PHÓ GIÁM ĐỐC",

  truongPhongVatTu: "TP KẾ HOẠCH - VẬT TƯ",

  daiDienKyThuat: "TP KỸ THUẬT",
};


// =========================================================
// USER HELPERS
// =========================================================

export const extractSignerUsers = (response) => {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.results)) {
    return payload.data.results;
  }

  return [];
};


export const prepareSignerUsers = (response) => {
  return extractSignerUsers(response)
    .filter((user) => {
      const fullName = String(
        user?.full_name || ""
      ).trim();

      return (
        fullName &&
        !fullName.toLowerCase().includes("test")
      );
    })
    .sort((a, b) =>
      String(a.full_name || "").localeCompare(
        String(b.full_name || ""),
        "vi"
      )
    );
};


export const getSignerFields = (keys = []) => {
  return keys
    .map((key) => SIGNER_DEFINITIONS[key])
    .filter(Boolean);
};


export const getUsersBySignerField = (
  users,
  fieldOrKey
) => {
  const field =
    typeof fieldOrKey === "string"
      ? SIGNER_DEFINITIONS[fieldOrKey]
      : fieldOrKey;

  if (!field) return [];

  return (users || []).filter((user) => {
    const position = normalizeSignerPosition(
      user?.position?.name ||
        user?.position_name ||
        user?.position ||
        ""
    );

    return field.match(position);
  });
};


// =========================================================
// METADATA HELPERS
// =========================================================

export const normalizeMetadataKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();


export const buildMetadataMap = (response) => {
  const payload = response?.data ?? response;

  const results = Array.isArray(payload)
    ? payload
    : [];

  return results.reduce((acc, item) => {
    acc[normalizeMetadataKey(item?.key)] =
      item?.value || "";

    return acc;
  }, {});
};


export const getSignerMetadataValue = (
  metadataMap,
  key
) => {
  return (
    metadataMap?.[
      normalizeMetadataKey(key)
    ] || ""
  );
};