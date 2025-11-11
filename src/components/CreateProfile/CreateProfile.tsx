import { useEffect, useMemo, useState } from "react";
import { Box, Button, Callout, Flex, Heading, Separator, Text } from "@radix-ui/themes";
import { InfoCircledIcon } from "@radix-ui/react-icons";

import { useCreateProfileTx } from "@/hooks/profiles/useCreateProfileTx";
import { useAvatarUpload } from "@/hooks/profiles/useAvatarUpload";

import { USERNAME_MAX, DESC_MAX } from "@/config/constants";
import { isUsernameOk, isDescOk, isAvatarUrlTooLong } from "./utils/validators";
import { computeHandle, computeInitials } from "./utils/format";

import { uploadAvatarPinataFront } from "@/utils/upload";
import { resizeImage } from "@/utils/image";

import AvatarUploader from "./components/AvatarUploader";
import UsernameField from "./components/UsernameField";
import BioField from "./components/BioField";
import LivePreview from "./components/LivePreview";
import FeedbackCallouts from "./components/FeedbackCallouts";

export default function CreateProfile() {
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");

  const handle = useMemo(() => computeHandle(username), [username]);
  const initials = useMemo(() => computeInitials(username), [username]);

  const usernameOk = isUsernameOk(username);
  const descOk = isDescOk(description);

  const PINATA_JWT_RAW = import.meta.env.VITE_PINATA_JWT as string | undefined;

  const uploadAvatar = async (file: File) => {
    if (!PINATA_JWT_RAW || PINATA_JWT_RAW.trim().length === 0) {
      throw new Error("PINATA_JWT manquant (VITE_PINATA_JWT dans .env).");
    }
    const jwt = PINATA_JWT_RAW.startsWith("Bearer ")
      ? PINATA_JWT_RAW
      : `Bearer ${PINATA_JWT_RAW}`;

    const resized = await resizeImage(file, 320, 0.85);
    return uploadAvatarPinataFront(resized, jwt);
  };

  const {
    fileInputRef,
    avatarFile,
    avatarPreview,
    avatarUrl,
    uploadPending,
    errorMsg: avatarErr,
    setErrorMsg: setAvatarErr,
    pickFile,
    onPick,
    onDrop,
    onUpload,
    setAvatarUrl,
  } = useAvatarUpload(uploadAvatar);

  const avatarTooLong = isAvatarUrlTooLong(avatarUrl);

  const { callCreate, isPending, errorMsg, setErrorMsg, successId } = useCreateProfileTx(() => {

  });

  useEffect(() => {
    if (errorMsg && usernameOk && descOk) setErrorMsg(null);
  }, [usernameOk, descOk, errorMsg, setErrorMsg]);

  const canSubmit =
    usernameOk &&
    descOk &&
    !isPending &&
    !uploadPending &&
    !avatarTooLong;

  const submit = () => {
    if (!canSubmit) return;
    setErrorMsg(null);
    callCreate(username.trim(), description.trim(), avatarUrl ?? undefined);
  };

  return (
    <Box p="4">
      <Heading size="6">Créer mon profil</Heading>
      <Text color="gray" size="2">Choisis un nom, une bio, et (optionnel) un avatar.</Text>

      <Separator my="4" />

      <Flex gap="5" wrap="wrap">
        <Box style={{ minWidth: 320, flex: 1 }}>
          <Flex direction="column" gap="4">
            <UsernameField
              value={username}
              setValue={(v) => {
                setUsername(v);
              }}
              isOk={usernameOk}
              handle={handle}
            />

            <BioField
              value={description}
              setValue={setDescription}
              isOk={descOk}
            />

            <AvatarUploader
              fileInputRef={fileInputRef}
              avatarFile={avatarFile}
              avatarPreview={avatarPreview}
              avatarUrl={avatarUrl}
              uploadPending={uploadPending}
              onPick={onPick}
              onUpload={onUpload}
              onDrop={onDrop}
              pickFile={pickFile}
            />

            {(avatarErr || avatarTooLong) && (
              <Callout.Root color="red" variant="soft">
                <Callout.Icon><InfoCircledIcon /></Callout.Icon>
                <Callout.Text>
                  {avatarErr || `URL trop longue (${avatarUrl?.length}) — max autorisé: ${/* from constants */ 2048}`}
                </Callout.Text>
              </Callout.Root>
            )}

            <Flex gap="3" mt="2">
              <Button onClick={submit} disabled={!canSubmit}>
                {isPending ? "Création…" : "Créer mon profil"}
              </Button>
              <Button
                variant="soft"
                onClick={() => {
                  setUsername("");
                  setDescription("");
                  setAvatarUrl(null);
                  setErrorMsg(null);
                  setAvatarErr(null);
                }}
              >
                Réinitialiser
              </Button>
            </Flex>

            <FeedbackCallouts errorMsg={errorMsg} successId={successId} />
          </Flex>
        </Box>

        <LivePreview
          username={username}
          description={description}
          handle={handle}
          avatarUrl={avatarUrl}
          avatarPreview={avatarPreview}
          initials={initials}
        />
      </Flex>

      <Separator my="4" />
      <Text size="1" color="gray">
        Nom: 3–{USERNAME_MAX} caractères • Bio: 1–{DESC_MAX} caractères.
      </Text>
    </Box>
  );
}
