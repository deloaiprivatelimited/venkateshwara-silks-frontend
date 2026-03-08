

import { useState } from "react";
import api from "./axios";

export const useInviteLink = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Safari fallback
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-999999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }

      return true;
    } catch {
      return false;
    }
  };

  const createInvite = async () => {
    if (isCreating) return;

    setIsCreating(true);
    setCopied(false);

    try {
      const res = await api.post("/invite/create");
      const link = res.data?.link;

      if (!link) throw new Error("No link received");

      const success = await copyToClipboard(link);

      if (!success) throw new Error("Copy failed");

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