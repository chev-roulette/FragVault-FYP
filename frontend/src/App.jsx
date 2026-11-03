import {

  BrowserRouter,
  Routes,
  Route

} from "react-router-dom";

import Sidebar from "./layouts/Sidebar";

import Dashboard from "./pages/Dashboard";
import Segmentation from "./pages/Segmentation";
import AttackSimulation from "./pages/AttackSimulation";
import Statistics from "./pages/Statistics";
import Reconstruction from "./pages/Reconstruction";

function App() {

  return (

    <BrowserRouter>

      <div className="bg-[#050816]">

        {/* ----------------------------------- */}
        {/* FIXED SIDEBAR */}
        {/* ----------------------------------- */}

        <div className="fixed
          left-0
          top-0
          h-screen
          w-67.5
          z-50">

          <Sidebar />

        </div>


        {/* ----------------------------------- */}
        {/* SCROLLABLE CONTENT */}
        {/* ----------------------------------- */}

        <main className="ml-67.5
          min-h-screen
          overflow-y-auto
          px-10
          py-8">

          <Routes>

            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/segmentation"
              element={<Segmentation />}
            />

            <Route
              path="/attack-simulation"
              element={<AttackSimulation />}
            />

            <Route
              path="/statistics"
              element={<Statistics />}
            />

            <Route
              path="/reconstruction"
              element={<Reconstruction />}
            />

          </Routes>

        </main>

      </div>

    </BrowserRouter>

  );

}

export default App;