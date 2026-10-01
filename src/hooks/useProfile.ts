import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "@/services/profileService";
import type { UpdateProfileRequest, UserProfile } from "@/types/user";

const PROFILE_QUERY_KEY = ["profile"] as const;

export function useProfile(enabled = true) {
    return useQuery({
        queryKey: PROFILE_QUERY_KEY,
        queryFn: () => getProfile(),
        enabled,
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation<UserProfile, Error, UpdateProfileRequest>({
        mutationFn: (request) => updateProfile(request),
        onSuccess: (data) => {
            queryClient.setQueryData(PROFILE_QUERY_KEY, data);
        },
    });
}
