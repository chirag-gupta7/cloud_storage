import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth, RequireNoAuth } from "./state/auth.jsx";
import { AppShell } from "./ui/AppShell.jsx";
import { LoginPage } from "./ui/pages/LoginPage.jsx";
import { RegisterPage } from "./ui/pages/RegisterPage.jsx";
import { DrivePage } from "./ui/pages/DrivePage.jsx";
import { FolderPage } from "./ui/pages/FolderPage.jsx";
import { SharedPage } from "./ui/pages/SharedPage.jsx";
import { SharedByMePage } from "./ui/pages/SharedByMePage.jsx";
import { TrashPage } from "./ui/pages/TrashPage.jsx";
import { StarredPage } from "./ui/pages/StarredPage.jsx";
import { PublicLinkPage } from "./ui/pages/PublicLinkPage.jsx";
import { NotFoundPage } from "./ui/pages/NotFoundPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RequireNoAuth>
            <LoginPage />
          </RequireNoAuth>
        }
      />
      <Route
        path="/register"
        element={
          <RequireNoAuth>
            <RegisterPage />
          </RequireNoAuth>
        }
      />
      <Route path="/public/:token" element={<PublicLinkPage />} />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/app/drive" replace />} />
        <Route path="drive" element={<DrivePage />} />
        <Route path="folders/:folderId" element={<FolderPage />} />
        <Route path="shared" element={<SharedPage />} />
        <Route path="shared-by-me" element={<SharedByMePage />} />
        <Route path="trash" element={<TrashPage />} />
        <Route path="starred" element={<StarredPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/app/drive" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
