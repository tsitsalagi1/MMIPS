"use client";

import { useEffect, useId, useMemo, useState } from "react";

type PhotoChoice = {
  index: number;
  name: string;
  url: string;
  photoType: string;
  caption: string;
  useOnProfile: boolean;
  useOnFlyer: boolean;
  isMain: boolean;
};

const PHOTO_TYPES = [
  ["main_face", "Main face photo"],
  ["full_body", "Full-body photo"],
  ["identifying_mark", "Tattoo / scar / identifying mark"],
  ["clothing_item", "Clothing / item"],
  ["vehicle", "Vehicle"],
  ["official_flyer", "Official flyer"],
  ["other", "Other approved image"]
];

const MAX_PHOTOS = 5;

function defaultTypeForIndex(index: number) {
  if (index === 0) return "main_face";
  if (index === 1) return "full_body";
  return "identifying_mark";
}

export function PhotoPermissionUpload() {
  const [photos, setPhotos] = useState<PhotoChoice[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const helpId = useId();
  const warningId = useId();
  const previewId = useId();
  const hasPhotos = photos.length > 0;
  const tooManyPhotos = photos.length > MAX_PHOTOS;
  const blocked = (hasPhotos && !confirmed) || tooManyPhotos;

  const flyerPhotos = useMemo(() => photos.filter((photo) => photo.useOnFlyer).slice(0, 5), [photos]);
  const mainPhoto = photos.find((photo) => photo.isMain) || photos[0] || null;

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

  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    };
  }, [photos]);

  function updatePhoto(index: number, update: Partial<PhotoChoice>) {
    setPhotos((current) => current.map((photo) => {
      if (photo.index !== index) return photo;
      return { ...photo, ...update };
    }));
  }

  function setMain(index: number) {
    setPhotos((current) => current.map((photo) => ({
      ...photo,
      isMain: photo.index === index,
      useOnProfile: photo.index === index ? true : photo.useOnProfile,
      useOnFlyer: photo.index === index ? true : photo.useOnFlyer
    })));
  }

  const preferences = JSON.stringify({
    photos: photos.map((photo, sortOrder) => ({
      index: photo.index,
      originalName: photo.name,
      photoType: photo.photoType,
      caption: photo.caption,
      useOnProfile: photo.useOnProfile,
      useOnFlyer: photo.useOnFlyer,
      isMain: photo.isMain,
      sortOrder
    }))
  });

  return (
    <section className="upload-panel photo-upload-panel multi-photo-panel">
      <p className="muted">
        Upload up to five family-approved photos or flyers. Photos stay private until an admin reviews the submission. Choose what each photo is for and preview how the flyer may look before submitting.
      </p>

      <label>
        Photos or flyers
        <input
          name="profile_photos"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          aria-describedby={`${helpId} ${previewId}`}
          onChange={(event) => {
            photos.forEach((photo) => URL.revokeObjectURL(photo.url));
            const files = Array.from(event.currentTarget.files || []);
            const next = files.map((file, index) => ({
              index,
              name: file.name,
              url: URL.createObjectURL(file),
              photoType: defaultTypeForIndex(index),
              caption: "",
              useOnProfile: true,
              useOnFlyer: index < 4,
              isMain: index === 0
            }));
            setPhotos(next);
            if (!next.length) setConfirmed(false);
          }}
        />
      </label>

      <input type="hidden" name="photo_preferences" value={preferences} />

      {hasPhotos ? (
        <div className="photo-review-builder" id={previewId}>
          <div className="section-heading-row">
            <div>
              <h3>Photo choices and permissions</h3>
              <p className="muted small-text">Set the main photo and decide which images can appear on the public profile, flyer, and share image. Admin can still remove unsafe images before publishing.</p>
            </div>
            <span className={tooManyPhotos ? "badge badge-warning" : "badge badge-neutral"}>{photos.length}/{MAX_PHOTOS} selected</span>
          </div>

          {tooManyPhotos ? (
            <p className="notice warning" role="alert">Please choose no more than {MAX_PHOTOS} images before submitting.</p>
          ) : null}

          <div className="photo-choice-grid">
            {photos.map((photo) => (
              <article className={photo.isMain ? "photo-choice-card main" : "photo-choice-card"} key={`${photo.name}-${photo.index}`}>
                <img src={photo.url} alt={`Preview of ${photo.name}`} />
                <div className="photo-choice-body">
                  <p className="small-text"><strong>{photo.name}</strong></p>
                  <label>Photo type
                    <select value={photo.photoType} onChange={(event) => updatePhoto(photo.index, { photoType: event.target.value })}>
                      {PHOTO_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label>Caption / identifying detail
                    <input value={photo.caption} onChange={(event) => updatePhoto(photo.index, { caption: event.target.value })} placeholder="Example: tattoo on left forearm" />
                  </label>
                  <label className="checkbox compact-checkbox">
                    <input type="radio" name="main_photo_choice" checked={photo.isMain} onChange={() => setMain(photo.index)} /> Main profile/flyer photo
                  </label>
                  <label className="checkbox compact-checkbox">
                    <input type="checkbox" checked={photo.useOnProfile} onChange={(event) => updatePhoto(photo.index, { useOnProfile: event.target.checked })} /> Public profile
                  </label>
                  <label className="checkbox compact-checkbox">
                    <input type="checkbox" checked={photo.useOnFlyer} onChange={(event) => updatePhoto(photo.index, { useOnFlyer: event.target.checked })} /> Flyer / share image
                  </label>
                </div>
              </article>
            ))}
          </div>

          <div className="flyer-preview-card" aria-label="Flyer preview before submission">
            <div className="flyer-preview-header">
              <span>Flyer preview</span>
              <strong>{mainPhoto ? "Main + selected detail photos" : "No photos selected"}</strong>
            </div>
            <div className="flyer-preview-layout">
              <div className="flyer-preview-main">
                {mainPhoto ? <img src={mainPhoto.url} alt="Selected main flyer photo preview" /> : <span>Main photo</span>}
              </div>
              <div className="flyer-preview-details">
                {flyerPhotos.filter((photo) => !photo.isMain).slice(0, 4).map((photo) => (
                  <div className="flyer-preview-detail" key={`flyer-${photo.index}`}>
                    <img src={photo.url} alt={photo.caption || photo.name} />
                    <small>{photo.caption || PHOTO_TYPES.find(([value]) => value === photo.photoType)?.[1] || "Detail photo"}</small>
                  </div>
                ))}
                {flyerPhotos.filter((photo) => !photo.isMain).length === 0 ? <p className="muted small-text">Select flyer/detail photos to preview a collage.</p> : null}
              </div>
            </div>
            <p className="muted small-text">Preview is for submitter review only. Nothing publishes until MMIPS reviews safety, consent, and official contact information.</p>
          </div>
        </div>
      ) : null}

      <div className={hasPhotos ? "photo-permission-card active" : "photo-permission-card"}>
        <label className="checkbox photo-permission-checkbox">
          <input
            type="checkbox"
            name="confirm_photo_permission"
            required={hasPhotos}
            aria-required={hasPhotos ? "true" : "false"}
            aria-describedby={hasPhotos ? warningId : helpId}
            checked={confirmed}
            onChange={(event) => setConfirmed(event.currentTarget.checked)}
          />
          <span>
            <strong>Photo/flyer permission{hasPhotos ? " required" : ""}</strong>
            <span>
              {hasPhotos
                ? " I reviewed the photo and flyer preview. I have permission to share these images with MMIPS for review and possible public posting after approval, subject to safety edits."
                : " If you upload images, you will need to confirm permission before submitting."}
            </span>
          </span>
        </label>
        {blocked ? (
          <p id={warningId} className="photo-permission-warning" role="alert">
            {tooManyPhotos ? `Please choose no more than ${MAX_PHOTOS} images.` : "Please check the photo/flyer permission box to enable “Submit for review.”"}
          </p>
        ) : null}
      </div>

      <p id={helpId} className="small-text muted">
        Allowed image types: JPG, PNG, WebP, or GIF. Maximum size: 5 MB per image, up to {MAX_PHOTOS} images. Do not upload graphic images, private addresses, or images that could endanger the person/family/investigation.
      </p>
    </section>
  );
}
