import SecurityLockdownEditor from "@/components/possum/SecurityLockdownEditor";

export default function LockdownPage() {
  return (
    <SecurityLockdownEditor
      title="Lockdown Config"
      description="Threshold policy, exemptions, and escalation behavior."
    />
  );
}
