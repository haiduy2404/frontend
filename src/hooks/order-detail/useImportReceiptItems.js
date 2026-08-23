import { useState } from "react";

import {
  createEmptyImportReceiptItem,
} from "../../utils/importReceiptMapper";

import {
  parseNumber,
  formatViNumber,
} from "../../utils/importReceiptNumber";

const useImportReceiptItems = () => {
  const [items, setItems] = useState(
    () => [
      createEmptyImportReceiptItem(1),
    ]
  );

  const [
    deletedItems,
    setDeletedItems,
  ] = useState([]);

  const createEmptyRow = () =>
    createEmptyImportReceiptItem();

  const addRow = (rowId) => {
    setItems((previous) => {
      const newRow =
        createEmptyImportReceiptItem();

      if (!rowId) {
        return [
          ...previous,
          newRow,
        ];
      }

      const index =
        previous.findIndex(
          (item) =>
            String(item.id) ===
            String(rowId)
        );

      if (index === -1) {
        return [
          ...previous,
          newRow,
        ];
      }

      return [
        ...previous.slice(
          0,
          index + 1
        ),
        newRow,
        ...previous.slice(
          index + 1
        ),
      ];
    });
  };

  const insertRowAfter = (
    rowId,
    newRow =
      createEmptyImportReceiptItem()
  ) => {
    setItems((previous) => {
      const index =
        previous.findIndex(
          (item) =>
            String(item.id) ===
            String(rowId)
        );

      if (index === -1) {
        return [
          ...previous,
          newRow,
        ];
      }

      return [
        ...previous.slice(
          0,
          index + 1
        ),
        newRow,
        ...previous.slice(
          index + 1
        ),
      ];
    });

    return newRow;
  };

  const deleteRow = (rowId) => {
    setItems((previous) => {
      const deletedItem =
        previous.find(
          (item) =>
            String(item.id) ===
            String(rowId)
        );

      if (
        deletedItem?.inventory_id
      ) {
        setDeletedItems(
          (deletedPrevious) => {
            const existed =
              deletedPrevious.some(
                (item) =>
                  String(
                    item.inventory_id
                  ) ===
                  String(
                    deletedItem.inventory_id
                  )
              );

            if (existed) {
              return deletedPrevious;
            }

            return [
              ...deletedPrevious,
              {
                ...deletedItem,
                is_delete: true,
              },
            ];
          }
        );
      }

      return previous.filter(
        (item) =>
          String(item.id) !==
          String(rowId)
      );
    });
  };

  const selectGoods = (
    rowId,
    goods
  ) => {
    if (!goods) return;

    setItems((previous) =>
      previous.map((item) => {
        if (
          String(item.id) !==
          String(rowId)
        ) {
          return item;
        }

        const quantity =
          parseNumber(
            item.actual_quantity || 0
          );

        const unitOptions =
          Array.isArray(goods.units)
            ? goods.units.map(
                (unitItem) => ({
                  unit_id:
                    unitItem.unit_id ||
                    "",

                  unit_name:
                    unitItem.unit_name ||
                    "",

                  conversion_ratio:
                    Number(
                      unitItem.conversion_ratio ||
                        1
                    ),

                  last_unit_price:
                    unitItem.last_unit_price,

                  is_default:
                    Boolean(
                      unitItem.is_default
                    ),
                })
              )
            : [];

        const defaultUnit =
          unitOptions.find(
            (unitItem) =>
              unitItem.is_default
          ) ||
          unitOptions[0] ||
          null;

        const unitPrice =
          parseNumber(
            defaultUnit
              ?.last_unit_price ||
              0
          );

        return {
          ...item,

          goods_id:
            goods.id,

          goods_code:
            goods.code ||
            goods.goods_code ||
            "",

          goods_name:
            goods.name ||
            goods.goods_name ||
            "",

          unit_id:
            defaultUnit?.unit_id ||
            "",

          unit:
            defaultUnit?.unit_name ||
            "",

          unit_options:
            unitOptions,

          conversion_ratio:
            String(
              defaultUnit
                ?.conversion_ratio ||
                1
            ),

          unit_price:
            formatViNumber(
              unitPrice,
              3
            ),

          amount:
            formatViNumber(
              Math.round(
                quantity *
                  unitPrice
              ),
              0
            ),
        };
      })
    );
  };

  const changeItemUnit = (
    rowId,
    unitId
  ) => {
    setItems((previous) =>
      previous.map((item) => {
        if (
          String(item.id) !==
          String(rowId)
        ) {
          return item;
        }

        const selectedUnit =
          item.unit_options?.find(
            (unitItem) =>
              String(
                unitItem.unit_id
              ) ===
              String(unitId)
          );

        const quantity =
          parseNumber(
            item.actual_quantity
          );

        const unitPrice =
          parseNumber(
            selectedUnit
              ?.last_unit_price ||
              0
          );

        return {
          ...item,

          unit_id: unitId,

          unit:
            selectedUnit
              ?.unit_name ||
            item.unit,

          conversion_ratio:
            selectedUnit
              ?.conversion_ratio
              ? String(
                  selectedUnit
                    .conversion_ratio
                )
              : "1",

          unit_price:
            formatViNumber(
              unitPrice,
              3
            ),

          amount:
            formatViNumber(
              Math.round(
                quantity *
                  unitPrice
              ),
              0
            ),
        };
      })
    );
  };

  const changeItemField = (
    rowId,
    field,
    value
  ) => {
    if (field === "vat") {
      setItems((previous) => {
        const firstRowId =
          previous[0]?.id;

        const oldVat =
          previous.find(
            (item) =>
              String(item.id) ===
              String(rowId)
          )?.vat;

        return previous.map(
          (item) => {
            if (
              String(item.id) ===
              String(rowId)
            ) {
              return {
                ...item,
                vat: value,
              };
            }

            if (
              String(rowId) ===
                String(firstRowId) &&
              item.vat === oldVat
            ) {
              return {
                ...item,
                vat: value,
              };
            }

            return item;
          }
        );
      });

      return;
    }

    setItems((previous) =>
      previous.map((item) => {
        if (
          String(item.id) !==
          String(rowId)
        ) {
          return item;
        }

        const nextItem = {
          ...item,
          [field]: value,
        };

        if (
          field === "marked_old"
        ) {
          nextItem.actual_quantity =
            value
              ? item.requested_quantity
              : "0,00000";
        }

        const quantity =
          parseNumber(
            nextItem.actual_quantity
          );

        const unitPrice =
          parseNumber(
            field === "unit_price"
              ? value
              : nextItem.unit_price
          );

        if (
          field ===
            "requested_quantity" ||
          field ===
            "actual_quantity" ||
          field === "unit_price" ||
          field === "marked_old"
        ) {
          nextItem.amount =
            formatViNumber(
              Math.round(
                quantity *
                  unitPrice
              ),
              0
            );
        }

        return nextItem;
      })
    );
  };

  const resetItems = () => {
    setItems([
      createEmptyImportReceiptItem(),
    ]);

    setDeletedItems([]);
  };

  return {
    items,
    setItems,

    deletedItems,
    setDeletedItems,

    createEmptyRow,
    addRow,
    insertRowAfter,
    deleteRow,

    selectGoods,
    changeItemUnit,
    changeItemField,

    resetItems,
  };
};

export default useImportReceiptItems;