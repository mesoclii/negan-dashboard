export type DashboardNavItem = {
  href: string;
  label: string;
  creatorOnly?: boolean;
};

export type DashboardNavTopLink = DashboardNavItem;

export type DashboardNavSection = {
  label: string;
  defaultOpen?: boolean;
  items: DashboardNavItem[];
};

export function getDashboardNavTopLinks(isMasterOwner = false): DashboardNavTopLink[] {
  return [{ href: "/dashboard/system-health", label: "System Health" }].filter(
    (item) => !item.creatorOnly || isMasterOwner
  );
}

export function getDashboardNavSections(isMasterOwner = false): DashboardNavSection[] {
  const sections: DashboardNavSection[] = [
    {
      label: "Guild Control",
      defaultOpen: true,
      items: [
        { href: "/dashboard/bot-personalizer", label: "Bot Personalizer" },
        { href: "/dashboard/bot-masters", label: "Bot Masters" },
        { href: "/dashboard/channels", label: "Channels" },
        { href: "/dashboard/ai/learning", label: "Possum AI" },
        { href: "/dashboard/giveaways", label: "Giveaways" },
        { href: "/dashboard/jed", label: "Jed" },
        { href: "/dashboard/music", label: "Music" },
        { href: "/dashboard/vip", label: "VIP" },
        { href: "/dashboard/tickets", label: "Tickets" },
        { href: "/dashboard/selfroles", label: "Self Roles" },
      ],
    },
    {
      label: "Automation",
      items: [
        { href: "/dashboard/slash-commands", label: "Slash Commands" },
        { href: "/dashboard/commands", label: "!Command Studio" },
        { href: "/dashboard/automations/studio", label: "Automation Studio" },
        { href: "/dashboard/event-reactor", label: "Event Reactor" },
        { href: "/dashboard/runtime-router", label: "Runtime Router" },
      ],
    },
    {
      label: "Community + Feeds",
      items: [
        { href: "/dashboard/community-studio", label: "Community Studio" },
        { href: "/dashboard/channel-flow", label: "Channel Flow" },
        { href: "/dashboard/signal-relay", label: "Signal Relay" },
      ],
    },
    {
      label: "Security",
      items: [
        { href: "/dashboard/security", label: "Security" },
        { href: "/dashboard/moderator", label: "Moderator" },
        { href: "/dashboard/governance", label: "Governance" },
        { href: "/dashboard/security/onboarding", label: "Onboarding" },
        { href: "/dashboard/security/verification", label: "Verification" },
        { href: "/dashboard/security/account-integrity", label: "Account Integrity" },
        { href: "/dashboard/security/link-intel", label: "Link Intel" },
        { href: "/dashboard/security/threat-intel", label: "Threat Intel" },
        { href: "/dashboard/security/behavioral-drift", label: "Behavioral Drift" },
        { href: "/dashboard/security/trust-weight", label: "Trust Weight" },
        { href: "/dashboard/security/risk-escalation", label: "Risk Escalation" },
        { href: "/dashboard/security/containment", label: "Containment" },
        { href: "/dashboard/security/forensics", label: "Forensics" },
        { href: "/dashboard/security/staff-activity", label: "Staff Activity" },
        { href: "/dashboard/security/crew-security", label: "Crew Security" },
        { href: "/dashboard/security/shadow-layer", label: "Shadow Layer" },
        { href: "/dashboard/security-enforcer", label: "Security Enforcer" },
        { href: "/dashboard/blacklist", label: "Blacklist" },
        { href: "/dashboard/failsafe", label: "Failsafe" },
      ],
    },
    {
      label: "Economy",
      items: [
        { href: "/dashboard/economy", label: "Economy" },
        { href: "/dashboard/economy/store", label: "Store" },
        { href: "/dashboard/economy/progression", label: "Progression" },
        { href: "/dashboard/prestige", label: "Prestige" },
        { href: "/dashboard/economy/radio-birthday", label: "Birthdays" },
        { href: "/dashboard/economy/leaderboard", label: "Invite Tracker" },
        { href: "/dashboard/profile", label: "Profile" },
        { href: "/dashboard/halloffame", label: "Hall Of Fame" },
        { href: "/dashboard/achievements", label: "Achievements" },
        { href: "/dashboard/loyalty", label: "Loyalty" },
      ],
    },
    {
      label: "Fun + Games",
      items: [
        { href: "/dashboard/games", label: "Games" },
        { href: "/dashboard/crew", label: "Crew" },
        { href: "/dashboard/dominion", label: "Dominion" },
        { href: "/dashboard/contracts", label: "Contracts" },
        { href: "/dashboard/catdrop", label: "Cat Drop" },
        { href: "/dashboard/rarespawn", label: "Rare Spawn" },
        { href: "/dashboard/range", label: "Range" },
        { href: "/dashboard/truthdare", label: "Truth Dare" },
        { href: "/dashboard/pokemon-catching", label: "Pokemon Catching" },
        { href: "/dashboard/pokemon-battle", label: "Pokemon Battle" },
        { href: "/dashboard/pokemon-trade", label: "Pokemon Trade" },
      ],
    },
    {
      label: "Premium",
      items: [
        { href: "/dashboard/premium-features", label: "Premium Features" },
        { href: "/dashboard/heist", label: "Heist" },
        { href: "/dashboard/tts", label: "TTS" },
        { href: "/dashboard/ai/persona", label: "Persona AI" },
        { href: "/dashboard/premium-features#advanced-security", label: "Advanced Security Suite" },
        { href: "/dashboard/premium-features#automation-suite", label: "Automation + Commands" },
        { href: "/dashboard/ai/openai-platform", label: "Creator AI Platform", creatorOnly: true },
      ],
    },
  ];

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.creatorOnly || isMasterOwner),
    }))
    .filter((section) => section.items.length > 0);
}
