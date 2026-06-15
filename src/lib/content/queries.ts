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
