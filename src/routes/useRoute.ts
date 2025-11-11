import { useEffect, useMemo, useState } from "react";
import { parseHash, type Route } from "./router";

export function useRoute() {
  const [route, setRoute] = useState<Route>(() => parseHash());

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const activeTab = useMemo<"home" | "explore" | "following" | "me" | { kind: string; id: string; }>(() => {
    if (route.name === "home") return "home";
    if (route.name === "following") return "following";
    if (route.name === "me") return "me";
	const m = route.name.match(/^\/post\/([0-9a-zA-Z:_.-]+)$/);
  	if (m) return { kind: "post", id: m[1] };
    return "explore";
  }, [route.name]);

  return { route, setRoute, activeTab };
}
