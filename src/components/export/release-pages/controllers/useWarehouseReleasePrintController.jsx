import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserNames } from "../../../../services/authService";
import {
  RELEASE_SIGNER_KEYS,
  getSignerFields,
  prepareSignerUsers,
  getUsersBySignerField,
} from "../../../../utils/signerUtils";

const RELEASE_SIGNER_FIELDS =
  getSignerFields(RELEASE_SIGNER_KEYS);

const EMPTY_RELEASE_SIGNERS = Object.fromEntries(
  RELEASE_SIGNER_FIELDS.map((field) => [field.key, ""])
);

const RELEASE_SIGNERS_STORAGE_KEY =
  "warehouse-release-signers-session";

const PRINT_SIGNER_KEYS = {
  industrialA4: [
    "cungTieu",
    "thuKho",
    "phongKHVT",
    "giamDoc",
  ],
  industrialA5: [
    "cungTieu",
    "thuKho",
    "phongKHVT",
    "giamDoc",
  ],
  applicationA5: [
    "cungTieu",
    "thuKho",
    "phongKHVT",
    "giamDoc",
  ],
  processingA5: [
    "thuKho",
    "cungTieu",
  ],
};

const PRINT_FORMS = [
  {
    key: "industrialA4",
    label: "Phiếu xuất kho A4",
    description: "Công nghiệp",
  },
  {
    key: "industrialA5",
    label: "Phiếu xuất kho A5",
    description: "Công nghiệp",
  },
  {
    key: "applicationA5",
    label: "Phiếu xuất kho A5",
    description: "Vận dụng",
  },
  {
    key: "processingA5",
    label: "Phiếu xuất kho A5",
    description: "Chế biến",
  },
];

const PRINT_FORM_NAMES = {
  industrialA4: "A4 Công nghiệp",
  industrialA5: "A5 Công nghiệp",
  applicationA5: "A5 Vận dụng",
  processingA5: "A5 Chế biến",
};

const PRINT_ROUTES = {
  industrialA4: (releaseCode) =>
    `/dashboard/activity/export/release-print-industrial-a4/${releaseCode}`,

  industrialA5: (releaseCode) =>
    `/dashboard/activity/export/release-print-industrial-a5/${releaseCode}`,

  applicationA5: (releaseCode) =>
    `/dashboard/activity/export/release-print-application-a5/${releaseCode}`,

  processingA5: (releaseCode) =>
    `/dashboard/activity/export/release-print-processing-a5/${releaseCode}`,
};

const getStoredReleaseSigners = () => {
  try {
    const rawValue = sessionStorage.getItem(
      RELEASE_SIGNERS_STORAGE_KEY
    );

    if (!rawValue) {
      return { ...EMPTY_RELEASE_SIGNERS };
    }

    return {
      ...EMPTY_RELEASE_SIGNERS,
      ...(JSON.parse(rawValue) || {}),
    };
  } catch (error) {
    console.error(
      "READ RELEASE SIGNERS STORAGE ERROR:",
      error
    );

    return { ...EMPTY_RELEASE_SIGNERS };
  }
};

function useWarehouseReleasePrintController() {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [releaseCode, setReleaseCode] = useState("");
  const [printForm, setPrintForm] = useState("industrialA4");

  const [signerUsers, setSignerUsers] = useState([]);
  const [signerUsersLoading, setSignerUsersLoading] =
    useState(false);

  const [printSigners, setPrintSigners] = useState(
    getStoredReleaseSigners
  );

  useEffect(() => {
    try {
      sessionStorage.setItem(
        RELEASE_SIGNERS_STORAGE_KEY,
        JSON.stringify(printSigners)
      );
    } catch (error) {
      console.error(
        "SAVE RELEASE SIGNERS STORAGE ERROR:",
        error
      );
    }
  }, [printSigners]);

  const activeSignerFields = useMemo(
    () =>
      getSignerFields(
        PRINT_SIGNER_KEYS[printForm] || []
      ),
    [printForm]
  );

  const loadSignerUsers = async () => {
    try {
      setSignerUsersLoading(true);

      const response = await getUserNames();

      setSignerUsers(
        prepareSignerUsers(response)
      );
    } catch (error) {
      console.error(
        "LOAD RELEASE SIGNERS ERROR:",
        error.response?.data || error
      );

      setSignerUsers([]);

      alert(
        error.response?.data?.message ||
          "Không tải được danh sách người ký"
      );
    } finally {
      setSignerUsersLoading(false);
    }
  };

  const openPrintModal = async (
    code,
    formKey
  ) => {
    if (!code) {
      alert("Không tìm thấy mã phiếu xuất kho");
      return;
    }

    if (!PRINT_ROUTES[formKey]) {
      alert("Không tìm thấy mẫu phiếu in");
      return;
    }

    setReleaseCode(code);
    setPrintForm(formKey);
    setOpen(true);

    if (signerUsers.length === 0) {
      await loadSignerUsers();
    }
  };

  const closePrintModal = () => {
    if (signerUsersLoading) return;
    setOpen(false);
  };

  const handleChangePrintSigner = (
    key,
    fullName
  ) => {
    setPrintSigners((previous) => ({
      ...previous,
      [key]: fullName,
    }));
  };

  const handleConfirmPrint = () => {
    if (!releaseCode) {
      alert("Không tìm thấy mã phiếu xuất kho");
      return;
    }

    const routeBuilder =
      PRINT_ROUTES[printForm];

    if (!routeBuilder) {
      alert("Không tìm thấy mẫu phiếu in");
      return;
    }

    const printState = {
      signerCungTieu: String(
        printSigners.cungTieu || ""
      ).trim(),

      signerThuKho: String(
        printSigners.thuKho || ""
      ).trim(),

      signerPhongKHVT: String(
        printSigners.phongKHVT || ""
      ).trim(),

      signerGiamDoc: String(
        printSigners.giamDoc || ""
      ).trim(),

      printForm,
    };

    setOpen(false);

    navigate(
      routeBuilder(releaseCode),
      {
        state: printState,
      }
    );
  };

  return {
    open,
    releaseCode,
    printForm,
    printSigners,

    signerUsers,
    signerUsersLoading,
    activeSignerFields,

    printForms: PRINT_FORMS,
    printFormName:
      PRINT_FORM_NAMES[printForm] ||
      printForm,

    openPrintModal,
    closePrintModal,
    handleChangePrintSigner,
    handleConfirmPrint,

    getUsersBySignerField: (field) =>
      getUsersBySignerField(
        signerUsers,
        field
      ),
  };
}

export default useWarehouseReleasePrintController;
