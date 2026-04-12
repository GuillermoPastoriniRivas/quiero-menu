export interface LoginOutput {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    restaurantId: string;
    restaurantSlug: string;
  };
}
