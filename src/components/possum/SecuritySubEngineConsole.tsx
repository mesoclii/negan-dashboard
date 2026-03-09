"use client";

import CatalogEngineConsole from "@/components/possum/CatalogEngineConsole";

type RelatedLink = {
  label: string;
  route: string;
  reason?: string;
};

export default function SecuritySubEngineConsole({
  engineKey,
  title,
  intro,
  related = [],
}: {
  engineKey: string;
  title: string;
  intro: string;
  related?: RelatedLink[];
}) {
  return (
    <CatalogEngineConsole
      engineKey={engineKey}
      title={title}
      description={intro}
      links={related.map((item) => ({ href: item.route, label: item.label }))}
    />
  );
}
