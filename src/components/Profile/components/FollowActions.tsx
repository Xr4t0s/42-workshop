import { Badge, Button } from "@radix-ui/themes";
import ClipLoader from "react-spinners/ClipLoader";

type Props = {
  ownedByCurrent: boolean;
  isFollowing: boolean;
  waiting: "" | "follow" | "unfollow";
  onFollow: () => void;
  onUnfollow: () => void;
  followDisabled: boolean;
  unfollowDisabled: boolean;
};

export function FollowActions({
  ownedByCurrent,
  isFollowing,
  waiting,
  onFollow,
  onUnfollow,
  followDisabled,
  unfollowDisabled,
}: Props) {
  if (ownedByCurrent) {
    return (
      <Badge color="green" variant="soft">
        You own this profile
      </Badge>
    );
  }
  if (!isFollowing) {
    return (
      <Button disabled={followDisabled} onClick={onFollow} highContrast>
        {waiting === "follow" ? <ClipLoader size={18} /> : "Follow"}
      </Button>
    );
  }
  return (
    <Button disabled={unfollowDisabled} color="red" onClick={onUnfollow}>
      {waiting === "unfollow" ? <ClipLoader size={18} /> : "Unfollow"}
    </Button>
  );
}
