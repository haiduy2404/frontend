import { Outlet } from "react-router-dom";

import "../styles/ImportLayout.css";


function ImportLayout() {
  return (
    <div className="import-layout-page">
      <div className="import-layout-content">
        <Outlet />
      </div>
    </div>
  );
}


export default ImportLayout;