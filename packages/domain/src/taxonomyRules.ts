import {
  subcategoriesByCategory,
  type SubcategoryCode,
  type WorkerCategoryCode,
} from "./taxonomy";

/** Returns true only when the internal subcategory belongs to the worker category. */
export function isSubcategoryOf(
  category: WorkerCategoryCode,
  subcategory: SubcategoryCode,
): boolean {
  return subcategoriesByCategory[category].includes(subcategory);
}

/** Server-side taxonomy invariant used by every complaint write boundary. */
export function assertTaxonomySelection(
  category: WorkerCategoryCode,
  subcategory?: SubcategoryCode,
): void {
  if (subcategory && !isSubcategoryOf(category, subcategory)) {
    throw new Error(`Subcategory ${subcategory} does not belong to category ${category}.`);
  }
}

export function categoryForSubcategory(subcategory: SubcategoryCode): WorkerCategoryCode {
  const category = subcategory.slice(0, 3) as WorkerCategoryCode;
  if (!subcategoriesByCategory[category].includes(subcategory)) {
    throw new Error(`Unknown taxonomy parent for ${subcategory}.`);
  }
  return category;
}
