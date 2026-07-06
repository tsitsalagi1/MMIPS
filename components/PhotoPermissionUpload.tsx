"use client";

import { useEffect, useId, useState } from "react";

export function PhotoPermissionUpload() {
  const [hasPhoto, setHasPhoto] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const helpId = useId();
  const warningId = useId();
  const blocked = hasPhoto && !confirmed;

  useEffect(() => {
    const form = document.querySelector<HTMLFormElement>('form[data-submit-info-form="true"]');
    const submitButton = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (!submitButton) return;

    submitButton.disabled = blocked;
    submitButton.setAttribute("aria-disabled", blocked ? "true" : "false");
    submitButton.setAttribute("data-photo-permission-blocked", blocked ? "true" : "false");

    return () => {
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-disabled");
      submitButton.removeAttribute("data-photo-permission-blocked");
    };
  }, [blocked]);

  return (
    <section className="upload-panel photo-upload-panel">
      <p className="muted">
        Upload one family-approved photo, public flyer, or awareness image. Images stay private until an admin reviews and approves the submission.
      </p>

      <label>
        Photo or flyer
        <input
          name="case_photo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          aria-describedby={helpId}
          onChange={(event) => {
            const nextHasPhoto = Boolean(event.currentTarget.files && event.currentTarget.files.length > 0 && event.currentTarget.files[0]?.size > 0);
            setHasPhoto(nextHasPhoto);
            if (!nextHasPhoto) setConfirmed(false);
          }}
        />
      </label>

      <label>
        Image description / alt text
        <input name="photo_alt_text" placeholder="Example: family-approved photo, or official public flyer" />
      </label>

      <div className={hasPhoto ? "photo-permission-card active" : "photo-permission-card"}>
        <label className="checkbox photo-permission-checkbox">
          <input
            type="checkbox"
            name="confirm_photo_permission"
            required={hasPhoto}
            aria-required={hasPhoto ? "true" : "false"}
            aria-describedby={hasPhoto ? warningId : helpId}
            checked={confirmed}
            onChange={(event) => setConfirmed(event.currentTarget.checked)}
          />
          <span>
            <strong>Photo permission{hasPhoto ? " required" : ""}</strong>
            <span>
              {hasPhoto
                ? " I have permission to share this image with MMIPS for review and possible public posting after approval."
                : " If you upload an image, you will need to confirm permission before submitting."}
            </span>
          </span>
        </label>
        {blocked ? (
          <p id={warningId} className="photo-permission-warning" role="alert">
            Please check the photo permission box to enable “Submit for review.”
          </p>
        ) : null}
      </div>

      <p id={helpId} className="small-text muted">
        Allowed image types: JPG, PNG, WebP, or GIF. Maximum size: 5 MB. Do not upload graphic images, private addresses, or images that could endanger the person/family/investigation.
      </p>
    </section>
  );
}
