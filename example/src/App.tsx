import React from "react";

import { ABProvider, useExperiment } from "react-abawesome";

const ExampleButtonComponent = () => {
  const { variant, loading, error, useQuestion, log } = useExperiment("d170a11c-ddf7-4b56-c7a7-08d76b79126a");
  const {show} = useQuestion();
  if (loading) return <>Loading</>;
  if (error) return <>{String(error)}</>;
  return (
    <>
      variant: {variant}
      <button style={{ color: variant }} onClick={() => show()}>
        question
      </button>
      <button style={{ color: variant }} onClick={() => log("a3a0d81e-c3f3-4f60-b419-08d76b79126b")}>
        event
      </button>
    </>
  );
};

export default () => {
  return (
    <ABProvider config={{ projectId: "fb6c4e35-d4d1-4ab4-9f03-08d76b78fc20" }}>
      <ExampleButtonComponent />
    </ABProvider>
  );
};
