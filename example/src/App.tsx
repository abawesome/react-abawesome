import React from "react";

import { ABProvider, useExperiment } from "react-abawesome";

const ExampleButtonComponent = () => {
  const { variant, log, loading, error } = useExperiment("buttonExperiment1");
  if (loading) return <>Loading</>;
  if (error) return <>{String(error)}</>;
  return (
    <button style={{ color: variant }} onClick={() => log("buttonPressed")}>
      I'm a button
    </button>
  );
};

export default () => {
  return (
    <ABProvider config={{ projectId: "myNewProject" }}>
      <ExampleButtonComponent />
    </ABProvider>
  );
};
