import { checkInventory } from "./check-inventory";
import { getProductDetails } from "./get-product-details";
import { getStoreInformation } from "./get-store-information";
import { searchProducts } from "./search-products";

export const agentTools = {
  search_products: searchProducts,
  get_product_details: getProductDetails,
  check_inventory: checkInventory,
  get_store_information: getStoreInformation,
};
