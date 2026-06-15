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

export const PROJECTS_QUERY = `*[_type == "project"]
  | order(sortOrder asc, _createdAt asc) {
    _id,
    title,
    summary,
    status,
    techStack,
    repoUrl,
    demoUrl,
    "coverImage": coverImage.asset->url,
    coverTone
  }`;

export const PROFILE_QUERY = `*[_id == "profile" && _type == "profile"][0] {
  facts,
  links
}`;

export const NOTES_QUERY = `*[_type == "note"]
  | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    description,
    publishedAt,
    tags
  }`;

export const NOTE_BY_SLUG_QUERY = `*[
  _type == "note" && slug.current == $slug
][0] {
  _id,
  title,
  "slug": slug.current,
  description,
  publishedAt,
  tags,
  body
}`;
