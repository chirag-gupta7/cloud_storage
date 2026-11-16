import { useQuery } from "@tanstack/react-query";
import { getMyStars } from "../services/starsApi.js";

export function useStarsQuery() {
  return useQuery({
    queryKey: ["stars"],
    queryFn: getMyStars,
  });
}

