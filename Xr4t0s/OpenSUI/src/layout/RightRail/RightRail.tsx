import React from "react";
import { Separator, Text } from "@radix-ui/themes";
import TopUsersRightRail from "./components/TopUsers";
import { navigate } from "../../routes/router";

export function PageShellWithRightRail() {
  const styles: Record<string, React.CSSProperties> = {
	
    right: {
      width: "min(360px, 90vw)",
      border: "1px solid var(--gray-a4)",
      borderRadius: 14,
      background:
        "linear-gradient(180deg, color-mix(in oklab, var(--color-panel) 94%, transparent 6%), color-mix(in oklab, var(--color-panel) 98%, transparent 2%))",
      boxShadow: "0 12px 34px var(--black-a6)",
      padding: 8,
      backdropFilter: "saturate(140%) blur(6px)",
      position: "sticky",
      top: 16,
    },
    footer: {
      paddingTop: 8,
      textAlign: "center",
    },
  };

  return (
      <aside style={styles.right} aria-label="Top Users">
        <TopUsersRightRail
          limit={10}
          onOpen={(profileId) => navigate({ name: "profile", id: profileId })}
        />
        <Separator my="3" size="4" />
          <Text size="1" color="gray">
            Classement basé sur les followers on-chain.
          </Text>
      </aside>
  );
}

export default PageShellWithRightRail;
