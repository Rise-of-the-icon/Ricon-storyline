export default function FlowSteps({ currentStep }) {
  const steps = [
    { id: 1, label: "Sign up" },
    { id: 2, label: "Select twin" },
    { id: 3, label: "Subscribe" },
  ];

  return (
    <ol className="flow-steps" aria-label="Fan onboarding progress">
      {steps.map((step) => {
        const isComplete = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        return (
          <li
            key={step.id}
            className={
              isCurrent ? "flow-step is-current" : isComplete ? "flow-step is-complete" : "flow-step"
            }
            aria-current={isCurrent ? "step" : undefined}
          >
            <span className="flow-step-index">{step.id}</span>
            <span className="flow-step-label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
