import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import { Provider } from "./state/AppState";
import "@fontsource-variable/inter";
import "@fontsource/hind-siliguri/400.css";
import "@fontsource/hind-siliguri/500.css";
import "@fontsource/hind-siliguri/600.css";
import "./styles.css";
import "./refinement.css";
const Router =
  import.meta.env.BASE_URL === "/uiu-compass/" ? HashRouter : BrowserRouter;
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router basename={import.meta.env.BASE_URL}>
      <Provider>
        <App />
      </Provider>
    </Router>
  </React.StrictMode>,
);
