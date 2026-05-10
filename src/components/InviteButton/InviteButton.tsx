import React, { useState } from "react";
import { InviteModal } from "../Modal/InviteModal";
import { IconUserPlus } from "@tabler/icons-react";
import { Button } from "@mantine/core";

export const InviteButton = ({ className }: { className?: string }) => {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  return (
    <>
      {inviteModalOpen && (
        <InviteModal closeInviteModal={() => setInviteModalOpen(false)} />
      )}
      <Button
        variant="unstyled"
        className={className}
        title="Convidar"
        onClick={() => setInviteModalOpen(true)}
      >
        <IconUserPlus size={13} />
      </Button>
    </>
  );
};
