import { Badge, Callout } from "@radix-ui/themes";
import { InfoCircledIcon } from "@radix-ui/react-icons";

export default function FeedbackCallouts({
  errorMsg,
  successId,
}: {
  errorMsg?: string | null;
  successId?: string | null;
}) {
  return (
    <>
      {errorMsg && (
        <Callout.Root color="red" variant="soft">
          <Callout.Icon><InfoCircledIcon /></Callout.Icon>
          <Callout.Text>{errorMsg}</Callout.Text>
        </Callout.Root>
      )}
      {successId && (
        <Callout.Root color="green" variant="soft">
          <Callout.Icon><InfoCircledIcon /></Callout.Icon>
          <Callout.Text>Profil créé ! <Badge color="green">{successId}</Badge></Callout.Text>
        </Callout.Root>
      )}
    </>
  );
}
