// src/App.tsx
import React, { useState } from "react";
import CallAnalysisPage from "./pages/CallAnalysisPage";
import ThemePreview from "./pages/ThemePreview";

const App: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState("c");
  const showThemePicker = new URLSearchParams(window.location.search).has("themes");

  if (showThemePicker) {
    return <ThemePreview current={selectedTheme} onSelect={setSelectedTheme} />;
  }

  return <CallAnalysisPage />;
};

export default App;
