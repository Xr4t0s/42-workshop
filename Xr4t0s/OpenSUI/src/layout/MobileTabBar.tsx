import { Text } from "@radix-ui/themes";
import {
  HomeIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  PersonIcon,
} from "@radix-ui/react-icons";

type Tab = "home" | "explore" | "following" | "me";

export function MobileTabBar({
  active,
  onHome,
  onExplore,
  onFollowing,
  onMe,
}: {
  active: Tab;
  onHome: () => void;
  onExplore: () => void;
  onFollowing: () => void;
  onMe: () => void;
}) {
  const Item = ({
    label,
    isActive,
    onClick,
    icon,
  }: {
    label: string;
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
  }) => (
    <button
      className={`bottom-tab ${isActive ? "is-active" : ""}`}
      onClick={onClick}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
    >
      <div className="bottom-tab__icon">{icon}</div>
      <Text size="1" className="bottom-tab__label">
        {label}
      </Text>
    </button>
  );

  return (
    <nav className="bottom-nav" role="navigation">
      <Item label="Home"      isActive={active === "home"}      onClick={onHome}      icon={<HomeIcon />} />
      <Item label="Explore"   isActive={active === "explore"}   onClick={onExplore}   icon={<MagnifyingGlassIcon />} />
      <Item label="Following" isActive={active === "following"} onClick={onFollowing} icon={<HeartIcon />} />
      <Item label="Me"        isActive={active === "me"}        onClick={onMe}        icon={<PersonIcon />} />
    </nav>
  );
}
