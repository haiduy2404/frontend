export const parseNumber = (
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

  if (typeof value === "number") {
    return Number.isNaN(value)
      ? 0
      : value;
  }

  const text =
    String(value).trim();

  if (!text) {
    return 0;
  }

  let normalized = text;

  if (text.includes(",")) {
    // VN:
    // 60.000,00
    // 100.500,000
    normalized = text
      .replace(/\./g, "")
      .replace(",", ".");
  } else if (
    viThousands &&
    /^\d{1,3}(\.\d{3})+$/.test(text)
  ) {
    // 300.000
    // 1.250.000
    normalized =
      text.replace(/\./g, "");
  } else if (
    (text.match(/\./g) || [])
      .length > 1
  ) {
    // 3.015.000
    // 11.000.000
    normalized =
      text.replace(/\./g, "");
  }

  const number =
    Number(normalized);

  return Number.isNaN(number)
    ? 0
    : number;
};

export const formatViNumber = (
  value,
  fractionDigits = 2
) => {
  const number =
    parseNumber(value);

  return number.toLocaleString(
    "vi-VN",
    {
      minimumFractionDigits:
        fractionDigits,
      maximumFractionDigits:
        fractionDigits,
    }
  );
};

export const formatViQuantity = (
  value
) => {
  const number =
    parseNumber(value);

  return number.toLocaleString(
    "vi-VN",
    {
      minimumFractionDigits: 3,
      maximumFractionDigits: 5,
    }
  );
};