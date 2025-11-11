import { Avatar, Box, Button, Flex, Text } from "@radix-ui/themes";
import { ImageIcon } from "@radix-ui/react-icons";
import ClipLoader from "react-spinners/ClipLoader";
import { AVATAR_URL_MAX } from "@/config/constants";

type Props = {
  fileInputRef: React.RefObject<HTMLInputElement>;
  avatarFile: File | null;
  avatarPreview: string | null;
  avatarUrl: string | null;
  uploadPending: boolean;
  onPick: (f: File) => Promise<void>;
  onUpload: () => Promise<void>;
  onDrop: React.DragEventHandler<HTMLDivElement>;
  pickFile: () => void;
};

export default function AvatarUploader({
  fileInputRef, avatarFile, avatarPreview, avatarUrl,
  uploadPending, onPick, onUpload, onDrop, pickFile
}: Props) {
  return (
    <Box>
      <Text weight="medium">Avatar (optionnel)</Text>
      <Flex align="center" gap="3" mt="2">
        <Avatar
          src={avatarUrl || avatarPreview || undefined}
          fallback="U"
          radius="full"
          size="6"
          style={{ boxShadow: "0 8px 24px var(--black-a3)" }}
        />
        <Flex direction="column" gap="2" style={{ flex: 1 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
          />
          <Flex gap="2" wrap="wrap">
            <Button variant="soft" onClick={pickFile}><ImageIcon /> Choisir un fichier</Button>
            <Button
              variant="soft"
              onClick={onUpload}
              disabled={!avatarFile || uploadPending}
              title={!avatarFile ? "Sélectionne une image d’abord" : ""}
            >
              {uploadPending ? <ClipLoader size={16} /> : "Uploader l’avatar"}
            </Button>
            {avatarPreview && !avatarUrl && (
              <Text size="1" color="gray">Prévisualisation locale — pas encore uploadée</Text>
            )}
          </Flex>

          <div
            onDragOver={(e)=>e.preventDefault()}
            onDrop={onDrop}
            style={{
              border: "1px dashed var(--gray-a7)",
              borderRadius: 10,
              padding: 12,
              textAlign: "center",
              fontSize: 12,
              color: "var(--gray-9)"
            }}
          >
            Glisse une image ici pour la sélectionner
          </div>
        </Flex>
      </Flex>
      <Text size="1" color="gray" mt="2">PNG/JPG/WebP/GIF • 2 Mo max</Text>
      {avatarUrl && avatarUrl.length > AVATAR_URL_MAX && (
        <Text size="1" color="red" mt="1">
          URL trop longue ({avatarUrl.length} &gt; {AVATAR_URL_MAX}). Utilise un CID ou une URL courte.
        </Text>
      )}
    </Box>
  );
}
