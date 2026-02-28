import SecurityLockdownEditor from "@/components/possum/SecurityLockdownEditor";

export default function EscalationPage() {
  return (
    <SecurityLockdownEditor
      title="Escalation Config"
      description="Escalation thresholds and exemption policy tuning."
    />
  );
}
