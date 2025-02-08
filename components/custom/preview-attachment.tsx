import { Attachment } from "ai";

import { LoaderIcon } from "./icons";

// PreviewAttachment component - Displays a preview of uploaded files/attachments in the chat
export const PreviewAttachment = ({
  attachment,  // The attachment object containing file details
  isUploading = false,  // Boolean flag to indicate upload status
}: {
  attachment: Attachment;
  isUploading?: boolean;
}) => {
  // Destructure necessary properties from the attachment
  const { name, url, contentType } = attachment;

  return (
    // Container for the entire attachment preview
    <div className="flex flex-col gap-2 max-w-16">
      {/* Preview container with fixed dimensions and styling */}
      <div className="h-20 w-16 bg-muted rounded-md relative flex flex-col items-center justify-center">
        {/* Conditional rendering based on content type */}
        {contentType ? (
          contentType.startsWith("image") ? (
            // If the content is an image, display it
            // NOTE: next/image is recommended but disabled for this use case
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={name ?? "An image attachment"}
              className="rounded-md size-full object-cover"
            />
          ) : (
            // Placeholder for non-image files
            <div className=""></div>
          )
        ) : (
          // Placeholder for files with no content type
          <div className=""></div>
        )}

        {/* Loading spinner overlay shown during upload */}
        {isUploading && (
          <div className="animate-spin absolute text-zinc-500">
            <LoaderIcon />
          </div>
        )}
      </div>

      {/* File name display with truncation for long names */}
      <div className="text-xs text-zinc-500 max-w-16 truncate">{name}</div>
    </div>
  );
};
