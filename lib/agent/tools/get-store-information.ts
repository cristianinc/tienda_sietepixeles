import { storeInformationOutputSchema } from "../schemas";

const value = (name: string) => process.env[name]?.trim() || null;

export async function getStoreInformation() {
  return storeInformationOutputSchema.parse({
    name: value("STORE_NAME"),
    weekdayHours: value("STORE_WEEKDAY_HOURS"),
    saturdayHours: value("STORE_SATURDAY_HOURS"),
    address: value("STORE_ADDRESS"),
    contactEmail: value("STORE_CONTACT_EMAIL"),
    shippingPolicy: value("STORE_SHIPPING_POLICY"),
    exchangePolicy: value("STORE_EXCHANGE_POLICY"),
  });
}
