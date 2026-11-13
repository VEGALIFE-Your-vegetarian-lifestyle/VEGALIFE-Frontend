import AppRoutes from "@/app/routes";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}

export default App;
