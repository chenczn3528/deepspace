import React from 'react';
import Home from './Home';
import usePreventIOSRubberBand from "./hooks/usePreventIOSRubberBand.js";

function App() {
  usePreventIOSRubberBand();
  return <Home />;
}

export default App;
