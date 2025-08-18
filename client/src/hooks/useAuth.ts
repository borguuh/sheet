import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const token = localStorage.getItem("token");
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: !!token,
    retry: false,
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          throw new Error("Authentication failed");
        }
        throw new Error("Failed to fetch user");
      }
      
      return response.json();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!token && !!user && !error,
    token,
  };
}
