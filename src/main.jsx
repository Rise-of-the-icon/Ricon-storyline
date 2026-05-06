import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./design-system/themes.css";
import AppShell from "./app/AppShell.tsx";
import RICONStoryline from "../ricon-storyline.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppShell>
      <RICONStoryline />
    </AppShell>
  </StrictMode>
);
