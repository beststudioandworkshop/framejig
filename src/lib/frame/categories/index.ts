import type { CategoryProfile } from "../category-types"
import type { BikeType } from "../types"
import { bruiser } from "./bruiser"
import { gravel } from "./gravel"
import { mountain } from "./mountain"
import { road } from "./road"
import { touring } from "./touring"
import { track } from "./track"

/** One profile per bike type. The single source for guidance, ride feel, examples and sizes. */
export const CATEGORIES: Record<BikeType, CategoryProfile> = { road, gravel, mountain, touring, track, bruiser }
