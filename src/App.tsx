import { Routes, Route } from "react-router-dom";
import CategoryManagement from "./pages/admin/CategoryManagement";

function App() {
  return (
    <Routes>
      <Route path="/admin/categories" element={<CategoryManagement />} />
    </Routes>
  );
}

export default App;