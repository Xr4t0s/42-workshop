import { isValidSuiObjectId } from "@mysten/sui/utils";

/* --------------------------------- Types --------------------------------- */
export type Route =
  | { name: "home" }
  | { name: "explore" }
  | { name: "following" }
  | { name: "me" }
  | { name: "profile"; id: string }
  | { name: "post"; id: string };

/* --------------------------------- Parser -------------------------------- */
export function parseHash(): Route {
  const raw = (window.location.hash || "").replace(/^#\/?/, "").trim();
  if (!raw) return { name: "home" };

  const [first, second] = raw.split("/");

  switch (first) {
    case "home":
      return { name: "home" };
    case "explore":
      return { name: "explore" };
    case "following":
      return { name: "following" };
    case "me":
      return { name: "me" };
    case "profile":
      if (second && isValidSuiObjectId(second)) return { name: "profile", id: second };
      break;
    case "post":
      if (second && isValidSuiObjectId(second)) return { name: "post", id: second };
      break;
  }
  
  if (isValidSuiObjectId(raw)) return { name: "profile", id: raw };

  return { name: "explore" };
}

/* --------------------------------- Navigate -------------------------------- */
export function navigate(to: Route) {
  let target = "";

  switch (to.name) {
    case "home":
      target = "/home";
      break;
    case "explore":
      target = "/explore";
      break;
    case "following":
      target = "/following";
      break;
    case "me":
      target = "/me";
      break;
    case "profile":
      target = `/profile/${to.id}`;
      break;
    case "post":
      target = `/post/${to.id}`;
      break;
  }

  if (window.location.hash !== `${target}`) {
    window.location.hash = target;
  }
}
