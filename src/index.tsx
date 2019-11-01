import "./styles.scss";

import * as React from "react";
import { render } from "react-dom";
import { Emulator } from "./ui";

function App() {
  return (
    <div className="App">
      <Emulator />
    </div>
  );
}

const rootElement = document.getElementById("root");
render(<App />, rootElement);
