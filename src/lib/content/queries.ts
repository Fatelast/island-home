export const PHOTO_QUERY = `*[_type == "photo"]
  | order(sortOrder asc, shotDate desc) {
    _id,
    title,
    alt,
    location,
    shotDate,
    camera,
    lens,
    tone,
    image,
    "dimensions": image.asset->metadata.dimensions
  }`;
