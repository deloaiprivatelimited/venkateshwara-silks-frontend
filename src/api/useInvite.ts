import { useState } from "react";
// import api from "../api/axios";
import api from "./axios";
export const useInviteLink = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const createInvite = async () => {
    if (isCreating) return;

    setIsCreating(true);
    setCopied(false);

    try {
      const res = await api.post("/invite/create");
      const link = res.data?.link;

      if (!link) throw new Error("No link received");

      await navigator.clipboard.writeText(link);
      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      alert("Failed to create invite link");
    } finally {
      setIsCreating(false);
    }
  };

  return { createInvite, isCreating, copied };
};
