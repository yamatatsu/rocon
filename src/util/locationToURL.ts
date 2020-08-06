import { Location } from "../core/Location";

export const locationToURL = (location: Location): string => {
  return `${location.pathname}${location.search ? "?" + location.search : ""}${
    location.hash ? "#" + location.hash : ""
  }`;
};