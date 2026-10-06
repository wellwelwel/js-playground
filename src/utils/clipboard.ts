// Safari only accepts asynchronous clipboard data through a ClipboardItem promise.
export const copyToClipboard = async (
  pendingText: Promise<string>
): Promise<boolean> => {
  try {
    const blob = pendingText.then(
      (text) => new Blob([text], { type: 'text/plain' })
    );

    await navigator.clipboard.write([
      new ClipboardItem({ 'text/plain': blob }),
    ]);

    return true;
  } catch {
    return false;
  }
};
