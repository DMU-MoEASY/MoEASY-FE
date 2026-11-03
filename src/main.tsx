
  import { createRoot } from "react-dom/client";
  import { AsyncScreen } from "./app/components/ScreenStates";
  import App from "./app/App.tsx";
  import { PwaPrompt } from "./app/components/PwaPrompt.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <>
      <AsyncScreen><App /></AsyncScreen>
      <PwaPrompt />
    </>,
  );
