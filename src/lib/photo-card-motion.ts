const MAX_TILT = 3;
const MAX_SHINE_OFFSET = 18;

interface PhotoCardMotionInput {
  pointerX: number;
  pointerY: number;
  width: number;
  height: number;
}

interface PhotoCardMotion {
  rotationX: number;
  rotationY: number;
  shineX: number;
  shineY: number;
}

const clamp = (value: number, minimum: number, maximum: number) => (
  Math.min(Math.max(value, minimum), maximum)
);

export function getPhotoCardMotion({
  pointerX,
  pointerY,
  width,
  height,
}: PhotoCardMotionInput): PhotoCardMotion {
  const normalizedX = clamp(pointerX / Math.max(width, 1), 0, 1) * 2 - 1;
  const normalizedY = clamp(pointerY / Math.max(height, 1), 0, 1) * 2 - 1;

  return {
    rotationX: -normalizedY * MAX_TILT || 0,
    rotationY: normalizedX * MAX_TILT || 0,
    shineX: normalizedX * MAX_SHINE_OFFSET || 0,
    shineY: normalizedY * MAX_SHINE_OFFSET || 0,
  };
}
