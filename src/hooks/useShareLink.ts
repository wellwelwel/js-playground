import { useEffect, useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import { createShareLink } from '../utils/shareLink';

const COPIED_FEEDBACK_DURATION = 2000;

export const useShareLink = (code: string) => {
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!linkCopied) return;

    const timeout = setTimeout(
      () => setLinkCopied(false),
      COPIED_FEEDBACK_DURATION
    );

    return () => clearTimeout(timeout);
  }, [linkCopied]);

  const share = async () => {
    const link = createShareLink(code);

    if (await copyToClipboard(link)) {
      setLinkCopied(true);
      return;
    }

    window.prompt('Copy the share link:', await link);
  };

  return { share, linkCopied };
};
